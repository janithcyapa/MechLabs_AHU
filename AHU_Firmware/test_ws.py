import asyncio
import websockets

async def test_esp32_ws():
    # Replace with your ESP32's IP address
    uri = "ws://192.168.4.1/ws" 
    
    print(f"Attempting to connect to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected!")
            
            # Send a test message
            message = "Hello ESP32!"
            await websocket.send(message)
            print(f"➔ Sent: {message}")
            
            while(1):
                # Wait for the response/echo
                response = await websocket.recv()
                print(f"← Received: {response}")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_esp32_ws())
