# MechLabs_AHU
Digitalization of the existing AHU in the Thermodynamics Laboratory
# Portable IoT Telemetry & Control Hub (Bare Metal)

A lightweight, high-performance IoT ecosystem optimized for low-power hardware (Raspberry Pi Zero). This setup avoids containerization overhead to maximize available RAM and CPU for real-time control.

## 🚀 System Architecture

### 1. Edge Layer (The "Spokes")
* **Hardware:** Multiple ESP32 Microcontrollers.
* **Framework:** **ESP-IDF**.
* **Protocol:** **MQTT** for lightweight messaging.
* **Data Format:** **cJSON** for structured telemetry and target command parsing.
* **Discovery:** **mDNS** for automatic Hub discovery.

### 2. Messaging Layer (The "Post Office")
* **Broker:** **Eclipse Mosquitto** (Installed via `apt` or `dnf`).
* **Configuration:** Minimalist local broker config.
* **Role:** High-speed message routing between ESPs and the Backend.

### 3. Backend Layer (The "Orchestrator")
* **Framework:** **FastAPI** (Python 3.10+).
* **MQTT Driver:** `fastapi-mqtt` (Async-based).
* **Real-time Push:** **WebSockets** for frontend synchronization.
* **Database:** **SQLite** (Single-file, Zero-config).
    * *Recording Logic:* When enabled via UI, the backend pipes MQTT streams into the SQLite database file (`telemetry.db`).

### 4. Frontend Layer (The "Dashboard")
* **Framework:** **React** (Vite).
* **Optimization:** Pre-compiled static build (`npm run build`).
* **Serving:** Served directly by FastAPI using `StaticFiles`, eliminating the need for a separate Nginx or Node server.

---

## 🛠️ Portable "Bare Metal" Setup

To move this project to a new device (like a Pi Zero), follow these steps:

### Install System Dependencies
On the Pi Zero / Linux host:
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients python3-pip
```
### Run Mosquitto Client
```bash
sudo systemctl start mosquitto
```

### Run FAST API
```bash
cd FastAPi/
fastapi dev main.py
```

# HVAC System MQTT Topic Architecture

## 📖 Overview
This outlines the MQTT topic schema and JSON payload structures for the Live Monitoring HVAC dashboard. 

To optimize network efficiency and ensure simultaneous data updates on the frontend, this architecture groups related sensor and actuator data into single **JSON objects**. 

**Topic Structure:** `[location]/[data_direction]/[component]`
* **`telemetry`**: Data sent from the ESP32 to the Server.
* **`cmd`**: Commands sent from the Server to the ESP32.

---

## 🏗️ 1. AHU (Air Handling Unit)

### 📡 Telemetry (Sensors -> Server)
The AHU ESP32 publishes to specific component topics. Every payload uses a standardized JSON format containing 4 keys: `temp`, `hum`, `co2`, and `pressure`. 

*Note: If a component does not have a specific sensor (e.g., no CO2 sensor in the Cooler), the value is transmitted as `null`.*

| Component | Topic Path | Example JSON Payload |
| :--- | :--- | :--- |
| **System Status** | `ahu/telemetry/state` | `{"dt": 12, "start":10}` |
| **Outside Air** | `ahu/telemetry/outside` | `{"temp": 32.5, "hum": 65.0, "co2": 410, "pressure": null}` |
| **Return Air** | `ahu/telemetry/return` | `{"temp": 28.5, "hum": 55.0, "co2": 800, "pressure": null}` |
| **Mix Sensor** | `ahu/telemetry/mix` | `{"temp": 24.0, "hum": 58.0, "co2": null, "pressure": 102}` |
| **Cooler Sensor** | `ahu/telemetry/cooler` | `{"temp": 14.5, "hum": 95.0, "co2": null, "pressure": 98}` |
| **Heater Sensor** | `ahu/telemetry/heater` | `{"temp": 18.0, "hum": 60.0, "co2": null, "pressure": 95}` |
| **Release Air** | `ahu/telemetry/release` | `{"temp": 18.5, "hum": 58.0, "co2": 500, "pressure": null}` |
| **Actuators** | `ahu/telemetry/actuators` | `{"mix_damper": 40.0, "cool_coil": 75.0, "heat_coil": 60.0, "humidifier": 10.0, "main_blower": 80.0}` |

**Data Types:**
* `temp` (Float): Temperature in °C
* `hum` (Float): Relative Humidity in %
* `co2` (Integer): CO2 levels in ppm
* `pressure` (Integer): Air pressure in Pa

### ⚙️ Commands (Server -> Actuators)
Instead of multiple command topics, the Server sends a single JSON object to the AHU containing all target values for its actuators. The ESP32 parses this object and updates the corresponding PWM/Servo outputs.

| Topic Path | Description | Example JSON Payload |
| :--- | :--- | :--- |
| `ahu/cmd` | Master AHU Command | `{"mix_damper": 40.0, "cool_coil": 75.0, "heat_coil": 60.0, "humidifier": 10.0, "main_blower": 80.0}` |

**Data Types:**
* All actuator values are **Floats** representing a percentage `0.0 - 100.0`.

---

## 🏢 2. Zones
*Replace `[zone_id]` with the specific zone identifier (e.g., `north`, `south`, `floor_1`).*

### 📡 Telemetry (Sensors -> Server)
Each zone's ESP32 publishes its environmental conditions using the same standardized 4-key JSON structure as the AHU.

| Topic Path | Description | Example JSON Payload |
| :--- | :--- | :--- |
| `zone/[zone_id]/telemetry` | Zone Environment | `{"temp": 23.0, "hum": 55.0, "co2": 600, "pressure": null}` |

### ⚙️ Commands (Server -> Actuators)
The Server sends target positions to the specific zone's ESP32 to adjust local airflow.

| Topic Path | Description | Example JSON Payload |
| :--- | :--- | :--- |
| `zone/[zone_id]/cmd` | Zone Actuator Command | `{"damper": 60.0}` |
