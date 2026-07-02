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

// --- Task Configuration ---
const uint32_t PCA_TASK_FREQ_MS = 1000;
const uint32_t PCA_TASK_STACK = 4096;
const UBaseType_t PCA_TASK_PRIO = 5;

const uint32_t INPUT_TASK_FREQ_MS = 1000;
const uint32_t INPUT_TASK_STACK = 4096;
const UBaseType_t INPUT_TASK_PRIO = 5;

const uint32_t OUTPUT_TASK_FREQ_MS = 1000;
const uint32_t OUTPUT_TASK_STACK = 4096;
const UBaseType_t OUTPUT_TASK_PRIO = 5;

const uint32_t SYNC_TASK_FREQ_MS = 1000;
const uint32_t SYNC_TASK_STACK = 4096;
const UBaseType_t SYNC_TASK_PRIO = 5;

// --- AHU Configuration ---
const PcaChannelConfig pca_config[8] = {
    // {PcaSensorType::AHT21_ENS160, "mixed"},
    // {PcaSensorType::BME280, "cooled"},
    // {PcaSensorType::BME280, "heated"},
    {PcaSensorType::NONE, ""}, {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""}, {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""}, {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""}, {PcaSensorType::NONE, ""}};

const InputPinConfig input_config[] = {
    // {InputType::NONE, 0, ""},
};
const int input_config_size = sizeof(input_config) / sizeof(input_config[0]);

const OutputPinConfig output_config[] = {
    {OutputType::RELAY, 13, "cooler"},    {OutputType::RELAY, 33, "heater"},
    {OutputType::RELAY, 32, "humidifer"}, {OutputType::PWM, 18, "fan"},
    {OutputType::PWM, 19, "mixer"},

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

  // Initialize Hardware Utilities
  initHardwareUtils();

  // 1. Play startup sequence
  setSystemState(SystemState::STARTUP);
  vTaskDelay(pdMS_TO_TICKS(1500)); // Wait for sequence to complete

  // 2. Wait for WiFi (AP Creation)
  setSystemState(SystemState::WAIT_WIFI);

  // Initialize WiFi Client and WebSocket
  if (!AhuWifiManager::init()) {
    setSystemState(SystemState::INIT_ERROR);
    while (1) {
      vTaskDelay(pdMS_TO_TICKS(1000));
    } // Halt on failure
  }

  // 3. Start Hardware Tasks
  PcaTask::init();
  InputTask::init();
  OutputTask::init();

  xTaskCreate(PcaTask::taskLoop, "PcaTask", PCA_TASK_STACK,
              (void *)(uintptr_t)PCA_TASK_FREQ_MS, PCA_TASK_PRIO, NULL);
  xTaskCreate(InputTask::taskLoop, "InputTask", INPUT_TASK_STACK,
              (void *)(uintptr_t)INPUT_TASK_FREQ_MS, INPUT_TASK_PRIO, NULL);
  xTaskCreate(OutputTask::taskLoop, "OutputTask", OUTPUT_TASK_STACK,
              (void *)(uintptr_t)OUTPUT_TASK_FREQ_MS, OUTPUT_TASK_PRIO, NULL);
  xTaskCreate(AhuWifiManager::syncTaskLoop, "SyncTask", SYNC_TASK_STACK,
              (void *)(uintptr_t)SYNC_TASK_FREQ_MS, SYNC_TASK_PRIO, NULL);

  // 4. System Ready
  setSystemState(SystemState::READY);

  while (1) {
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}