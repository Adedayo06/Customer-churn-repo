import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ANALYST_NAV = [
  { to: "/dashboard", label: "Dashboard", ico: "📊" },
  { to: "/predict/single", label: "Individual Prediction", ico: "🧍" },
  { to: "/predict/batch", label: "Batch Prediction", ico: "📁" },
  { to: "/history", label: "History", ico: "🕑" },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Manage Analysts", ico: "👥" },
  { to: "/admin/analytics", label: "Customer Analysis", ico: "📈" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user.role === "admin" ? ADMIN_NAV : ANALYST_NAV;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="side-brand">
          <span className="brand-mark">C</span>
          ChurnOrNot
        </div>

        <div className="nav-section-label">
          {user.role === "admin" ? "Administration" : "Workspace"}
        </div>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/admin"}
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            <span className="ico">{n.ico}</span>
            {n.label}
          </NavLink>
        ))}

        <div className="side-foot">
          <div className="side-user">
            <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", textTransform: "capitalize" }}>
                {user.username}
              </div>
              <div className="muted" style={{ fontSize: "0.76rem" }}>
                {user.role === "admin" ? "Administrator" : "Analyst"}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={handleLogout} style={{ marginTop: "0.6rem" }}>
            Log out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
