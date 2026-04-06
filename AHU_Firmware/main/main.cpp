#include <stdio.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_random.h"

#include "util_mqtt.hpp"
#include "util_wifi.hpp"

static const char *TAG = "AHU_MAIN";

// MQTT Command Handler (Incoming Data from FastAPI)
void on_mqtt_data(const char *topic, const char *data)
{
    ESP_LOGI(TAG, "COMMAND RECEIVED | Topic: %s | Payload: %s", topic, data);
}

// Mock Data Helpers
float get_random_float(float min, float max)
{
    return min + ((float)esp_random() / (float)UINT32_MAX) * (max - min);
}
int get_random_int(int min, int max)
{
    return min + (esp_random() % (max - min + 1));
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
    ESP_LOGI(TAG, "MQTT connected! Starting telemetry loop.");

    // Setup precise timing for 5s loop
    const TickType_t xFrequency = pdMS_TO_TICKS(5 * 1000);
    TickType_t xLastWakeTime = xTaskGetTickCount();

    char json_payload[128];

    while (1)
    {
        // Get current uptime in milliseconds
        uint32_t batch_timestamp = (uint32_t)(xTaskGetTickCount() * portTICK_PERIOD_MS);
        // Mock Data Generation
        float temp_base = get_random_float(25.0, 35.0);
        float hum_base = get_random_float(50.0, 70.0);
        int co2_base = get_random_int(400, 600);
        int pressure_base = get_random_int(95, 105);

        // Outside Air
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":%d, \"pressure\":null}", batch_timestamp, temp_base, hum_base, co2_base);
        MqttUtil::publish("ahu/telemetry/outside", json_payload);

        // Mix Sensor
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":null, \"pressure\":%d}", batch_timestamp, temp_base - 4.0, hum_base + 5.0, pressure_base);
        MqttUtil::publish("ahu/telemetry/mix", json_payload);

        // Cooler Sensor
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":null, \"pressure\":%d}", batch_timestamp, 14.5, 95.0, pressure_base - 2);
        MqttUtil::publish("ahu/telemetry/cooler", json_payload);

        // Heater Sensor
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":null, \"pressure\":%d}", batch_timestamp, 18.0, 60.0, pressure_base + 1);
        MqttUtil::publish("ahu/telemetry/heater", json_payload);

        // Return Air
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":%d, \"pressure\":null}", batch_timestamp, temp_base + 2.0, hum_base - 5.0, co2_base + 200);
        MqttUtil::publish("ahu/telemetry/return", json_payload);

        // Release Air
        snprintf(json_payload, sizeof(json_payload), "{\"ts\":%lu, \"temp\":%.1f, \"hum\":%.1f, \"co2\":%d, \"pressure\":null}", batch_timestamp, 18.5, 58.0, co2_base - 50);
        MqttUtil::publish("ahu/telemetry/release", json_payload);

        ESP_LOGI(TAG, "Telemetry batch published. TS: %lu", batch_timestamp);

        // Wait exactly until 2000ms has passed since the loop started
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}