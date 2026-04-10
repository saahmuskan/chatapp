const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
 
// This object tracks which users are currently typing in which rooms
// Format: { roomId: Set(userId1, userId2) }
const typingUsers = {};
 
// Socket.io middleware — verifies the JWT token sent during connection
// The client sends: socket = io(URL, { auth: { token } })
const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth?.token;
 
  if (!token) {
    return next(new Error("Authentication error — no token"));
  }
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
 
    if (!user) return next(new Error("User not found"));
 
    socket.user = user; // Attach user to the socket for use in event handlers
    next();
  } catch (err) {
    next(new Error("Token is invalid or expired"));
  }
};
 
// Main socket handler — sets up all real-time events for a single connection
const handleSocket = (io, socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);
 
  // Mark user as online in the DB
  User.findByIdAndUpdate(socket.user._id, { isOnline: true }).exec();
 
  // ─── JOIN ROOM ────────────────────────────────────────────────────────
  // Client emits this when navigating to a chat room
  socket.on("join_room", (roomId) => {
    socket.join(roomId); // Add socket to the Socket.io room
    console.log(`${socket.user.username} joined room ${roomId}`);
 
    // Notify everyone else in the room that this user joined
    socket.to(roomId).emit("user_joined", {
      userId: socket.user._id,
      username: socket.user.username,
      avatarColor: socket.user.avatarColor,
    });
  });
 
  // ─── LEAVE ROOM ───────────────────────────────────────────────────────
  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
 
    // Remove from typing tracker if they were typing
    if (typingUsers[roomId]) {
      typingUsers[roomId].delete(socket.user._id.toString());
      broadcastTyping(io, roomId);
    }
 
    socket.to(roomId).emit("user_left", {
      userId: socket.user._id,
      username: socket.user.username,
      avatarColor: socket.user.avatarColor,
    });
  });

  // ─── SEND MESSAGE ─────────────────────────────────────────────────────
  socket.on("send_message", async ({ roomId, content }) => {
    if (!content?.trim()) return;

    try {
      // Save the message to MongoDB
      const message = await Message.create({
        content: content.trim(),
        sender: socket.user._id,
        room: roomId,
      });

      // Populate sender info for client display
      await message.populate("sender", "username avatarColor");

      // Broadcast to everyone in the room (including sender)
      io.to(roomId).emit("receive_message", {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        room: roomId,
        createdAt: message.createdAt,
      });

      // Stop typing indicator for sender once message is sent
      if (typingUsers[roomId]) {
        typingUsers[roomId].delete(socket.user._id.toString());
        broadcastTyping(io, roomId);
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ─── TYPING EVENTS ────────────────────────────────────────────────────
  socket.on("typing_start", ({ roomId }) => {
    if (!typingUsers[roomId]) typingUsers[roomId] = new Set();
    typingUsers[roomId].add(socket.user._id.toString());
    broadcastTyping(io, roomId);
  });

  socket.on("typing_stop", ({ roomId }) => {
    if (typingUsers[roomId]) {
      typingUsers[roomId].delete(socket.user._id.toString());
      broadcastTyping(io, roomId);
    }
  });

  // ─── DISCONNECT ───────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.username}`);

    // Mark user as offline in DB
    User.findByIdAndUpdate(socket.user._id, { isOnline: false }).exec();

    // Remove from all typing trackers
    for (const roomId in typingUsers) {
      if (typingUsers[roomId].has(socket.user._id.toString())) {
        typingUsers[roomId].delete(socket.user._id.toString());
        broadcastTyping(io, roomId);
      }
    }

    // Notify all connected clients user went offline
    socket.broadcast.emit("user_offline", { userId: socket.user._id });
  });
};
 
// Broadcast the current list of typing usernames to a room
const broadcastTyping = (io, roomId) => {
  const count = typingUsers[roomId]?.size || 0;
  io.to(roomId).emit("typing_update", { count, roomId });
};
 
module.exports = { socketAuth, handleSocket };