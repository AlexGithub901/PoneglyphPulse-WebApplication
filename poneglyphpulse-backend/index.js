// index.js - PoneglyphPulse backend entry

// -------------------- Imports --------------------
require('dotenv').config();  // Single dotenv load at top
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const socketIO = require("socket.io");
const morgan = require("morgan");
const rateLimit = require('express-rate-limit');
const path = require("path");

// Import routes (create these files if missing)
const authRoutes = require('./routes/auth');
const gachaRoutes = require('./routes/gacha');
const goalRoutes = require('./routes/goals');
const tradeRoutes = require('./routes/trades');
const messageRoutes = require('./routes/messages');
const locationRoutes = require('./routes/location');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// -------------------- Middleware --------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// -------------------- Database --------------------
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/poneglyphpulse";
mongoose
  .connect(MONGODB_URI, { autoIndex: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Make io accessible
app.set('io', io);

// -------------------- Routes --------------------
app.use('/api/auth', authRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/location', locationRoutes);

// Test/Health routes
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "PoneglyphPulse backend running" });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PoneglyphPulse API is running!' });
});

// -------------------- Socket.IO --------------------
const activeUsers = new Map();
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('userOnline', (userId) => {
    activeUsers.set(userId, socket.id);
    io.emit('userStatusChange', { userId, status: 'online' });
  });

  socket.on('joinRoom', (roomId) => socket.join(roomId));
  socket.on('sendMessage', (data) => io.to(data.roomId).emit('receiveMessage', data));
  socket.on('locationUpdate', (data) => socket.broadcast.emit('userLocationUpdate', data));
  socket.on('tradeOffer', (data) => {
    const recipientSocket = activeUsers.get(data.recipientId);
    if (recipientSocket) io.to(recipientSocket).emit('newTradeOffer', data);
  });
  socket.on('goalCompleted', (data) => io.emit('celebrateGoal', data));

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        io.emit('userStatusChange', { userId, status: 'offline' });
        break;
      }
    }
  });
});

// -------------------- Error Handlers --------------------
app.use((req, res, next) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error"
  });
});

// -------------------- Server --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 PoneglyphPulse backend listening on port ${PORT}`);
});
