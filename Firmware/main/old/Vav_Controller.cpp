#include "cJSON.h"
#include "esp_log.h"
#include "esp_websocket_client.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "sens_aht21.hpp"
#include "sens_ens160.hpp"
#include "util_i2c.hpp"
#include "util_wifi.hpp"
#include "esp_adc/adc_oneshot.h"

static const char *TAG = "ROOM_NODE";

static esp_websocket_client_handle_t client;

static void websocket_event_handler(void *handler_args, esp_event_base_t base,
                                    int32_t event_id, void *event_data) {
  esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
  switch (event_id) {
  case WEBSOCKET_EVENT_CONNECTED:
    ESP_LOGI(TAG, "WEBSOCKET_EVENT_CONNECTED");
    break;
  case WEBSOCKET_EVENT_DISCONNECTED:
    ESP_LOGI(TAG, "WEBSOCKET_EVENT_DISCONNECTED");
    break;
  }
}

static void websocket_app_start(void) {
  esp_websocket_client_config_t websocket_cfg = {};
  websocket_cfg.uri = "ws://192.168.4.1/ws";

  client = esp_websocket_client_init(&websocket_cfg);
  esp_websocket_register_events(client, WEBSOCKET_EVENT_ANY,
                                websocket_event_handler, (void *)client);

  esp_websocket_client_start(client);
}

static void send_telemetry(const char *room_name, float temp, float hum,
                           uint16_t co2) {
  if (!esp_websocket_client_is_connected(client))
    return;

  char payload[256];
  uint32_t uptime_ms = (uint32_t)(xTaskGetTickCount() * portTICK_PERIOD_MS);

  snprintf(payload, sizeof(payload),
           "{\"topic\":\"ahu/telemetry/%s\", \"ts\":%lu, \"temp\":%.2f, "
           "\"hum\":%.2f, \"co2\":%u, \"pressure\":null}",
           room_name, uptime_ms, temp, hum, co2);

  esp_websocket_client_send_text(client, payload, strlen(payload),
                                 portMAX_DELAY);
}

extern "C" void app_main(void) {
  ESP_LOGI(TAG, "Starting Room Sensor Node...");

  WifiUtil::init_wifi(CONFIG_ESP_WIFI_SSID, CONFIG_ESP_WIFI_PASSWORD);

  // Wait for Wi-Fi connection
  while (!WifiUtil::is_connected()) {
    vTaskDelay(pdMS_TO_TICKS(1000));
    ESP_LOGI(TAG, "Waiting for Wi-Fi...");
  }

  ESP_LOGI(TAG, "Wi-Fi Connected! Starting WebSocket Client.");
  websocket_app_start();

  // Init I2C
  i2c_util::i2c_init();
  i2c_util::i2c_scan();
  i2c_master_bus_handle_t bus = i2c_util::get_bus_handle();

  // Sensors
  // ENS160 address is 0x53 by default (false). Alt address is 0x52 (true).
  sens_ens160::ENS160 ens_side1(false); // 0x53
  sens_ens160::ENS160 ens_side2(true);  // 0x52
  sens_aht21::AHT21 aht;

  ESP_LOGI(TAG, "Initializing sensors...");
  aht.init(bus);
  ens_side1.init(bus);
  ens_side2.init(bus);

  vTaskDelay(pdMS_TO_TICKS(500));

  // Init ADC for Flowrate (MPXV7002 on D34 / ADC1_CH6)
  adc_oneshot_unit_handle_t adc1_handle;
  adc_oneshot_unit_init_cfg_t init_config1 = {
      .unit_id = ADC_UNIT_1,
      .clk_src = ADC_RTC_CLK_SRC_DEFAULT,
      .ulp_mode = ADC_ULP_MODE_DISABLE,
  };
  ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config1, &adc1_handle));

  adc_oneshot_chan_cfg_t adc_config = {
      .atten = ADC_ATTEN_DB_12, // 0-3.3V range approx
      .bitwidth = ADC_BITWIDTH_DEFAULT,
  };
  ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, ADC_CHANNEL_6, &adc_config));

  const TickType_t xFrequency = pdMS_TO_TICKS(5000);
  TickType_t xLastWakeTime = xTaskGetTickCount();

  while (1) {
    float temp = 0.0f;
    float hum = 0.0f;

    // Due to AHT21 having fixed address, both sensors on the bus will reply
    // together (conflict), or one might win. We just read once.
    if (aht.read(temp, hum) == ESP_OK) {
      ens_side1.set_environment(temp, hum);
      ens_side2.set_environment(temp, hum);
    } else {
      ESP_LOGW(TAG, "AHT21 read failed!");
    }

    sens_ens160::Ens160Data ens1_data;
    uint16_t co2_1 = 0;
    if (ens_side1.read_data(ens1_data) == ESP_OK) {
      co2_1 = ens1_data.eco2;
    } else {
      ESP_LOGW(TAG, "ENS160 (Side 1) read failed or warming up!");
    }
    // Always send telemetry so temperature/humidity is visible
    send_telemetry("roomLeft", temp, hum, co2_1);

    sens_ens160::Ens160Data ens2_data;
    uint16_t co2_2 = 0;
    if (ens_side2.read_data(ens2_data) == ESP_OK) {
      co2_2 = ens2_data.eco2;
    } else {
      ESP_LOGW(TAG, "ENS160 (Side 2) read failed or warming up!");
    }
    // Always send telemetry so temperature/humidity is visible
    send_telemetry("roomRight", temp, hum, co2_2);

    // Read ADC and calculate Flowrate
    int adc_raw = 0;
    adc_oneshot_read(adc1_handle, ADC_CHANNEL_6, &adc_raw);
    
    // MPXV7002 outputs Vcc/2 (approx 1.65V) at 0 kPa differential.
    // ESP32 ADC (12dB) max is ~3.1V, so 1.65V is around 2100-2200.
    float voltage = (float)adc_raw * (3.3f / 4095.0f);
    float pressure = (voltage - 1.65f) * 1.0f; // placeholder scaling for kPa
    float flowrate = 0.0f;
    if (pressure > 0.05f) { // simple deadband
        flowrate = pressure * 15.0f; // placeholder calibration to L/s
    }

    if (esp_websocket_client_is_connected(client)) {
        char payload[256];
        uint32_t uptime_ms = (uint32_t)(xTaskGetTickCount() * portTICK_PERIOD_MS);
        snprintf(payload, sizeof(payload),
                 "{\"topic\":\"ahu/telemetry/release_flow\", \"ts\":%lu, \"flowrate\":%.2f}",
                 uptime_ms, flowrate);
        esp_websocket_client_send_text(client, payload, strlen(payload), portMAX_DELAY);
    }

    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}
