require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const { socketAuth, handleSocket } = require("./socket/socketHandler");

const isPrivateLanHost = (host) => {
  if (!host) return false;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
};

const isAllowedOrigin = (origin) => {
  // Allow non-browser tools (no Origin header), explicit client URL, and private LAN origins.
  if (!origin) return true;

  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;

  try {
    const parsed = new URL(origin);
    return ["http:", "https:"].includes(parsed.protocol) && isPrivateLanHost(parsed.hostname);
  } catch {
    return false;
  }
};
 
// ─── APP SETUP ────────────────────────────────────────────────────────────────
const app = express();
 
// We wrap Express in an HTTP server so Socket.io can share the same port
const httpServer = http.createServer(app);
 
// Socket.io server — allow connections from the React frontend
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  },
});
 
// ─── MIDDLEWARES ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json()); // Parse JSON request bodies
 
// ─── REST API ROUTES ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
 
// Health check route
app.get("/", (req, res) => res.send("Chat API is running"));
 
// ─── SOCKET.IO SETUP ─────────────────────────────────────────────────────────
// Authenticate every socket connection using JWT before allowing any events
io.use(socketAuth);
 
// Set up event handlers for each new socket connection
io.on("connection", (socket) => handleSocket(io, socket));
 
// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
 
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
 