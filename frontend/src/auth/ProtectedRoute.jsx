import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Guards routes. `role` optionally restricts to a single role; a mismatched
// role is bounced to that user's own home instead of being shown the page.
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}
