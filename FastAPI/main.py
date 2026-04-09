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
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
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
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")

manager = ConnectionManager()

# 3. MQTT -> WebSocket (Telemetry Monitoring)
@mqtt.subscribe("ahu/telemetry/#")
@mqtt.subscribe("ahu/heartbeat")
@mqtt.subscribe("ahu/status")
@mqtt.subscribe("zone/#")
async def message_handler(client, topic, payload, qos, properties):
    try:
        data = json.loads(payload.decode())
        
        # We pass everything to the frontend, identifying it by topic
        broadcast_msg = {
            "type": "telemetry", 
            "topic": topic,
            "data": data
        }
        
        await manager.broadcast(broadcast_msg)
    except json.JSONDecodeError:
        print(f"Malformed JSON received on {topic}")

# 4. WebSocket -> MQTT (Full Duplex Endpoint)
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages from the React Dashboard
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                # Check if React is sending a command to actuate the ESP32
                if message.get("type") == "command":
                    target_topic = message.get("topic")
                    cmd_payload = message.get("payload") # e.g., {"mix_damper": 40.0}
                    
                    if target_topic and cmd_payload:
                        # Forward the command to the Mosquitto broker
                        mqtt.publish(target_topic, json.dumps(cmd_payload))
                        print(f"Command forwarded: {target_topic} -> {cmd_payload}")
                
                elif message.get("type") == "ping":
                    # Keep-alive ping from frontend
                    pass

            except json.JSONDecodeError:
                print("Received non-JSON message from frontend.")

    except WebSocketDisconnect:
        manager.disconnect(websocket)