#include "OutputTask.h"
#include "SensorConfig.h"
#include "StateManager.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "util_pwm.hpp"
#include "esp_log.h"
#include <vector>

static const char* TAG = "OutputTask";
extern const int VERBOSE_MODE;

// Helper structure to hold dynamically allocated PWM instances
struct PwmInstance {
    int config_index;
    PwmUtil* pwm;
};
static std::vector<PwmInstance> pwm_instances;

void OutputTask::init() {
    // Hardware setup before task runs
}

void OutputTask::taskLoop(void* arg) {
    uint32_t delay_ms = (uint32_t)(uintptr_t)arg;
    if (delay_ms == 0) delay_ms = 50;

    ESP_LOGI(TAG, "Starting Output Task Loop with %lu ms delay", delay_ms);

    int ledc_channel_counter = 0;

    // Configure pins
    for (int i = 0; i < output_config_size; i++) {
        if (output_config[i].type == OutputType::RELAY) {
            gpio_config_t io_conf = {};
            io_conf.pin_bit_mask = (1ULL << output_config[i].pin);
            io_conf.mode = GPIO_MODE_OUTPUT;
            io_conf.pull_up_en = GPIO_PULLUP_DISABLE;
            io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
            io_conf.intr_type = GPIO_INTR_DISABLE;
            gpio_config(&io_conf);
            gpio_set_level((gpio_num_t)output_config[i].pin, 0); // Default off
        } 
        else if (output_config[i].type == OutputType::PWM) {
            if (ledc_channel_counter < 8) {
                PwmUtil* p = new PwmUtil(output_config[i].pin, (ledc_channel_t)ledc_channel_counter);
                p->init(50); // Default 50Hz, adjust as needed based on load type (fan vs servo)
                pwm_instances.push_back({i, p});
                ledc_channel_counter++;
            } else {
                ESP_LOGE(TAG, "Exceeded maximum LEDC channels");
            }
        }
    }

    while (1) {
        for (int i = 0; i < output_config_size; i++) {
            double target_val = StateManager::getDouble(output_config[i].state_key, 0.0);

            if (output_config[i].type == OutputType::RELAY) {
                // Treat >0.5 as ON, else OFF
                int level = target_val > 0.5 ? 1 : 0;
                if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "Output [%s] Relay (GPIO %d): %d", output_config[i].state_key, output_config[i].pin, level);
                gpio_set_level((gpio_num_t)output_config[i].pin, level);
            } 
            else if (output_config[i].type == OutputType::PWM) {
                // Find matching PWM instance
                for (auto& inst : pwm_instances) {
                    if (inst.config_index == i) {
                        if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "Output [%s] PWM (GPIO %d): %.1f", output_config[i].state_key, output_config[i].pin, target_val);
                        inst.pwm->set_raw_duty((uint32_t)target_val);
                        break;
                    }
                }
            }
        }
        vTaskDelay(pdMS_TO_TICKS(delay_ms));
    }
}
