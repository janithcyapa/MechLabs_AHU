idf_component_register(
    SRCS "main.cpp"
    INCLUDE_DIRS "."
    REQUIRES
    json 
    util_i2c
    sens_aht21
    sens_ens160
    sens_bme280
    util_wifi
    util_mqtt
    util_pwm
    )
