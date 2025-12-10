const express = require("express");
const dotenv = require("dotenv");
const dbConnection = require("./src/config/dbConnection");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");

// Routers
const userRouter = require("./src/routes/userRouter");
const orgRouter = require("./src/routes/organizationRouter");
const authRouter = require("./src/routes/authRouter");
const venueRouter = require("./src/routes/venueRouter");
const deviceRouter = require("./src/routes/deviceRouter");
const authenticate = require("./src/middlewere/authMiddleware");
const otaRouter = require("./src/routes/otaRoutes");
const alertsRouter = require("./src/routes/alertsRouter");


// Utilities
const { espAlertSocket } = require("./src/utils/espAlertSocket");
const { initEspOtaSocket } = require("./src/utils/espOtaSocket");

dotenv.config();
dbConnection();
const port = 5050;
// const port = 5000;
const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Routes
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/organization", authenticate, orgRouter);
app.use("/venue", authenticate, venueRouter);
app.use("/device", authenticate, deviceRouter);

app.use("/ota", otaRouter);
app.use("/alert", alertsRouter);


const alertWss = espAlertSocket(server);
const otaWss = initEspOtaSocket(server);

//differentiate the url like for 
// alerts ws://ip:5000/ws/alerts
// ota ws://ip:5000/ws/ota
server.on("upgrade", (req, socket, head) => {
    if (req.url === "/ws/alerts") {
        alertWss.handleUpgrade(req, socket, head, (ws) => {
            alertWss.emit("connection", ws, req);
        });
    } else if (req.url === "/ws/ota") {
        otaWss.handleUpgrade(req, socket, head, (ws) => {
            otaWss.emit("connection", ws, req);
        });
    } else {
        socket.destroy(); // reject unknown paths
    }
});

app.get("/ping", (req, res) => {
    console.log("📩 Ping received from:", req.ip);
    res.send("✅ Backend is reachable");
});

app.get("/", (req, res) => { res.send("HELLOW FARAZ") });

// Start server
server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Express & Socket.IO running on port: ${port}`);
});
