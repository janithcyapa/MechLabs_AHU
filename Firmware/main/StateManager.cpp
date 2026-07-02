#include "StateManager.h"
#include "esp_log.h"
#include <string.h>

static const char* TAG = "StateManager";

cJSON* StateManager::state = nullptr;
SemaphoreHandle_t StateManager::mutex = nullptr;

void StateManager::init() {
    state = cJSON_CreateObject();
    mutex = xSemaphoreCreateMutex();
}

void StateManager::set(const char* key, double value) {
    if (xSemaphoreTake(mutex, portMAX_DELAY)) {
        cJSON_DeleteItemFromObject(state, key);
        cJSON_AddNumberToObject(state, key, value);
        xSemaphoreGive(mutex);
    }
}

void StateManager::set(const char* key, const char* value) {
    if (xSemaphoreTake(mutex, portMAX_DELAY)) {
        cJSON_DeleteItemFromObject(state, key);
        cJSON_AddStringToObject(state, key, value);
        xSemaphoreGive(mutex);
    }
}

double StateManager::getDouble(const char* key, double default_val) {
    double val = default_val;
    if (xSemaphoreTake(mutex, portMAX_DELAY)) {
        cJSON* item = cJSON_GetObjectItem(state, key);
        if (item && cJSON_IsNumber(item)) {
            val = item->valuedouble;
        }
        xSemaphoreGive(mutex);
    }
    return val;
}

char* StateManager::getJsonString() {
    char* str = nullptr;
    if (xSemaphoreTake(mutex, portMAX_DELAY)) {
        str = cJSON_PrintUnformatted(state);
        xSemaphoreGive(mutex);
    }
    return str;
}

void StateManager::mergeJson(const char* json_str) {
    if (!json_str) return;
    
    cJSON* parsed = cJSON_Parse(json_str);
    if (parsed) {
        if (xSemaphoreTake(mutex, portMAX_DELAY)) {
            cJSON* child = parsed->child;
            while (child) {
                cJSON_DeleteItemFromObject(state, child->string);
                cJSON_AddItemToObject(state, child->string, cJSON_Duplicate(child, 1));
                child = child->next;
            }
            xSemaphoreGive(mutex);
        }
        cJSON_Delete(parsed);
    } else {
        ESP_LOGE(TAG, "Failed to parse incoming JSON for merge");
    }
}
