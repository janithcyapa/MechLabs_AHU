#pragma once

class InputTask {
public:
    static void init();
    static void start();
private:
    static void taskLoop(void* arg);
};
