#include "HardwareUtils.h"
#include "InputTask.h"
#include "OutputTask.h"
#include "PcaTask.h"
#include "PinConfig.h"
#include "SensorConfig.h"
#include "StateManager.h"
#include "VavWifiManager.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "util_i2c.hpp"

static const char *TAG = "VAV_Controller";

// --- VAV Configuration ---
const PcaChannelConfig pca_config[8] = {
    {PcaSensorType::AHT21_ENS160, "room1_1"},
    {PcaSensorType::BME280, "duct_1"},
    {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""},
    {PcaSensorType::NONE, ""}};

const InputPinConfig input_config[] = {
    {InputType::ANALOG_ADC, 34, "flow"}, // Example mapping
};
const int input_config_size = sizeof(input_config) / sizeof(input_config[0]);

const OutputPinConfig output_config[] = {
    {OutputType::PWM, 18, "damper"}, // Example mapping
};
const int output_config_size = sizeof(output_config) / sizeof(output_config[0]);
// -------------------------

extern "C" void app_main(void) {
  ESP_LOGI(TAG, "Starting VAV Controller Firmware");

  StateManager::init();
  i2c_util::i2c_init();

  // Initialize Hardware Utilities
  initHardwareUtils();

  // Initialize WiFi Client and WebSocket
  VavWifiManager::init();

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
