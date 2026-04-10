import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ChatLayout from "./components/Chat/ChatLayout";

// ProtectedRoute wraps any page that requires the user to be logged in.
// If there's no user, redirect to /login automatically.
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// PublicRoute wraps login/register pages.
// If the user is already logged in, redirect them to the chat.
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/chat" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/chat" replace />} />

    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />

    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />

    <Route
      path="/chat"
      element={
        <ProtectedRoute>
          {/* SocketProvider is inside ProtectedRoute so it only connects when logged in */}
          <SocketProvider>
            <ChatLayout />
          </SocketProvider>
        </ProtectedRoute>
      }
    />

    {/* Catch-all: redirect unknown paths to home */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}