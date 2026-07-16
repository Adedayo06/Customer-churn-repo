import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SinglePrediction from "./pages/SinglePrediction";
import BatchPrediction from "./pages/BatchPrediction";
import History from "./pages/History";
import AdminAnalysts from "./pages/AdminAnalysts";
import AdminAnalytics from "./pages/AdminAnalytics";

export default function App() {
  const { user } = useAuth();

  const home = user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login";

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={home} replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to={home} replace /> : <Signup />} />

      {/* Analyst area */}
      <Route
        element={
          <ProtectedRoute role="analyst">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/predict/single" element={<SinglePrediction />} />
        <Route path="/predict/batch" element={<BatchPrediction />} />
        <Route path="/history" element={<History />} />
      </Route>

      {/* Admin area */}
      <Route
        element={
          <ProtectedRoute role="admin">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminAnalysts />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
