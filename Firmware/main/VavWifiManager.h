#pragma once
#include "esp_event.h"

class VavWifiManager {
public:
    static bool init();
    static void syncTaskLoop(void* arg);
    
private:
    static void websocketEventHandler(void* handler_args, esp_event_base_t base, int32_t event_id, void* event_data);
};
