## On Fedora Linux

Install

```bash
sudo dnf install mosquitto
sudo dnf install mosquitto mosquitto-devel
```

Verification

```bash
mosquitto_sub --help
```

Config
```bash
sudo nano /etc/mosquitto/mosquitto.conf
```

add these to tnhe bottom
```Plaintext
listener 1883 0.0.0.0
allow_anonymous true
```

Enable Service
```bash
# Start the broker
sudo systemctl start mosquitto

# Make it start automatically on reboot
sudo systemctl enable mosquitto

# Verify it is running
sudo systemctl status mosquitto
```

Firewall config
```bash
sudo firewall-cmd --permanent --add-port=1883/tcp
sudo firewall-cmd --reload
```

Test

Terminal 01
```bash
mosquitto_sub -h localhost -t "test/ahu"
```

Terminal 02
```bash
mosquitto_pub -h localhost -t "test/ahu" -m "Hello from Jazz"
```

Find laptops hostname
```bash
hostname -I | awk '{print $1}'
```

Data from ESP
```bash
mosquitto_sub -h localhost -t "telemetry/#" -v
```

Send to ESP
```bash
mosquitto_pub -h localhost -t "targets/esp_01" -m "26.5"
```