const WebSocket = require("ws");

// Replace with your WebSocket server URL
const SERVER_URL = "ws://10.1.7.167:5000/ws/alerts";

// Create 4 simulated ESP32 devices
const DEVICES = [
    "device-001",
    "device-002",
    // "device-003",
    // "device-004",
];

// Helper function to generate random values
function getRandomValue(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

// Function to simulate one device connection
function simulateDevice(deviceId) {
    const ws = new WebSocket(SERVER_URL);

    ws.on("open", () => {
        console.log(`✅ [${deviceId}] Connected to WebSocket Server`);

        // Send sensor data every 3 seconds
        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const payload = {
                    deviceId,
                    ambient: getRandomValue(20, 35), // °C
                    freezer: getRandomValue(-20, 0), // °C
                    batteryAlert: Math.random() > 0.8 ? "LOW" : "NORMAL", // 20% chance LOW
                    refrigeratorAlert: Math.random() > 0.85 ? "ALERT" : "OK", // 15% chance ALERT
                    timestamp: new Date().toISOString(),
                };

                ws.send(JSON.stringify(payload));
                console.log(`📤 [${deviceId}] Sent:`, payload);
            }
        }, 60000);

        // Handle disconnection cleanup
        ws.on("close", () => {
            console.log(`❌ [${deviceId}] Disconnected from server`);
            clearInterval(interval);
        });

        ws.on("error", (err) => {
            console.error(`⚠️ [${deviceId}] WebSocket Error:`, err.message);
        });

        ws.on("message", (msg) => {
            console.log(`📩 [${deviceId}] Message from server: ${msg.toString()}`);
        });
    });
}

// Start simulation for all devices
DEVICES.forEach((id) => simulateDevice(id));
