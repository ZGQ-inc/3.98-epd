import asyncio
import threading
import time
import sys
import serial
from bleak import BleakClient

RX_UUID = "0000ff01-0000-1000-8000-00805f9b34fb"
TX_UUID = "0000ff02-0000-1000-8000-00805f9b34fb"
TARGET_ADDR = "FA:63:93:6E:A0:3F"

stop_event = threading.Event()

def serial_monitor():
    try:
        s = serial.Serial()
        s.port = 'COM17'
        s.baudrate = 115200
        s.dtr = False
        s.rts = False
        s.timeout = 0.5
        s.open()
        while not stop_event.is_set():
            line = s.readline()
            if line:
                try:
                    text = line.decode('utf-8', errors='replace').rstrip()
                    print(f"[SERIAL] {text}", flush=True)
                except Exception:
                    pass
        s.close()
    except Exception as e:
        print(f"[SERIAL ERROR] {e}", flush=True)

def notification_handler(sender, data):
    try:
        msg = data.decode("utf-8", errors="replace")
        print(f"[BLE NOTIFICATION] {msg}", flush=True)
    except Exception as e:
        print(f"[BLE NOTIFICATION RAW] {data}", flush=True)

async def test_ble():
    print(f"Connecting to BLE device {TARGET_ADDR}...")
    async with BleakClient(TARGET_ADDR) as client:
        print(f"Connected! is_connected={client.is_connected}")
        await client.start_notify(TX_UUID, notification_handler)
        print("Started notifications on TX characteristic")
        await asyncio.sleep(0.5)
        print("Sending 'status' command...")
        await client.write_gatt_char(RX_UUID, b"status", response=False)
        print("Sent status command. Monitoring for 10 seconds...")
        for i in range(10):
            await asyncio.sleep(1)
            print(f"Still connected: {client.is_connected}")
            if not client.is_connected:
                print("Disconnected prematurely!")
                break

if __name__ == "__main__":
    t = threading.Thread(target=serial_monitor, daemon=True)
    t.start()
    try:
        asyncio.run(test_ble())
    except Exception as e:
        print(f"BLE Error: {e}")
    finally:
        stop_event.set()
        time.sleep(0.5)
