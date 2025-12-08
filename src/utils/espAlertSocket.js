// src/utils/espSocket.js
const WebSocket = require("ws");
const deviceModel = require("../models/deviceModel"); // Import your Device model

function espAlertSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    console.log("🔌 ESP32 WebSocket Server initialized");

    wss.on("connection", (ws, req) => {
        const clientIP = req.socket.remoteAddress;
        console.log(`✅ ESP32 connected from ${clientIP}`);

        ws.on("message", async (message) => {
            console.log(`📩 Raw message received: ${message.toString()}`);

            try {
                const data = JSON.parse(message);
                console.log("📦 Parsed JSON Data:", data);

                console.log(
                    `🌡️ Data -> Device: ${data.deviceId} | Ambient: ${data.ambient}°C | Freezer: ${data.freezer}°C | Battery: ${data.batteryAlert} | Refrigerator: ${data.refrigeratorAlert}`
                );

                // Update or insert device data in MongoDB
                await deviceModel.findOneAndUpdate(
                    { deviceId: data.deviceId },
                    {
                        AmbientData: { temperature: parseFloat(data.ambient) },
                        FreezerData: { temperature: parseFloat(data.freezer) },
                        batteryAlert: data.batteryAlert === "LOW",
                        refrigeratorAlert: data.refrigeratorAlert === "ALERT",
                        lastSeen: new Date(), // optional: track last time device sent data
                    },
                    { upsert: true, new: true }
                );
            } catch (err) {
                console.error("❌ JSON Parse or DB Error:", err.message);
            }
        });

        ws.on("close", (code, reason) => {
            console.log(`❌ ESP32 disconnected (code: ${code}, reason: ${reason})`);
        });

        ws.on("error", (err) => {
            console.error("⚠️ WebSocket Error:", err.message);
        });

        // Send confirmation to ESP32
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send('{"serverMsg":"Hello ESP32, connection OK!"}');
                console.log("📤 Sent confirmation message to ESP32");
            }
        }, 1000);
    });

    return wss;
}

module.exports = { espAlertSocket };
