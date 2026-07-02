#pragma once

class AhuWifiManager {
public:
    static void init();
    static void broadcastState();

private:
    static void wsCommandCallback(const char* payload);
};
