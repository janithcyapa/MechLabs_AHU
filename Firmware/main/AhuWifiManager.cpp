#include "AhuWifiManager.h"
#include "util_wifi.hpp"
#include "util_server.hpp"
#include "StateManager.h"
#include "esp_log.h"
#include "sdkconfig.h"

static const char *TAG = "AhuWifiManager";
extern const int VERBOSE_MODE;

void AhuWifiManager::wsCommandCallback(const char* payload) {
    if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "Received WS payload: %s", payload);
    StateManager::mergeJson(payload);
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
        if (VERBOSE_MODE >= 2) ESP_LOGI(TAG, "Broadcasting state: %s", out);
        ServerUtil::send_ws_data(out);
        free(out);
    }
}

void AhuWifiManager::syncTaskLoop(void* arg) {
    uint32_t delay_ms = (uint32_t)(uintptr_t)arg;
    if (delay_ms == 0) delay_ms = 1000;

    while (1) {
        broadcastState();
        vTaskDelay(pdMS_TO_TICKS(delay_ms));
    }
}
