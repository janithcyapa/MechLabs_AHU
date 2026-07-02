#pragma once

class AhuWifiManager {
public:
    static bool init();
    static void broadcastState();
    static void syncTaskLoop(void* arg);

private:
    static void wsCommandCallback(const char* payload);
};
