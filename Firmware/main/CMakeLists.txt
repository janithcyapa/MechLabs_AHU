set(BUILD_ROOM_NODE OFF) # Change to ON to build the room sensor node firmware

if(BUILD_ROOM_NODE)
    set(SRC_FILES "MainVavController.cpp")
else()
    set(SRC_FILES "MainAHUHub.cpp")
endif()

idf_component_register(
    SRCS "${SRC_FILES}" "HardwareUtils.cpp"
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

spiffs_create_partition_image(spiffs ../data FLASH_IN_PROJECT)
