#include "cJSON.h"
#include "driver/gpio.h"
#include "driver/i2c_master.h"
#include "driver/ledc.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <stdio.h>
#include <stdlib.h>

// Custom Utilities & Sensors
#include "sens_aht21.hpp"
#include "sens_bme280.hpp"
#include "sens_ens160.hpp"
#include "sens_pca9548a.hpp"
#include "util_i2c.hpp"
#include "util_pwm.hpp"
#include "util_server.hpp"
#include "util_wifi.hpp"

static const char *TAG = "AHU_MAIN";

// ==========================================
// 1. PIN DEFINITIONS & ACTUATOR CONFIG
// ==========================================
// Relays
#define PIN_RELAY_COOL 13
#define PIN_RELAY_HEAT 33
#define PIN_RELAY_HUM 32
#define PIN_RELAY_EXTRA 23
#define PIN_RELAY_HUM_BACKUP 14

const uint32_t RELAY_ON_STATE = 1;
const uint32_t RELAY_OFF_STATE = !RELAY_ON_STATE;

// PWM Devices (Servos, RGB LED, Buzzer)
PwmUtil servo_mix_damper(19, LEDC_CHANNEL_0, LEDC_TIMER_0);
PwmUtil servo_main_blower(18, LEDC_CHANNEL_1, LEDC_TIMER_0);

PwmUtil led_red(25, LEDC_CHANNEL_2, LEDC_TIMER_1);
PwmUtil led_green(26, LEDC_CHANNEL_3, LEDC_TIMER_1);
PwmUtil led_blue(27, LEDC_CHANNEL_4, LEDC_TIMER_1);

PwmUtil buzzer(4, LEDC_CHANNEL_5, LEDC_TIMER_2);

struct ActuatorState {
  float mix_damper = 0.0;
  float cool_coil = 0.0;
  float heat_coil = 0.0;
  float humidifier = 0.0;
  float main_blower = 0.0;
  bool backup_hum_active = false;
} actuators;

// ==========================================
// 2. I2C MUX & SENSOR INSTANCES
// ==========================================
static i2c_master_dev_handle_t mux_dev_handle = NULL;

// Separate instances so internal calibration/states don't collide across
// channels
static sens_aht21::AHT21 aht_return, aht_mixed, aht_release, aht_outdoor;
static sens_ens160::ENS160 ens_return, ens_mixed, ens_release, ens_outdoor;
static sens_bme280::BME280 bme_cooler, bme_heater;

// ==========================================
// 3. HARDWARE HELPER FUNCTIONS
// ==========================================
void init_relays() {
  const gpio_num_t relays[] = {
      (gpio_num_t)PIN_RELAY_COOL, (gpio_num_t)PIN_RELAY_HEAT,
      (gpio_num_t)PIN_RELAY_HUM, (gpio_num_t)PIN_RELAY_EXTRA};
  for (int i = 0; i < 4; i++) {
    gpio_reset_pin(relays[i]);
    gpio_set_direction(relays[i], GPIO_MODE_OUTPUT);
    gpio_set_level(relays[i], RELAY_OFF_STATE);
  }
  gpio_reset_pin((gpio_num_t)PIN_RELAY_HUM_BACKUP);
  gpio_set_direction((gpio_num_t)PIN_RELAY_HUM_BACKUP, GPIO_MODE_OUTPUT);
  gpio_set_level((gpio_num_t)PIN_RELAY_HUM_BACKUP,
                 1); // Default to HIGH (button unpressed)
}

void set_rgb(float r_percent, float g_percent, float b_percent) {
  uint32_t r_duty = (uint32_t)(r_percent * 8191.0 / 100.0);
  uint32_t g_duty = (uint32_t)(g_percent * 8191.0 / 100.0);
  uint32_t b_duty = (uint32_t)(b_percent * 8191.0 / 100.0);
  led_red.set_raw_duty(r_duty);
  led_green.set_raw_duty(g_duty);
  led_blue.set_raw_duty(b_duty);
}

void play_tone(uint32_t freq_hz, int duration_ms) {
  if (freq_hz > 0) {
    ledc_set_freq(LEDC_LOW_SPEED_MODE, LEDC_TIMER_2, freq_hz);
    buzzer.set_raw_duty(4095); // 50% volume
  } else {
    buzzer.set_raw_duty(0);
  }
  vTaskDelay(pdMS_TO_TICKS(duration_ms));
  buzzer.set_raw_duty(0);
}

void play_sound_startup() {
  play_tone(1000, 100);
  vTaskDelay(pdMS_TO_TICKS(50));
  play_tone(1500, 100);
  vTaskDelay(pdMS_TO_TICKS(50));
  play_tone(2000, 200);
}

void play_sound_error() {
  play_tone(250, 300);
  vTaskDelay(pdMS_TO_TICKS(100));
  play_tone(250, 300);
}

// ==========================================
// 4. I2C MULTIPLEXER & SENSOR LOGIC
// ==========================================
esp_err_t init_mux(i2c_master_bus_handle_t bus) {
  i2c_device_config_t mux_cfg = {};
  mux_cfg.dev_addr_length = I2C_ADDR_BIT_LEN_7;
  mux_cfg.device_address = 0x70;
  mux_cfg.scl_speed_hz = 100000;
  return i2c_master_bus_add_device(bus, &mux_cfg, &mux_dev_handle);
}

esp_err_t select_mux_channel(uint8_t channel) {
  if (channel > 7 || mux_dev_handle == NULL)
    return ESP_ERR_INVALID_ARG;
  uint8_t control_register = (1 << channel);
  return i2c_master_transmit(mux_dev_handle, &control_register, 1, -1);
}

void read_publish_aht_ens(uint8_t ch, sens_aht21::AHT21 &aht,
                          sens_ens160::ENS160 &ens, const char *topic_suffix,
                          uint32_t ts, bool &err_flag) {
  float t = 0.0f, h = 0.0f;
  uint16_t co2 = 0;

  if (select_mux_channel(ch) == ESP_OK) {
    if (aht.read(t, h) == ESP_OK) {
      ens.set_environment(t, h); // Feed compensation
      sens_ens160::Ens160Data ens_data;
      if (ens.read_data(ens_data) == ESP_OK)
        co2 = ens_data.eco2;
    } else {
      err_flag = true;
    }
  } else {
    err_flag = true;
  }

  char payload[256];
  snprintf(payload, sizeof(payload),
           "{\"topic\":\"ahu/telemetry/%s\", \"ts\":%lu, \"temp\":%.2f, "
           "\"hum\":%.2f, \"co2\":%d, \"pressure\":null}",
           topic_suffix, ts, t, h, co2);
  ServerUtil::send_ws_data(payload);
}

void read_publish_bme(uint8_t ch, sens_bme280::BME280 &bme,
                      const char *topic_suffix, uint32_t ts, bool &err_flag) {
  float t = 0.0f, h = 0.0f, p = 0.0f;

  if (select_mux_channel(ch) == ESP_OK) {
    sens_bme280::Bme280Data bme_data;
    if (bme.read_data(bme_data) == ESP_OK) {
      t = bme_data.temperature;
      h = bme_data.humidity;
      p = bme_data.pressure;
    } else {
      err_flag = true;
    }
  } else {
    err_flag = true;
  }

  char payload[256];
  snprintf(payload, sizeof(payload),
           "{\"topic\":\"ahu/telemetry/%s\", \"ts\":%lu, \"temp\":%.2f, "
           "\"hum\":%.2f, \"co2\":null, \"pressure\":%.2f}",
           topic_suffix, ts, t, h, p);
  ServerUtil::send_ws_data(payload);
}

// ==========================================
// 5. WEBSOCKET COMMAND HANDLER
// ==========================================
void on_ws_cmd(const char *data) {
  ESP_LOGI(TAG, "COMMAND RECEIVED | Payload: %s", data);
  cJSON *root = cJSON_Parse(data);
  if (root == NULL)
    return;

  cJSON *item;

  cJSON *topic = cJSON_GetObjectItem(root, "topic");
  if (topic && topic->valuestring) {
    if (strncmp(topic->valuestring, "ahu/telemetry/room", 18) == 0 ||
        strcmp(topic->valuestring, "ahu/telemetry/release_flow") == 0) {
      // Relay this telemetry to all connected dashboard clients
      ServerUtil::send_ws_data(data);
    }
  }

  if ((item = cJSON_GetObjectItem(root, "mix_damper"))) {
    actuators.mix_damper = (float)item->valuedouble;
    static int current_mix_angle = 80;
    int target_angle = 80 - (int)(actuators.mix_damper * 0.8);

    while (current_mix_angle != target_angle) {
      current_mix_angle += (current_mix_angle < target_angle) ? 1 : -1;
      servo_mix_damper.set_angle_180(current_mix_angle);
      vTaskDelay(pdMS_TO_TICKS(10)); // Increase this number to move even slower
    }
  }
  if ((item = cJSON_GetObjectItem(root, "main_blower"))) {
    actuators.main_blower = (float)item->valuedouble;
    // servo_main_blower.set_angle_270((int)(actuators.main_blower * 2.7));
    static int current_blower_angle = 0;
    int target_angle = (int)(actuators.main_blower * 2.7);

    while (current_blower_angle != target_angle) {
      current_blower_angle += (current_blower_angle < target_angle) ? 1 : -1;
      servo_main_blower.set_angle_270(current_blower_angle);
      vTaskDelay(pdMS_TO_TICKS(10)); // Increase this number to move even slower
    }
  }
  if ((item = cJSON_GetObjectItem(root, "cool_coil"))) {
    actuators.cool_coil = (float)item->valuedouble;
    gpio_set_level((gpio_num_t)PIN_RELAY_COOL,
                   actuators.cool_coil > 0 ? RELAY_ON_STATE : RELAY_OFF_STATE);
  }
  if ((item = cJSON_GetObjectItem(root, "heat_coil"))) {
    actuators.heat_coil = (float)item->valuedouble;
    gpio_set_level((gpio_num_t)PIN_RELAY_HEAT,
                   actuators.heat_coil > 0 ? RELAY_ON_STATE : RELAY_OFF_STATE);
  }
  if ((item = cJSON_GetObjectItem(root, "humidifier"))) {
    actuators.humidifier = (float)item->valuedouble;
    bool target_state = actuators.humidifier > 0;
    // 1. Standard Relay (Continuous)
    gpio_set_level((gpio_num_t)PIN_RELAY_HUM,
                   actuators.humidifier > 0 ? RELAY_ON_STATE : RELAY_OFF_STATE);

    // 2. Backup Mist Maker (Momentary GND pulse ONLY when state changes)
    // if (target_state != actuators.backup_hum_active) {
    gpio_set_level((gpio_num_t)PIN_RELAY_HUM_BACKUP,
                   0);              // Pull to GND (press button)
    vTaskDelay(pdMS_TO_TICKS(500)); // Hold for 150ms
    gpio_set_level((gpio_num_t)PIN_RELAY_HUM_BACKUP, 1); // Release to HIGH

    actuators.backup_hum_active = target_state; // Save current state
                                                // }
  }

  cJSON_Delete(root);
}

// ==========================================
// 6. MAIN APPLICATION
// ==========================================
extern "C" void app_main(void) {
  ESP_LOGI(TAG, "Starting AHU Controller...");

  // Init Core Hardware
  init_relays();
  servo_mix_damper.init(50);
  servo_main_blower.init(50);
  led_red.init(5000);
  led_green.init(5000);
  led_blue.init(5000);
  buzzer.init(2000);

  set_rgb(100, 100, 0); // Yellow = Booting
  play_sound_startup();

  // Init Communications (Access Point mode)
  WifiUtil::init_ap(CONFIG_ESP_WIFI_SSID, CONFIG_ESP_WIFI_PASSWORD, 5);
  set_rgb(0, 0, 100);   // Blue = WiFi AP Started
  play_tone(1500, 150); // Short beep

  ServerUtil::mount_spiffs();
  ServerUtil::init();
  ServerUtil::set_cmd_callback(on_ws_cmd);

  set_rgb(0, 100, 0);   // Green = Server Started
  play_tone(2000, 250); // High beep

  ESP_LOGI(TAG, "Server running! Starting telemetry loop.");

  // Init I2C & MUX
  i2c_util::i2c_init();
  i2c_master_bus_handle_t bus = i2c_util::get_bus_handle();
  ESP_ERROR_CHECK(init_mux(bus));

  // Init Sensors Once
  ESP_LOGI(TAG, "--- Initializing Sensors ---");
  vTaskDelay(pdMS_TO_TICKS(150));

  // CH7: Return
  select_mux_channel(7);
  aht_return.init(bus);
  ens_return.init(bus);
  vTaskDelay(pdMS_TO_TICKS(50));

  // CH6: Mixed
  select_mux_channel(6);
  aht_mixed.init(bus);
  ens_mixed.init(bus);
  vTaskDelay(pdMS_TO_TICKS(50));

  // CH5: Cooler
  select_mux_channel(5);
  bme_cooler.init(bus);
  vTaskDelay(pdMS_TO_TICKS(50));

  // CH4: Heater
  select_mux_channel(4);
  bme_heater.init(bus);
  vTaskDelay(pdMS_TO_TICKS(50));

  // CH3: Release
  select_mux_channel(3);
  aht_release.init(bus);
  ens_release.init(bus);
  vTaskDelay(pdMS_TO_TICKS(50));

  // CH2: Outdoor
  select_mux_channel(2);
  aht_outdoor.init(bus);
  ens_outdoor.init(bus);
  vTaskDelay(pdMS_TO_TICKS(50));

  ESP_LOGI(TAG, "--- Sensor Init Complete. Starting Main Loop ---");
  set_rgb(0, 100, 0); // Green = Running smoothly

  const TickType_t xFrequency = pdMS_TO_TICKS(5000);
  TickType_t xLastWakeTime = xTaskGetTickCount();

  while (1) {
    uint32_t uptime_ms = (uint32_t)(xTaskGetTickCount() * portTICK_PERIOD_MS);

    bool any_sensor_error = false; // Master flag for the LED and Heartbeat
    bool channel_error =
        false; // Temporary flag for the current sensor being read

    // Visual indicator of read cycle
    set_rgb(0, 0, 100); // Blue during telemetry

    // 1. Read & Publish all channels
    // We check and reset 'channel_error' after every single read.

    channel_error = false;
    read_publish_aht_ens(7, aht_return, ens_return, "return", uptime_ms,
                         channel_error);
    if (channel_error) {
      ESP_LOGW(TAG, "Fault detected on 'return' sensor (CH 7)");
      any_sensor_error = true;
    }

    channel_error = false;
    read_publish_aht_ens(6, aht_mixed, ens_mixed, "mix", uptime_ms,
                         channel_error);
    if (channel_error) {
      ESP_LOGW(TAG, "Fault detected on 'mix' sensor (CH 6)");
      any_sensor_error = true;
    }

    channel_error = false;
    read_publish_bme(5, bme_cooler, "cooler", uptime_ms, channel_error);
    if (channel_error) {
      ESP_LOGW(TAG, "Fault detected on 'cooler' sensor (CH 5)");
      any_sensor_error = true;
    }

    channel_error = false;
    read_publish_bme(4, bme_heater, "heater", uptime_ms, channel_error);
    if (channel_error) {
      ESP_LOGW(TAG, "Fault detected on 'heater' sensor (CH 4)");
      any_sensor_error = true;
    }

    channel_error = false;
    read_publish_aht_ens(3, aht_release, ens_release, "release", uptime_ms,
                         channel_error);
    if (channel_error) {
      ESP_LOGW(TAG, "Fault detected on 'release' sensor (CH 3)");
      any_sensor_error = true;
    }

    channel_error = false;
    read_publish_aht_ens(2, aht_outdoor, ens_outdoor, "outside", uptime_ms,
                         channel_error);
    if (channel_error) {
      ESP_LOGW(TAG, "Fault detected on 'outside' sensor (CH 2)");
      any_sensor_error = true;
    }

    // 2. Publish Actuator States & Heartbeat
    char json_payload[256];
    snprintf(json_payload, sizeof(json_payload),
             "{\"topic\":\"ahu/telemetry/actuators\", \"ts\":%lu, "
             "\"mix_damper\":%.1f, \"cool_coil\":%.1f, \"heat_coil\":%.1f, "
             "\"humidifier\":%.1f, \"main_blower\":%.1f}",
             uptime_ms, actuators.mix_damper, actuators.cool_coil,
             actuators.heat_coil, actuators.humidifier, actuators.main_blower);
    ServerUtil::send_ws_data(json_payload);

    snprintf(
        json_payload, sizeof(json_payload),
        "{\"topic\":\"ahu/heartbeat\", \"uptime_s\":%lu, \"status\":\"%s\"}",
        uptime_ms / 1000, any_sensor_error ? "degraded" : "running");
    ServerUtil::send_ws_data(json_payload);

    // 3. Status Output Handling
    if (any_sensor_error) {
      ESP_LOGW(TAG, "Sensor Read Error Detected. Using fallback 0.0s");
      set_rgb(100, 0, 0); // Red
                          // play_sound_error();
    } else {
      set_rgb(0, 100, 0); // Back to Green
    }

    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}