#include "StateManager.h"
#include "esp_log.h"
#include <string.h>

static const char* TAG = "StateManager";

cJSON* StateManager::state = nullptr;
SemaphoreHandle_t StateManager::mutex = nullptr;
std::unordered_set<std::string> StateManager::dirty_keys;

void StateManager::init() {
    state = cJSON_CreateObject();
    mutex = xSemaphoreCreateMutex();
}

void StateManager::set(const char* key, double value) {
    if (xSemaphoreTake(mutex, portMAX_DELAY)) {
        cJSON_DeleteItemFromObject(state, key);
        cJSON_AddNumberToObject(state, key, value);
        dirty_keys.insert(key);
        xSemaphoreGive(mutex);
    }
}

void StateManager::set(const char* key, const char* value) {
    if (xSemaphoreTake(mutex, portMAX_DELAY)) {
        cJSON_DeleteItemFromObject(state, key);
        cJSON_AddStringToObject(state, key, value);
        dirty_keys.insert(key);
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

char* StateManager::getJsonString(bool clear_dirty) {
    char* str = nullptr;
    if (xSemaphoreTake(mutex, portMAX_DELAY)) {
        str = cJSON_PrintUnformatted(state);
        if (clear_dirty) dirty_keys.clear();
        xSemaphoreGive(mutex);
    }
    return str;
}

char* StateManager::getDirtyJsonString() {
    char* str = nullptr;
    if (xSemaphoreTake(mutex, portMAX_DELAY)) {
        if (dirty_keys.empty()) {
            xSemaphoreGive(mutex);
            return nullptr;
        }
        cJSON* delta = cJSON_CreateObject();
        for (const auto& key : dirty_keys) {
            cJSON* item = cJSON_GetObjectItem(state, key.c_str());
            if (item) {
                cJSON_AddItemToObject(delta, key.c_str(), cJSON_Duplicate(item, 1));
            }
        }
        str = cJSON_PrintUnformatted(delta);
        cJSON_Delete(delta);
        dirty_keys.clear();
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
                dirty_keys.insert(child->string);
                child = child->next;
            }
            xSemaphoreGive(mutex);
        }
        cJSON_Delete(parsed);
    } else {
        ESP_LOGE(TAG, "Failed to parse incoming JSON for merge");
    }
}
