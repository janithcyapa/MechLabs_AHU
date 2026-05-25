#!/bin/bash

echo "Starting System Controller..."

# 1. Start the Mosquitto Broker (will ask for your sudo password once)
echo "Starting MQTT Broker..."
sudo systemctl start mosquitto

# 2. Start the FastAPI backend in the background
echo "Starting Backend Server..."
# NOTE: If you use a Python virtual environment, uncomment the next line and fix the path
# source venv/bin/activate 
cd FastAPI || exit

uvicorn main:app --host 127.0.0.1 --port 8000 &
FASTAPI_PID=$!

cd ..
# Wait a couple of seconds to ensure the server is ready
sleep 2

# 3. Open the default web browser to the app
echo "Opening Dashboard..."
xdg-open http://localhost:8000

echo "-------------------------------------------------"
echo "App is running! Press CTRL+C in this terminal to quit."
echo "-------------------------------------------------"

# 4. Clean Shutdown (The Magic Sauce)
# This traps the CTRL+C signal. When you press it, it kills FastAPI and stops Mosquitto automatically.
trap "echo -e '\nShutting down...'; kill $FASTAPI_PID; sudo systemctl stop mosquitto; echo 'System Offline.'; exit" SIGINT

# Keep the script running so the trap works
wait $FASTAPI_PID