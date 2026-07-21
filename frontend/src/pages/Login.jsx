import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("analyst");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const u = login({ ...form, role });
      navigate(u.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth-brandside">
        <div className="brand-logo">
          <span className="brand-mark">C</span> ChurnOrNot
        </div>
        <div>
          <h1 className="auth-headline">
            Know who's<br />leaving, before<br />they do.
          </h1>
          <p className="auth-sub">
            Predict customer churn, score them one-by-one or in batches, and watch the
            trends unfold.
          </p>
          <ul className="auth-points">
            <li><span className="dot">✓</span> Individual & batch churn scoring</li>
            <li><span className="dot">✓</span> Daily, weekly & monthly trends</li>
            <li><span className="dot">✓</span> Get better insights on your customers</li>
          </ul>
        </div>
        <div style={{ opacity: 0.75, fontSize: "0.85rem" }}>
          © {new Date().getFullYear()} ChurnOrNot Analytics
        </div>
      </section>

      <section className="auth-formside">
        <div className="auth-toggle">
          <ThemeToggle variant="icon" />
        </div>
        <div className="auth-card">
          <h2 style={{ fontSize: "1.7rem", fontWeight: 800 }}>Welcome back</h2>
          <p className="muted" style={{ marginTop: "0.35rem", marginBottom: "1.3rem" }}>
            Sign in to your workspace
          </p>

          <div className="role-toggle">
            <button
              type="button"
              className={role === "analyst" ? "active" : ""}
              onClick={() => setRole("analyst")}
            >
              👤 Analyst
            </button>
            <button
              type="button"
              className={role === "admin" ? "active" : ""}
              onClick={() => setRole("admin")}
            >
              🛡️ Admin
            </button>
          </div>

          <form onSubmit={submit}>
            {error && <div className="error-msg" style={{ marginBottom: "1rem" }}>{error}</div>}
            <label className="field">
              <span>Username</span>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={role === "admin" ? "admin" : "your username"}
                autoFocus
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </label>
            <button className="btn btn-primary btn-block" type="submit">
              Sign in as {role === "admin" ? "Admin" : "Analyst"}
            </button>
          </form>

          {role === "analyst" ? (
            <p className="center muted" style={{ marginTop: "1.2rem", fontSize: "0.9rem" }}>
              New analyst? <Link to="/signup">Create an account</Link>
            </p>
          ) : (
            <div className="info-banner" style={{ marginTop: "1.2rem" }}>
              Default admin — <b>admin</b> / <b>admin123</b> (change in a real deployment).
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
