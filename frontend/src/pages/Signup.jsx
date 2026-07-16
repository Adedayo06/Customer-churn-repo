import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    try {
      signup(form);
      navigate("/dashboard", { replace: true });
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
            Join the team<br />of churn<br />analysts.
          </h1>
          <p className="auth-sub">
            Create your analyst account to start scoring customers and tracking
            retention trends in seconds.
          </p>
        </div>
        <div style={{ opacity: 0.75, fontSize: "0.85rem" }}>
          © {new Date().getFullYear()} ChurnOrNot Analytics
        </div>
      </section>

      <section className="auth-formside">
        <div className="auth-card">
          <h2 style={{ fontSize: "1.7rem", fontWeight: 800 }}>Create account</h2>
          <p className="muted" style={{ marginTop: "0.35rem", marginBottom: "1.3rem" }}>
            Sign up as an analyst
          </p>

          <form onSubmit={submit}>
            {error && <div className="error-msg" style={{ marginBottom: "1rem" }}>{error}</div>}
            <label className="field">
              <span>Username</span>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="jane.doe"
                autoFocus
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@company.com"
              />
            </label>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </label>
              <label className="field">
                <span>Confirm</span>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="••••••••"
                />
              </label>
            </div>
            <button className="btn btn-primary btn-block" type="submit">
              Create analyst account
            </button>
          </form>

          <p className="center muted" style={{ marginTop: "1.2rem", fontSize: "0.9rem" }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
