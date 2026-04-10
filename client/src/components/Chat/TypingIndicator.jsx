// Shows an animated typing indicator when one or more users are typing
// typingCount: number of users currently typing in this room
export default function TypingIndicator({ typingCount }) {
  if (typingCount === 0) return null;

  const label = typingCount === 1 ? "Someone is typing" : `${typingCount} people are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {/* Animated three-dot indicator */}
      <div className="flex items-center gap-1 bg-slate-800 rounded-full px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-slate-400 rounded-full"
            style={{
              animation: "bounce 1.2s infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500">{label}</span>

      {/* Keyframe animation for the bouncing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}