#include "util_mqtt.hpp"
#include "util_wifi.hpp"
#include "esp_log.h"

void on_mqtt_data(const char* topic, const char* data) {
    // Restored your full print statement
    ESP_LOGI("MAIN", "Target Received on %s: %s", topic, data);
}

extern "C" void app_main(void) {
    WifiUtil::init_wifi(); 

    // 1. Tell MqttUtil what to subscribe to *before* connecting.
    MqttUtil::subscribe("targets/esp_01", on_mqtt_data);

    // 2. Start the connection. Once connected, it will automatically subscribe.
    MqttUtil::init("mqtt://10.149.249.32");

    while (1) {
        MqttUtil::publish("telemetry/esp_01", "{\"temp\": 24.5}");
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}