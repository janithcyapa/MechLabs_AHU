#include "HardwareUtils.h"
#include "PinConfig.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "Vav_Controller";

extern "C" void app_main(void) {
  ESP_LOGI(TAG, "Starting VAV Controller Firmware");

  // Initialize Hardware Utilities (LED & Buzzer)
  initHardwareUtils();

  // Play welcome sequence
  setSystemState(SystemState::WELCOME);

  while (1) {
    vTaskDelay(pdMS_TO_TICKS(1000));
    // Main loop logic will go here
  }
}
