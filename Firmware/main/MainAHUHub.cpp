#include "AhuWifiManager.h"
#include "HardwareUtils.h"
#include "InputTask.h"
#include "OutputTask.h"
#include "PcaTask.h"
#include "PinConfig.h"
#include "SensorConfig.h"
#include "StateManager.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "util_i2c.hpp"

static const char *TAG = "AHU_Hub";

// 0 = Errors only, 1 = Info (default), 2 = Debug (all sensor prints)
extern const int VERBOSE_MODE = 2;

// --- AHU Configuration ---
const PcaChannelConfig pca_config[8] = {
    {PcaSensorType::NONE, ""}, {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""}, {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""}, {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""}, {PcaSensorType::NONE, ""}};

const InputPinConfig input_config[] = {
    {InputType::NONE, 0, ""}, // Example mapping
};
const int input_config_size = sizeof(input_config) / sizeof(input_config[0]);

const OutputPinConfig output_config[] = {
    {OutputType::PWM, 18, "supply_fan_speed"}, // Example mapping
};
const int output_config_size = sizeof(output_config) / sizeof(output_config[0]);


extern "C" void app_main(void) {
  if (VERBOSE_MODE == 0) {
      esp_log_level_set("*", ESP_LOG_ERROR);
  } else if (VERBOSE_MODE == 1) {
      esp_log_level_set("*", ESP_LOG_INFO);
  } else if (VERBOSE_MODE >= 2) {
      esp_log_level_set("*", ESP_LOG_DEBUG);
  }

  ESP_LOGI(TAG, "Starting AHU Hub Firmware");

  StateManager::init();
  i2c_util::i2c_init();

  // Initialize Hardware Utilities (LED & Buzzer)
  initHardwareUtils();

  // Initialize WiFi Hotspot and WebSocket Server
  AhuWifiManager::init();

  // Start Hardware Tasks
  PcaTask::init();
  PcaTask::start();

  InputTask::init();
  InputTask::start();

  OutputTask::init();
  OutputTask::start();

  // Play welcome sequence
  setSystemState(SystemState::WELCOME);

  while (1) {
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}