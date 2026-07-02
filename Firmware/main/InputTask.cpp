#include "InputTask.h"
#include "SensorConfig.h"
#include "StateManager.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_log.h"
#include <vector>

static const char* TAG = "InputTask";
static adc_oneshot_unit_handle_t adc1_handle = NULL;
static adc_oneshot_unit_handle_t adc2_handle = NULL;

struct AdcMapping {
    int config_index;
    adc_unit_t unit;
    adc_channel_t channel;
};
static std::vector<AdcMapping> adc_mappings;

extern const int VERBOSE_MODE;

void InputTask::init() {
    // Basic ADC initialization. If ADC config becomes complex, it can go here.
}

void InputTask::start() {
    xTaskCreate(InputTask::taskLoop, "InputTask", 4096, NULL, 5, NULL);
}

void InputTask::taskLoop(void* arg) {
    ESP_LOGI(TAG, "Starting Input Task Loop");

    ESP_LOGI(TAG, "Starting Input Task Loop");

    // Configure pins
    for (int i = 0; i < input_config_size; i++) {
        if (input_config[i].type == InputType::DIGITAL_GPIO) {
            gpio_config_t io_conf = {};
            io_conf.pin_bit_mask = (1ULL << input_config[i].pin);
            io_conf.mode = GPIO_MODE_INPUT;
            io_conf.pull_up_en = GPIO_PULLUP_ENABLE; // Default to pullup
            io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
            io_conf.intr_type = GPIO_INTR_DISABLE;
            gpio_config(&io_conf);
        } else if (input_config[i].type == InputType::ANALOG_ADC) {
            adc_unit_t unit;
            adc_channel_t channel;
            esp_err_t err = adc_oneshot_io_to_channel(input_config[i].pin, &unit, &channel);
            if (err == ESP_OK) {
                if (unit == ADC_UNIT_1 && adc1_handle == NULL) {
                    adc_oneshot_unit_init_cfg_t init_config1 = {};
                    init_config1.unit_id = ADC_UNIT_1;
                    init_config1.ulp_mode = ADC_ULP_MODE_DISABLE;
                    adc_oneshot_new_unit(&init_config1, &adc1_handle);
                } else if (unit == ADC_UNIT_2 && adc2_handle == NULL) {
                    adc_oneshot_unit_init_cfg_t init_config2 = {};
                    init_config2.unit_id = ADC_UNIT_2;
                    init_config2.ulp_mode = ADC_ULP_MODE_DISABLE;
                    adc_oneshot_new_unit(&init_config2, &adc2_handle);
                }

                adc_oneshot_unit_handle_t handle = (unit == ADC_UNIT_1) ? adc1_handle : adc2_handle;
                
                adc_oneshot_chan_cfg_t config = {};
                config.atten = ADC_ATTEN_DB_12;
                config.bitwidth = ADC_BITWIDTH_DEFAULT;
                adc_oneshot_config_channel(handle, channel, &config);

                adc_mappings.push_back({i, unit, channel});
            } else {
                ESP_LOGE(TAG, "Pin %d is not a valid ADC pin", input_config[i].pin);
            }
        }
    }

    while (1) {
        for (int i = 0; i < input_config_size; i++) {
            if (input_config[i].type == InputType::DIGITAL_GPIO) {
                int val = gpio_get_level((gpio_num_t)input_config[i].pin);
                if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "Input [%s] GPIO %d: %d", input_config[i].state_key, input_config[i].pin, val);
                StateManager::set(input_config[i].state_key, (double)val);
            } 
            else if (input_config[i].type == InputType::ANALOG_ADC) {
                for (auto& map : adc_mappings) {
                    if (map.config_index == i) {
                        adc_oneshot_unit_handle_t handle = (map.unit == ADC_UNIT_1) ? adc1_handle : adc2_handle;
                        int raw_val;
                        if (adc_oneshot_read(handle, map.channel, &raw_val) == ESP_OK) {
                            if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "Input [%s] ADC (GPIO %d): %d", input_config[i].state_key, input_config[i].pin, raw_val);
                            StateManager::set(input_config[i].state_key, (double)raw_val);
                        }
                        break;
                    }
                }
            }
        }
        vTaskDelay(pdMS_TO_TICKS(100)); // 10Hz sampling
    }
}
