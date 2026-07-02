#pragma once

enum class SystemState {
    IDLE,
    STARTUP,
    WAIT_WIFI,
    INIT_ERROR,
    READY,
    SYNC_SUCCESS,
    SENSOR_ERROR,
    SYNC_ERROR
};

void initHardwareUtils();
void setSystemState(SystemState state);
