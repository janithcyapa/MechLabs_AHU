#include "AhuWifiManager.h"
#include "util_wifi.hpp"
#include "util_server.hpp"
#include "StateManager.h"
#include "esp_log.h"
#include "sdkconfig.h"

static const char *TAG = "AhuWifiManager";

void AhuWifiManager::wsCommandCallback(const char* payload) {
    ESP_LOGI(TAG, "Received WS payload: %s", payload);
    StateManager::mergeJson(payload);
    broadcastState();
}

void AhuWifiManager::init() {
    StateManager::set("hub_id", "AHU_MAIN");
    
    ESP_LOGI(TAG, "Starting AHU WiFi AP (SSID: %s)", CONFIG_ESP_WIFI_SSID);
    WifiUtil::init_ap(CONFIG_ESP_WIFI_SSID, CONFIG_ESP_WIFI_PASSWORD, 10);
    
    ESP_LOGI(TAG, "Mounting SPIFFS...");
    ServerUtil::mount_spiffs();
    
    ESP_LOGI(TAG, "Starting Server...");
    ServerUtil::init();
    ServerUtil::set_cmd_callback(wsCommandCallback);
}

void AhuWifiManager::broadcastState() {
    char* out = StateManager::getJsonString();
    if (out) {
        ServerUtil::send_ws_data(out);
        free(out);
    }
}
