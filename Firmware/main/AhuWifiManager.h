#pragma once

class AhuWifiManager {
public:
    static void init();
    static void updateState(const char* key, double value);
    static void broadcastState();

private:
    static void wsCommandCallback(const char* payload);
};
