import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mqtt import FastMQTT, MQTTConfig
from typing import List

app = FastAPI()

# 1. MQTT Configuration
mqtt_config = MQTTConfig(host="localhost", port=1883)
mqtt = FastMQTT(config=mqtt_config)
mqtt.init_app(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development only
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # List to track all active browser/dashboard tabs
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New dashboard connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Dashboard disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send data to ALL connected React clients"""
        for connection in self.active_connections:
            try:
                # We send as JSON so React can easily parse it
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")

manager = ConnectionManager()

# 3. MQTT Handler: Bridges Mosquitto to WebSockets
@mqtt.subscribe("telemetry/#")
async def message_handler(client, topic, payload, qos, properties):
    data = payload.decode()
    
    # Create a structured message for the frontend
    payload_dict = {
        "topic": topic,
        "value": data
    }
    
    # Push the data to all connected React apps immediately
    await manager.broadcast(payload_dict)
    print(f"MQTT -> WebSocket: {topic} : {data}")

# 4. WebSocket Endpoint for React
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive by waiting for any message (even a 'ping')
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 5. REST API to send targets back to ESP32
@app.post("/set-target")
async def set_target(topic: str, value: float):
    # e.g., publishing to "targets/esp_01"
    mqtt.publish(topic, str(value))
    return {"status": "published", "topic": topic, "value": value}