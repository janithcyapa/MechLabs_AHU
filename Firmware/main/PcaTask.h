#pragma once

class PcaTask {
public:
    static void init();
    static void start();
private:
    static void taskLoop(void* arg);
};
