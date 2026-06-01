#!/bin/bash

echo "Starting System Controller Dashboard..."

# We no longer need Mosquitto or FastAPI because the dashboard connects directly to the ESP Access Point via WebSockets.

cd Dashboard || exit

echo "Starting Dashboard..."
npm run dev -- --open &
DASHBOARD_PID=$!

echo "-------------------------------------------------"
echo "Dashboard is running! Ensure your laptop is connected to the 'MechLabs_AHU' WiFi hotspot."
echo "Press CTRL+C in this terminal to quit."
echo "-------------------------------------------------"

# Clean Shutdown
trap "echo -e '\nShutting down...'; kill $DASHBOARD_PID; echo 'Dashboard Offline.'; exit" SIGINT

wait $DASHBOARD_PID