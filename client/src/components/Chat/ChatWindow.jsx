import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ room }) {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [typingCount, setTypingCount] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Used to auto-scroll to the bottom when new messages arrive
  const messagesEndRef = useRef(null);

  // Track whether the user is currently typing (to avoid spamming the server)
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // ─── LOAD MESSAGE HISTORY ──────────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      setMessages([]);
      try {
        const { data } = await api.get(`/rooms/${room._id}/messages`);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [room?._id]);

  // ─── SOCKET EVENT LISTENERS ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !room) return;

    // Join the room via Socket.io
    socket.emit("join_room", room._id);

    // Listen for new messages coming in from the server
    const handleNewMessage = (message) => {
      // Only add to UI if it belongs to the currently active room
      if (message.room === room._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    // Listen for typing updates from the server
    const handleTypingUpdate = ({ count, roomId }) => {
      if (roomId === room._id) setTypingCount(count);
    };

    socket.on("receive_message", handleNewMessage);
    socket.on("typing_update", handleTypingUpdate);

    // Cleanup: leave the room and remove listeners when switching rooms
    return () => {
      socket.emit("leave_room", room._id);
      socket.off("receive_message", handleNewMessage);
      socket.off("typing_update", handleTypingUpdate);
      setTypingCount(0);
    };
  }, [socket, room?._id]);

  // ─── AUTO-SCROLL ──────────────────────────────────────────────────────────
  // Scroll to the bottom whenever messages change or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingCount]);

  // ─── SEND MESSAGE ─────────────────────────────────────────────────────────
  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit("send_message", {
      roomId: room._id,
      content: inputText.trim(),
    });

    setInputText("");
    stopTyping(); // Clear typing indicator immediately after sending
  };

  // ─── TYPING INDICATOR LOGIC ───────────────────────────────────────────────
  // We use a debounce pattern:
  //   - When the user starts typing, emit typing_start (once)
  //   - After 1.5s of no keystrokes, emit typing_stop
  const startTyping = useCallback(() => {
    if (!socket || isTypingRef.current) return;
    isTypingRef.current = true;
    socket.emit("typing_start", { roomId: room._id });
  }, [socket, room?._id]);

  const stopTyping = useCallback(() => {
    if (!socket || !isTypingRef.current) return;
    isTypingRef.current = false;
    socket.emit("typing_stop", { roomId: room._id });
    clearTimeout(typingTimeoutRef.current);
  }, [socket, room?._id]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (e.target.value) {
      startTyping();
      // Reset the stop-typing timer on every keystroke
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(stopTyping, 1500);
    } else {
      stopTyping();
    }
  };

  // ─── GROUP MESSAGES ───────────────────────────────────────────────────────
  // Group consecutive messages from the same sender so we don't repeat the avatar
  const shouldShowAvatar = (messages, index) => {
    if (index === 0) return true;
    return messages[index].sender._id !== messages[index - 1].sender._id;
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-pink-300/20">
        <div className="text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-slate-400 text-sm">Select a room to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-pink-300/20 h-full overflow-hidden">

      {/* Room Header */}
      <div className="px-5 py-3.5 border-b border-pink-300/25 bg-slate-900/70 backdrop-blur-sm flex items-center gap-3 flex-shrink-0">
        <div>
          <h2 className="font-semibold text-white text-sm"># {room.name}</h2>
          {room.description && (
            <p className="text-xs text-slate-500 mt-0.5">{room.description}</p>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto messages-scroll p-4 space-y-1 bg-pink-200/10">
        {loadingHistory && (
          <div className="text-center py-8">
            <p className="text-slate-600 text-sm">Loading messages...</p>
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-600 text-sm">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={message._id}
            message={message}
            showAvatar={shouldShowAvatar(messages, index)}
          />
        ))}

        {/* Typing indicator sits at the bottom of the message list */}
        <TypingIndicator typingCount={typingCount} />

        {/* Invisible div at the bottom — we scroll to this */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-pink-300/25 bg-slate-900/65 backdrop-blur-sm flex-shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Message #${room.name}`}
            autoFocus
            className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}