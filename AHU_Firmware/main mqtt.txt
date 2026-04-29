#include <stdio.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_random.h"
#include "cJSON.h"

#include "util_mqtt.hpp"
#include "util_wifi.hpp"

static const char *TAG = "AHU_MAIN";

struct ActuatorState {
    float mix_damper = 40.0;
    float cool_coil = 75.0;
    float heat_coil = 60.0;
    float humidifier = 10.0;
    float main_blower = 80.0;
} actuators;

// MQTT Command Handler (Incoming Data from FastAPI)
void on_mqtt_data(const char *topic, const char *data)
{
    ESP_LOGI(TAG, "COMMAND RECEIVED | Topic: %s | Payload: %s", topic, data);
    cJSON *root = cJSON_Parse(data);
    if (root == NULL) {
        ESP_LOGE(TAG, "JSON Parse Error: Invalid Format");
        return;
    }

    cJSON *item;

    if ((item = cJSON_GetObjectItem(root, "mix_damper"))) {
        actuators.mix_damper = (float)item->valuedouble;
        ESP_LOGI(TAG, "Updated Mix Damper: %.1f", actuators.mix_damper);
    }

    if ((item = cJSON_GetObjectItem(root, "cool_coil"))) {
        actuators.cool_coil = (float)item->valuedouble;
        ESP_LOGI(TAG, "Updated Cool Coil: %.1f", actuators.cool_coil);
    }

    if ((item = cJSON_GetObjectItem(root, "heat_coil"))) {
        actuators.heat_coil = (float)item->valuedouble;
        ESP_LOGI(TAG, "Updated Heat Coil: %.1f", actuators.heat_coil);
    }

    if ((item = cJSON_GetObjectItem(root, "humidifier"))) {
        actuators.humidifier = (float)item->valuedouble;
        ESP_LOGI(TAG, "Updated Humidifier: %.1f", actuators.humidifier);
    }

    if ((item = cJSON_GetObjectItem(root, "main_blower"))) {
        actuators.main_blower = (float)item->valuedouble;
        ESP_LOGI(TAG, "Updated Main Blower: %.1f", actuators.main_blower);
    }

    // Free the memory allocated by cJSON
    cJSON_Delete(root);

}

// Mock Data Helpers
float get_random_float(float min, float max)
{
    return min + ((float)esp_random() / (float)UINT32_MAX) * (max - min);
}

extern "C" void app_main(void)
{
    ESP_LOGI(TAG, "Starting AHU Controller...");

    // Initialize WiFi
    WifiUtil::init_wifi();

    // MqttUtil to listen to the master AHU command topic
    MqttUtil::subscribe("ahu/cmd", on_mqtt_data);

    // Start the MQTT connection
    MqttUtil::init("mqtt://172.23.239.32");

    // Waiting for MQTT connection
    ESP_LOGI(TAG, "Waiting for MQTT connection...");
    while (!MqttUtil::is_connected()) {
        vTaskDelay(pdMS_TO_TICKS(100)); 
    }

    MqttUtil::publish("ahu/status", "online");
    ESP_LOGI(TAG, "MQTT connected! Starting telemetry loop.");

    // Setup precise timing for 5s loop
    const TickType_t xFrequency = pdMS_TO_TICKS(5 * 1000);
    TickType_t xLastWakeTime = xTaskGetTickCount();
    char json_payload[256];

    while (1)
    {
        // Get current uptime in milliseconds
        uint32_t uptime_ms = (uint32_t)(xTaskGetTickCount() * portTICK_PERIOD_MS);
        // Mock Data Generation
        float temp_base = get_random_float(25.0, 35.0);
        float hum_base = get_random_float(50.0, 70.0);
        int co2_base = get_random_float(400, 600);
        int pressure_base = get_random_float(95, 105);

        // Outside Air
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":%d, \"pressure\":null}", uptime_ms, temp_base, hum_base, co2_base);
        MqttUtil::publish("ahu/telemetry/outside", json_payload);

        // Mix Sensor
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":null, \"pressure\":%d}", uptime_ms, temp_base - 4.0, hum_base + 5.0, pressure_base);
        MqttUtil::publish("ahu/telemetry/mix", json_payload);

        // Cooler Sensor
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":null, \"pressure\":%d}", uptime_ms, 14.5, 95.0, pressure_base - 2);
        MqttUtil::publish("ahu/telemetry/cooler", json_payload);

        // Heater Sensor
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":null, \"pressure\":%d}", uptime_ms, 18.0, 60.0, pressure_base + 1);
        MqttUtil::publish("ahu/telemetry/heater", json_payload);

        // Return Air
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":%d, \"pressure\":null}", uptime_ms, temp_base + 2.0, hum_base - 5.0, co2_base + 200);
        MqttUtil::publish("ahu/telemetry/return", json_payload);

        // Release Air
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":%d, \"pressure\":null}", uptime_ms, 18.5, 58.0, co2_base - 50);
        MqttUtil::publish("ahu/telemetry/release", json_payload);

        // Actuators
        snprintf(json_payload, sizeof(json_payload), 
                 "{\"ts\":%lu, \"mix_damper\":%.1f, \"cool_coil\":%.1f, \"heat_coil\":%.1f, \"humidifier\":%.1f, \"main_blower\":%.1f}", 
                 uptime_ms, actuators.mix_damper, actuators.cool_coil, actuators.heat_coil, actuators.humidifier, actuators.main_blower);
        MqttUtil::publish("ahu/telemetry/actuators", json_payload);

        // Sends Uptime 
        snprintf(json_payload, sizeof(json_payload), "{\"uptime_s\":%lu, \"status\":\"running\"}", uptime_ms / 1000);
        MqttUtil::publish("ahu/heartbeat", json_payload);

        ESP_LOGI(TAG, "Telemetry & Heartbeat sent. Uptime: %lu s", uptime_ms / 1000);

        // Wait exactly until 2000ms has passed since the loop started
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}