import json
import paho.mqtt.client as mqtt

# Example: Set blower to 90% and open cooling coil to 50%
command = {
    "main_blower": 90.0,
    "cool_coil": 50.0
}

client = mqtt.Client()
client.connect("172.23.239.32")
client.publish("ahu/cmd", json.dumps(command))