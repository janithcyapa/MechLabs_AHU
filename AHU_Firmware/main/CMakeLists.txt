set(BUILD_ROOM_NODE ON) # Change to ON to build the room sensor node firmware

if(BUILD_ROOM_NODE)
    set(SRC_FILES "room_main.cpp")
else()
    set(SRC_FILES "main.cpp")
endif()

idf_component_register(
    SRCS "${SRC_FILES}"
    INCLUDE_DIRS "."
    REQUIRES
    cjson 
    esp_adc
    util_i2c
    sens_aht21
    sens_ens160
    sens_bme280
    sens_pca9548a
    util_wifi
    util_server
    util_pwm
    esp_websocket_client
    )
