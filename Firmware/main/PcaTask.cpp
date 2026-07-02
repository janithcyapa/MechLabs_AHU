#include "PcaTask.h"
#include "SensorConfig.h"
#include "StateManager.h"
#include "util_i2c.hpp"
#include "sens_pca9548a.hpp"
#include "sens_aht21.hpp"
#include "sens_ens160.hpp"
#include "sens_bme280.hpp"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include <stdio.h>
#include <string.h>
#include "HardwareUtils.h"

static const char* TAG = "PcaTask";
extern const int VERBOSE_MODE;

void PcaTask::init() {
    // Initialization handled inside the task to avoid locking up main
}

void PcaTask::taskLoop(void* arg) {
    uint32_t delay_ms = (uint32_t)(uintptr_t)arg;
    if (delay_ms == 0) delay_ms = 1000;

    ESP_LOGI(TAG, "Starting PCA Task Loop with %lu ms delay", delay_ms);

    i2c_master_bus_handle_t bus = i2c_util::get_bus_handle();
    if (!bus) {
        ESP_LOGE(TAG, "I2C Bus not initialized. Exiting PcaTask.");
        vTaskDelete(NULL);
    }

    components::PCA9548A pca(bus);
    if (pca.init() != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize PCA9548A.");
    }

    // Instantiating sensor objects
    sens_aht21::AHT21 aht;
    sens_ens160::ENS160 ens(false); // Default addr
    sens_bme280::BME280 bme(false); // Default addr

    // Initialize configured channels
    for (int i = 0; i < 8; i++) {
        if (pca_config[i].type != PcaSensorType::NONE) {
            pca.select_channel(i);
            vTaskDelay(pdMS_TO_TICKS(10));
            
            if (pca_config[i].type == PcaSensorType::AHT21_ENS160) {
                if (aht.init(bus) != ESP_OK) ESP_LOGW(TAG, "AHT21 Init failed on ch %d", i);
                if (ens.init(bus) != ESP_OK) ESP_LOGW(TAG, "ENS160 Init failed on ch %d", i);
            } else if (pca_config[i].type == PcaSensorType::BME280) {
                if (bme.init(bus) != ESP_OK) ESP_LOGW(TAG, "BME280 Init failed on ch %d", i);
            }
        }
    }
    pca.disable_all();

    char key_buf[32];

    while (1) {
        for (int i = 0; i < 8; i++) {
            if (pca_config[i].type == PcaSensorType::NONE) continue;
            
            if (pca.select_channel(i) != ESP_OK) {
                setSystemState(SystemState::SENSOR_ERROR);
                continue;
            }
            vTaskDelay(pdMS_TO_TICKS(10));

            if (pca_config[i].type == PcaSensorType::AHT21_ENS160) {
                float temp = 0.0, hum = 0.0;
                if (aht.read(temp, hum) == ESP_OK) {
                    if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "[%s] AHT21 - Temp: %.1f C, Hum: %.1f %%", pca_config[i].name, temp, hum);
                    snprintf(key_buf, sizeof(key_buf), "%s_t", pca_config[i].name);
                    StateManager::set(key_buf, temp);
                    snprintf(key_buf, sizeof(key_buf), "%s_h", pca_config[i].name);
                    StateManager::set(key_buf, hum);

                    // Compensate ENS160
                    ens.set_environment(temp, hum);
                } else {
                    setSystemState(SystemState::SENSOR_ERROR);
                }
                
                sens_ens160::Ens160Data ens_data;
                if (ens.read_data(ens_data) == ESP_OK) {
                    if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "[%s] ENS160 - AQI: %d, TVOC: %d, eCO2: %d", pca_config[i].name, ens_data.aqi, ens_data.tvoc, ens_data.eco2);
                    snprintf(key_buf, sizeof(key_buf), "%s_a", pca_config[i].name);
                    StateManager::set(key_buf, ens_data.aqi);
                    snprintf(key_buf, sizeof(key_buf), "%s_v", pca_config[i].name);
                    StateManager::set(key_buf, ens_data.tvoc);
                    snprintf(key_buf, sizeof(key_buf), "%s_c", pca_config[i].name);
                    StateManager::set(key_buf, ens_data.eco2);
                } else {
                    setSystemState(SystemState::SENSOR_ERROR);
                }
            } 
            else if (pca_config[i].type == PcaSensorType::BME280) {
                sens_bme280::Bme280Data bme_data;
                if (bme.read_data(bme_data) == ESP_OK) {
                    if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "[%s] BME280 - Temp: %.1f C, Hum: %.1f %%, Press: %.1f hPa", pca_config[i].name, bme_data.temperature, bme_data.humidity, bme_data.pressure);
                    snprintf(key_buf, sizeof(key_buf), "%s_t", pca_config[i].name);
                    StateManager::set(key_buf, bme_data.temperature);
                    snprintf(key_buf, sizeof(key_buf), "%s_h", pca_config[i].name);
                    StateManager::set(key_buf, bme_data.humidity);
                    snprintf(key_buf, sizeof(key_buf), "%s_p", pca_config[i].name);
                    StateManager::set(key_buf, bme_data.pressure);
                } else {
                    setSystemState(SystemState::SENSOR_ERROR);
                }
            }
            pca.disable_all();
        }

        vTaskDelay(pdMS_TO_TICKS(delay_ms));
    }
}
