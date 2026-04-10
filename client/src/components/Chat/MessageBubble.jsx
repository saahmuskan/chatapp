import { useAuth } from "../../context/AuthContext";

// Formats a date to a readable time string — e.g. "2:34 PM"
const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MessageBubble({ message, showAvatar }) {
  const { user } = useAuth();

  // Is this message sent by the currently logged-in user?
  const isOwn = message.sender._id === user?._id;

  return (
    <div className={`flex items-end gap-2 message-appear ${isOwn ? "flex-row-reverse" : "flex-row"}`}>

      {/* Sender Avatar — only shown when showAvatar is true (first message in a group) */}
      <div className="w-7 h-7 flex-shrink-0">
        {showAvatar && !isOwn && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: message.sender.avatarColor || "#ec4899" }}
          >
            {message.sender.username?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? "items-end" : "items-start"} flex flex-col`}>

        {/* Username — shown above the first message in a group */}
        {showAvatar && !isOwn && (
          <span className="text-xs text-slate-500 mb-1 ml-1">{message.sender.username}</span>
        )}

        {/* The message bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwn
                ? "bg-pink-600 text-white rounded-br-sm"
              : "bg-slate-800 text-slate-100 rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <span className={`text-xs text-slate-600 mt-1 ${isOwn ? "mr-1" : "ml-1"}`}>
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}