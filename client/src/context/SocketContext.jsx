import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  // useRef keeps the socket instance stable — it won't trigger re-renders
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if we have a logged-in user with a token
    const token = localStorage.getItem("token");
    if (!user || !token) return;

    // Create the socket connection, sending the JWT as auth
    socketRef.current = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5001",
      {
        auth: { token }, // This is what socketAuth middleware reads on the server
        transports: ["websocket"], // Skip long-polling, go straight to WebSocket
      }
    );

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    // Cleanup: disconnect when the user logs out or the component unmounts
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]); // Re-run when user changes (login/logout)

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used inside SocketProvider");
  return context;
};