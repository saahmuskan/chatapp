import { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";

export default function ChatLayout() {
  const { socket } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ─── FETCH ROOMS ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get("/rooms");
        setRooms(data);
        // Auto-select the first room when the app loads
        if (data.length > 0 && !activeRoom) {
          setActiveRoom(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };

    fetchRooms();
  }, []);

  // ─── TRACK ONLINE USERS ───────────────────────────────────────────────────
  // When a user joins a room we're in, add them to the online list.
  // When they disconnect, remove them.
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (user) => {
      setOnlineUsers((prev) => {
        const alreadyTracked = prev.find((u) => u._id === user.userId);
        if (alreadyTracked) return prev;
        return [...prev, { _id: user.userId, username: user.username, avatarColor: user.avatarColor }];
      });
    };

    const handleUserLeft = ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((u) => u._id !== userId));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((u) => u._id !== userId));
    };

    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("user_offline", handleUserOffline);
    };
  }, [socket]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-pink-300/20 overflow-hidden">
      <Sidebar
        rooms={rooms}
        activeRoom={activeRoom}
        onRoomSelect={setActiveRoom}
        onlineUsers={onlineUsers}
      />
      <ChatWindow room={activeRoom} />
    </div>
  );
}