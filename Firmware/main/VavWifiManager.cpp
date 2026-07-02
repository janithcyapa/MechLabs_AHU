#include "VavWifiManager.h"
#include "util_wifi.hpp"
#include "cJSON.h"
#include "esp_log.h"
#include "sdkconfig.h"
#include "esp_websocket_client.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>

static const char *TAG = "VavWifiManager";
static cJSON* localState = NULL;
static esp_websocket_client_handle_t client = NULL;

void VavWifiManager::websocketEventHandler(void* handler_args, esp_event_base_t base, int32_t event_id, void* event_data) {
    switch (event_id) {
    case WEBSOCKET_EVENT_CONNECTED:
        ESP_LOGI(TAG, "WEBSOCKET_EVENT_CONNECTED");
        break;
    case WEBSOCKET_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "WEBSOCKET_EVENT_DISCONNECTED");
        break;
    case WEBSOCKET_EVENT_DATA:
        // Ignore the spam of receiving data, but we can process global state here later
        break;
    case WEBSOCKET_EVENT_ERROR:
        ESP_LOGI(TAG, "WEBSOCKET_EVENT_ERROR");
        break;
    }
}

void VavWifiManager::publishTask(void* arg) {
    while (1) {
        if (client != NULL && esp_websocket_client_is_connected(client) && localState != NULL) {
            char* out = cJSON_PrintUnformatted(localState);
            if (out) {
                esp_websocket_client_send_text(client, out, strlen(out), pdMS_TO_TICKS(500));
                free(out);
            }
        }
        vTaskDelay(pdMS_TO_TICKS(1000)); // Publish at 1Hz frequency
    }
}

void VavWifiManager::init() {
    localState = cJSON_CreateObject();
    
    // Hardcode ID for now
    cJSON_AddStringToObject(localState, "vav_id", "ZONE_01");
    
    ESP_LOGI(TAG, "Connecting to AHU Hotspot (SSID: %s)", CONFIG_ESP_WIFI_SSID);
    WifiUtil::init_wifi(CONFIG_ESP_WIFI_SSID, CONFIG_ESP_WIFI_PASSWORD);
    
    // Wait for WiFi connection (using simple delay for POC)
    vTaskDelay(pdMS_TO_TICKS(5000));
    
    ESP_LOGI(TAG, "Connecting to WebSocket Server at ws://192.168.4.1/ws");
    
    esp_websocket_client_config_t websocket_cfg = {};
    websocket_cfg.uri = "ws://192.168.4.1/ws";
    
    client = esp_websocket_client_init(&websocket_cfg);
    esp_websocket_register_events(client, WEBSOCKET_EVENT_ANY, (esp_event_handler_t)websocketEventHandler, (void *)client);
    esp_websocket_client_start(client);
    
    // Start FreeRTOS task to publish state at 1Hz
    xTaskCreate(publishTask, "vav_publish_task", 4096, NULL, 5, NULL);
}

void VavWifiManager::updateLocalState(const char* key, double value) {
    if (!localState) return;
    cJSON_DeleteItemFromObject(localState, key);
    cJSON_AddNumberToObject(localState, key, value);
}
