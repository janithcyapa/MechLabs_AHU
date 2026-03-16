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

### 1. Install System Dependencies
On the Pi Zero / Linux host:
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients python3-pip
```

# Run FAST API
```bash
cd FastAPi/
fastapi dev main.py
```

