#include "HardwareUtils.h"
#include "PinConfig.h"
#include "driver/ledc.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/timers.h"

static const char *TAG = "HardwareUtils";

static SystemState currentState = SystemState::IDLE;
static TimerHandle_t stateTimer = NULL;
static int toggleCount = 0;
static bool toggleState = false;

// LEDC setup
#define LEDC_MODE LEDC_LOW_SPEED_MODE
#define LEDC_DUTY_RES LEDC_TIMER_8_BIT
#define LEDC_MAX_DUTY 255

// Channels
#define LEDC_CHANNEL_R LEDC_CHANNEL_0
#define LEDC_CHANNEL_G LEDC_CHANNEL_1
#define LEDC_CHANNEL_B LEDC_CHANNEL_2
#define LEDC_CHANNEL_BUZZER LEDC_CHANNEL_3

static void setOutputs(uint32_t r, uint32_t g, uint32_t b, bool buzzerOn) {
  ledc_set_duty(LEDC_MODE, LEDC_CHANNEL_R, r);
  ledc_update_duty(LEDC_MODE, LEDC_CHANNEL_R);
  ledc_set_duty(LEDC_MODE, LEDC_CHANNEL_G, g);
  ledc_update_duty(LEDC_MODE, LEDC_CHANNEL_G);
  ledc_set_duty(LEDC_MODE, LEDC_CHANNEL_B, b);
  ledc_update_duty(LEDC_MODE, LEDC_CHANNEL_B);

  ledc_set_duty(LEDC_MODE, LEDC_CHANNEL_BUZZER,
                buzzerOn ? (LEDC_MAX_DUTY / 2) : 0);
  ledc_update_duty(LEDC_MODE, LEDC_CHANNEL_BUZZER);
}

static void stateTimerCallback(TimerHandle_t xTimer) {
  toggleCount++;
  toggleState = !toggleState;

  switch (currentState) {
  case SystemState::ERROR:
    // 2Hz means toggle every 250ms
    if (toggleState) {
      setOutputs(255, 0, 0, true);
    } else {
      setOutputs(0, 0, 0, false);
    }
    break;
  case SystemState::ALERT:
    // Fast toggle red/blue
    if (toggleState) {
      setOutputs(255, 0, 0, true);
    } else {
      setOutputs(0, 0, 255, false);
    }
    break;
  case SystemState::SUCCESS:
    if (toggleCount == 1) {
      setOutputs(0, 255, 0, true); // Green and Beep
    } else if (toggleCount == 2) {
      setOutputs(0, 255, 0, false); // Green, stop beep
    } else if (toggleCount >= 4) {
      setSystemState(SystemState::IDLE); // Play once and stop
    }
    break;
  case SystemState::WARNING:
    if (toggleCount == 1) {
      setOutputs(255, 128, 0, true); // Yellow
    } else if (toggleCount == 2) {
      setOutputs(255, 128, 0, false); // Yellow, stop beep
    } else if (toggleCount >= 6) {
      setSystemState(SystemState::IDLE);
    }
    break;
  case SystemState::WELCOME:
    if (toggleCount == 1)
      setOutputs(0, 255, 0, true);
    else if (toggleCount == 2)
      setOutputs(0, 255, 0, false);
    else if (toggleCount == 3)
      setOutputs(0, 0, 255, true);
    else if (toggleCount >= 4)
      setSystemState(SystemState::IDLE);
    break;
  case SystemState::IDLE:
  default:
    setOutputs(0, 0, 0, false);
    xTimerStop(stateTimer, 0);
    break;
  }
}

void initHardwareUtils() {
  // RGB Timer
  ledc_timer_config_t ledc_timer_rgb = {};
  ledc_timer_rgb.speed_mode = LEDC_MODE;
  ledc_timer_rgb.duty_resolution = LEDC_DUTY_RES;
  ledc_timer_rgb.timer_num = LEDC_TIMER_0;
  ledc_timer_rgb.freq_hz = 5000;
  ledc_timer_rgb.clk_cfg = LEDC_AUTO_CLK;
  ledc_timer_config(&ledc_timer_rgb);

  // Buzzer Timer
  ledc_timer_config_t ledc_timer_buzzer = {};
  ledc_timer_buzzer.speed_mode = LEDC_MODE;
  ledc_timer_buzzer.duty_resolution = LEDC_DUTY_RES;
  ledc_timer_buzzer.timer_num = LEDC_TIMER_1;
  ledc_timer_buzzer.freq_hz = 2000;
  ledc_timer_buzzer.clk_cfg = LEDC_AUTO_CLK;
  ledc_timer_config(&ledc_timer_buzzer);

  // Channels
  ledc_channel_config_t ledc_channel_r = {};
  ledc_channel_r.gpio_num = PIN_LED_RED;
  ledc_channel_r.speed_mode = LEDC_MODE;
  ledc_channel_r.channel = LEDC_CHANNEL_R;
  ledc_channel_r.timer_sel = LEDC_TIMER_0;
  ledc_channel_r.duty = 0;
  ledc_channel_r.hpoint = 0;

  ledc_channel_config_t ledc_channel_g = {};
  ledc_channel_g.gpio_num = PIN_LED_GREEN;
  ledc_channel_g.speed_mode = LEDC_MODE;
  ledc_channel_g.channel = LEDC_CHANNEL_G;
  ledc_channel_g.timer_sel = LEDC_TIMER_0;
  ledc_channel_g.duty = 0;
  ledc_channel_g.hpoint = 0;

  ledc_channel_config_t ledc_channel_b = {};
  ledc_channel_b.gpio_num = PIN_LED_BLUE;
  ledc_channel_b.speed_mode = LEDC_MODE;
  ledc_channel_b.channel = LEDC_CHANNEL_B;
  ledc_channel_b.timer_sel = LEDC_TIMER_0;
  ledc_channel_b.duty = 0;
  ledc_channel_b.hpoint = 0;

  ledc_channel_config_t ledc_channel_buzzer = {};
  ledc_channel_buzzer.gpio_num = PIN_BUZZER;
  ledc_channel_buzzer.speed_mode = LEDC_MODE;
  ledc_channel_buzzer.channel = LEDC_CHANNEL_BUZZER;
  ledc_channel_buzzer.timer_sel = LEDC_TIMER_1;
  ledc_channel_buzzer.duty = 0;
  ledc_channel_buzzer.hpoint = 0;

  ledc_channel_config(&ledc_channel_r);
  ledc_channel_config(&ledc_channel_g);
  ledc_channel_config(&ledc_channel_b);
  ledc_channel_config(&ledc_channel_buzzer);

  stateTimer = xTimerCreate("HWTimer", pdMS_TO_TICKS(250), pdTRUE, (void *)0,
                            stateTimerCallback);

  ESP_LOGI(TAG, "Hardware Utils Initialized");
}

void setSystemState(SystemState state) {
  currentState = state;
  toggleCount = 0;
  toggleState = false;

  if (stateTimer != NULL) {
    xTimerStop(stateTimer, 0);

    if (state != SystemState::IDLE) {
      xTimerStart(stateTimer, 0);
      stateTimerCallback(stateTimer);
    } else {
      setOutputs(0, 0, 0, false);
    }
  }
}
