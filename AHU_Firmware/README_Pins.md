# Pin Overview for ESP32 Firmware

This document lists all GPIO pins referenced in the main ESP32 firmware (`main/main.cpp` and related headers) used for the I2C multiplexer, relays, servos, RGB LED, buzzer, and other peripherals.

## I2C Multiplexer (PCA9548A)
| Function | GPIO Pin |
|---|---|
| I2C SDA (data) | GPIO 21 |
| I2C SCL (clock) | GPIO 22 |
| Multiplexer address | 0x70 (no dedicated pin) |

## Relays
| Relay | GPIO Pin |
|---|---|
| Cooling coil relay | GPIO 13 |
| Heating coil relay | GPIO 33 |
| Humidifier relay | GPIO 32 |
| Extra (e.g., vent) relay | GPIO 23 |
| Backup Mist Maker (humidifier backup) | GPIO 14 |

## Servo Motors
| Servo | GPIO Pin |
|---|---|
| Damper servo (mix) | GPIO 19 |
| Main blower servo | GPIO 18 |

## RGB LED (Common Anode/ Cathode)
| Color | GPIO Pin |
|---|---|
| Red | GPIO 27 |
| Green | GPIO 26 |
| Blue | GPIO 25 |

## Buzzer
| Component | GPIO Pin |
|---|---|
| Buzzer (piezo) | GPIO 4 |

## Reserved / Unused Pins (available for future use)
| GPIO Pin |
|---|
| 34 |
| 35 |
| 36 (VP) |
| 39 (VN) |

---
*Generated from source code definitions in `main/main.cpp` and `components/ESP-IDF-Component-Kit/util_i2c/include/util_i2c.hpp`.*
