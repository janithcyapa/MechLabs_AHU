idf_component_register(
    SRCS "main.cpp"
    INCLUDE_DIRS "."
    REQUIRES
    cjson 
    util_i2c
    sens_aht21
    sens_ens160
    sens_bme280
    sens_pca9548a
    util_wifi
    util_server
    util_pwm
    )
