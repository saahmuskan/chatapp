import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Avatar component — shows the first letter of the username on a colored background
const Avatar = ({ username, color, size = "md" }) => {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor: color || "#ec4899" }}
    >
      {username?.[0]?.toUpperCase()}
    </div>
  );
};

export default function Sidebar({ rooms, activeRoom, onRoomSelect, onlineUsers }) {
  const { user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setCreating(true);
    setCreateError("");
    try {
      await api.post("/rooms", {
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
      });
      setNewRoomName("");
      setNewRoomDesc("");
      setShowCreateModal(false);
      // The parent will refresh rooms via its own effect or re-fetch
      window.location.reload(); // Simple approach for now; could use a callback prop
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="w-64 bg-slate-900/70 backdrop-blur-sm border-r border-pink-300/25 flex flex-col h-full flex-shrink-0">

      {/* App Header */}
      <div className="p-4 border-b border-pink-300/25">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="font-bold text-white text-sm">ChatApp</span>
        </div>
      </div>

      {/* Rooms Section */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rooms
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Create new room"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        {/* Room List */}
        <div className="space-y-0.5">
          {rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => onRoomSelect(room)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeRoom?._id === room._id
                  ? "bg-pink-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="font-medium"># {room.name}</span>
              {room.description && (
                <p className={`text-xs mt-0.5 truncate ${
                  activeRoom?._id === room._id ? "text-pink-200" : "text-slate-600"
                }`}>
                  {room.description}
                </p>
              )}
            </button>
          ))}

          {rooms.length === 0 && (
            <p className="text-xs text-slate-600 px-3 py-4 text-center">
              No rooms yet — create one!
            </p>
          )}
        </div>

        {/* Online Users Section */}
        {onlineUsers.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Online — {onlineUsers.length}
              </span>
            </div>
            <div className="space-y-1">
              {onlineUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-2 px-2 py-1.5">
                  <div className="relative">
                    <Avatar username={u.username} color={u.avatarColor} size="sm" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-slate-900"></span>
                  </div>
                  <span className="text-sm text-slate-400 truncate">{u.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current User Footer */}
      <div className="p-3 border-t border-pink-300/25">
        <div className="flex items-center gap-2">
          <Avatar username={user?.username} color={user?.avatarColor} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-4">Create a Room</h2>

            {createError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-2 mb-4 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Room name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. general"
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What's this room about?"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateError(""); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2.5 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm transition-colors"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}