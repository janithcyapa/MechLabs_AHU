#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "nvs_flash.h"
#include "mqtt_client.h"
#include "util_wifi.hpp"
#include "esp_log.h"

static const char *TAG = "MQTT_AHU";

// Handle MQTT Events (Connection, Data, etc.)
static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
    // C++ requires explicit casting from void*
    esp_mqtt_event_handle_t event = static_cast<esp_mqtt_event_handle_t>(event_data);
    esp_mqtt_client_handle_t client = event->client;

    switch ((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
            // Send a test message as soon as we connect
            esp_mqtt_client_publish(client, "telemetry/esp_01", "{\"status\":\"online\", \"zone\":\"AHU_1\"}", 0, 1, 0);
            break;
        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "DATA RECEIVED: Topic=%.*s, Data=%.*s", 
                     (int)event->topic_len, event->topic, 
                     (int)event->data_len, event->data);
            break;
        case MQTT_EVENT_ERROR:
            ESP_LOGE(TAG, "MQTT_EVENT_ERROR");
            break;
        default:
            break;
    }
}

// app_main must have C linkage to be found by the bootloader
extern "C" void app_main(void) {
    // 1. Initialize NVS (Required for WiFi stack)
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Initialize Networking using your custom C++ component
    WifiUtil::init_wifi();

    // 3. Configure MQTT (Using C++ compatible struct initialization)
    esp_mqtt_client_config_t mqtt_cfg = {};
    mqtt_cfg.broker.address.uri = "mqtt://10.149.249.32"; // Fedora Host IP
    mqtt_cfg.broker.address.port = 1883;

    esp_mqtt_client_handle_t client = esp_mqtt_client_init(&mqtt_cfg);
    
    esp_mqtt_client_register_event(client, (esp_mqtt_event_id_t)ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_mqtt_client_start(client);

    // 4. Periodic Telemetry Loop
    while (1) {
        char payload[64];
        // Simulate sensor data for your AHU prototype
        float dummy_temp = 24.5 + (rand() % 10) / 10.0;
        snprintf(payload, sizeof(payload), "{\"temp\": %.2f}", dummy_temp);
        
        esp_mqtt_client_publish(client, "telemetry/esp_01", payload, 0, 1, 0);
        
        // Use FreeRTOS delay to avoid watchdog triggers
        vTaskDelay(pdMS_TO_TICKS(5000)); 
    }
}