import { Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { AuthPage } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { CreatePoll } from "./pages/CreatePoll";
import { PollView } from "./pages/PollView";
import { NotFound } from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login"  element={<AuthPage initialMode="login"  />} />
      <Route path="/signup" element={<AuthPage initialMode="signup" />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/create"    element={<Protected><CreatePoll /></Protected>} />
      <Route path="/p/:id"     element={<PollView />} />
      <Route path="*"          element={<NotFound />} />
    </Routes>
  );
}
