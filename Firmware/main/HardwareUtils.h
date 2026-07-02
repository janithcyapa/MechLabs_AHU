#pragma once

enum class SystemState {
    IDLE,
    WELCOME,
    SUCCESS,
    ERROR,
    ALERT,
    WARNING
};

void initHardwareUtils();
void setSystemState(SystemState state);
