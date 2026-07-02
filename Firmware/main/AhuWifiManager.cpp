#include "AhuWifiManager.h"
#include "util_wifi.hpp"
#include "util_server.hpp"
#include "cJSON.h"
#include "esp_log.h"
#include "sdkconfig.h"

static const char *TAG = "AhuWifiManager";
static cJSON* globalState = NULL;

void AhuWifiManager::wsCommandCallback(const char* payload) {
    ESP_LOGI(TAG, "Received WS payload: %s", payload);
    
    cJSON* parsed = cJSON_Parse(payload);
    if (parsed) {
        cJSON* child = parsed->child;
        while (child) {
            // Update or add each field to globalState
            cJSON_DeleteItemFromObject(globalState, child->string);
            cJSON_AddItemToObject(globalState, child->string, cJSON_Duplicate(child, 1));
            child = child->next;
        }
        cJSON_Delete(parsed);
        
        // Immediately broadcast the updated state to all connected clients
        broadcastState();
    } else {
        ESP_LOGE(TAG, "Failed to parse incoming WS JSON");
    }
}

void AhuWifiManager::init() {
    globalState = cJSON_CreateObject();
    cJSON_AddStringToObject(globalState, "hub_id", "AHU_MAIN");
    
    ESP_LOGI(TAG, "Starting AHU WiFi AP (SSID: %s)", CONFIG_ESP_WIFI_SSID);
    WifiUtil::init_ap(CONFIG_ESP_WIFI_SSID, CONFIG_ESP_WIFI_PASSWORD, 10);
    
    ESP_LOGI(TAG, "Mounting SPIFFS...");
    ServerUtil::mount_spiffs();
    
    ESP_LOGI(TAG, "Starting Server...");
    ServerUtil::init();
    ServerUtil::set_cmd_callback(wsCommandCallback);
}

void AhuWifiManager::updateState(const char* key, double value) {
    if (!globalState) return;
    cJSON_DeleteItemFromObject(globalState, key);
    cJSON_AddNumberToObject(globalState, key, value);
}

void AhuWifiManager::broadcastState() {
    if (!globalState) return;
    char* out = cJSON_PrintUnformatted(globalState);
    if (out) {
        ServerUtil::send_ws_data(out);
        free(out);
    }
}
