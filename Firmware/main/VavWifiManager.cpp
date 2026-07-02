#include "VavWifiManager.h"
#include "util_wifi.hpp"
#include "StateManager.h"
#include "esp_log.h"
#include "sdkconfig.h"
#include "esp_websocket_client.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>

static const char *TAG = "VavWifiManager";
static esp_websocket_client_handle_t client = NULL;
extern const int VERBOSE_MODE;

void VavWifiManager::websocketEventHandler(void* handler_args, esp_event_base_t base, int32_t event_id, void* event_data) {
    switch (event_id) {
    case WEBSOCKET_EVENT_CONNECTED:
        ESP_LOGI(TAG, "WEBSOCKET_EVENT_CONNECTED");
        break;
    case WEBSOCKET_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "WEBSOCKET_EVENT_DISCONNECTED");
        break;
    case WEBSOCKET_EVENT_DATA:
    {
        esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
        if (data->op_code == 0x01 && data->data_len > 0) {
            // It's a text frame. Terminate and parse.
            // Note: The websocket client library does not null-terminate for us in place safely if data isn't chunked properly, but usually it's fine for small JSONs. 
            // For robustness, create a temp buffer.
            char* payload = (char*)malloc(data->data_len + 1);
            if (payload) {
                memcpy(payload, data->data_ptr, data->data_len);
                payload[data->data_len] = '\0';
                if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "Received WS payload: %s", payload);
                StateManager::mergeJson(payload);
                free(payload);
            }
        }
        break;
    }
    case WEBSOCKET_EVENT_ERROR:
        ESP_LOGI(TAG, "WEBSOCKET_EVENT_ERROR");
        break;
    }
}

void VavWifiManager::syncTaskLoop(void* arg) {
    uint32_t delay_ms = (uint32_t)(uintptr_t)arg;
    if (delay_ms == 0) delay_ms = 1000;

    static int tick_counter = 0;

    while (1) {
        if (client != NULL && esp_websocket_client_is_connected(client)) {
            char* out;
            if (tick_counter++ % 10 == 0) {
                out = StateManager::getJsonString(true);
            } else {
                out = StateManager::getDirtyJsonString();
            }
            
            // if (out) {
            //     if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "Publishing state (delta=%d): %s", (tick_counter-1)%10 != 0, out);
            //     esp_websocket_client_send_text(client, out, strlen(out), pdMS_TO_TICKS(500));
            //     free(out);
            // }
        }
        vTaskDelay(pdMS_TO_TICKS(delay_ms));
    }
}

void VavWifiManager::init() {
    StateManager::set("vav_id", "ZONE_01");
    
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
}
