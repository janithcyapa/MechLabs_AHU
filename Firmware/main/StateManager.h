#pragma once

#include "cJSON.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"

class StateManager {
public:
    static void init();
    
    // Setters
    static void set(const char* key, double value);
    static void set(const char* key, const char* value);
    
    // Getters
    static double getDouble(const char* key, double default_val = 0.0);
    
    // JSON generation
    static char* getJsonString();
    
    // Merge incoming JSON string (e.g. from websocket)
    static void mergeJson(const char* json_str);

private:
    static cJSON* state;
    static SemaphoreHandle_t mutex;
};
