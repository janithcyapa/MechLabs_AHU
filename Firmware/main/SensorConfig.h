#pragma once

enum class PcaSensorType { 
    NONE, 
    AHT21_ENS160, 
    BME280 
};

enum class InputType { 
    NONE, 
    ANALOG_ADC, 
    DIGITAL_GPIO 
};

enum class OutputType { 
    NONE, 
    PWM, 
    RELAY 
};

struct PcaChannelConfig {
    PcaSensorType type;
    const char* name; // e.g. "room1"
};

struct InputPinConfig {
    InputType type;
    int pin;
    const char* state_key; // e.g. "filter_pressure"
};

struct OutputPinConfig {
    OutputType type;
    int pin;
    const char* state_key; // e.g. "fan_speed"
};

extern const PcaChannelConfig pca_config[8];

extern const InputPinConfig input_config[];
extern const int input_config_size;

extern const OutputPinConfig output_config[];
extern const int output_config_size;
