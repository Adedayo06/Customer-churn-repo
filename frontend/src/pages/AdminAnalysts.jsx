import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getVisible, byAnalyst } from "../store/predictions";

function fmt(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function AdminAnalysts() {
  const { user, listAnalysts, removeAnalyst } = useAuth();
  const [, force] = useState(0);
  const analysts = listAnalysts();
  const all = getVisible(user); // admin => everyone's predictions
  const counts = Object.fromEntries(byAnalyst(all).map((a) => [a.username, a]));

  function confirmRemove(username) {
    if (window.confirm(`Remove analyst "${username}"? Their account will be deleted.`)) {
      removeAnalyst(username);
      force((n) => n + 1);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Manage Analysts</h1>
        <p>All analyst accounts registered on this workspace.</p>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat">
          <div className="stat-ico ico-red">👥</div>
          <div className="stat-label">Total analysts</div>
          <div className="stat-value">{analysts.length}</div>
        </div>
        <div className="stat">
          <div className="stat-ico ico-ink">🧮</div>
          <div className="stat-label">Predictions (all analysts)</div>
          <div className="stat-value">{all.length}</div>
        </div>
        <div className="stat">
          <div className="stat-ico ico-green">🟢</div>
          <div className="stat-label">Active contributors</div>
          <div className="stat-value">{Object.keys(counts).length}</div>
        </div>
      </div>

      <div className="card card-pad">
        {analysts.length === 0 ? (
          <div className="empty">
            <div className="em-ico">🧑‍💼</div>
            <p style={{ marginTop: "0.5rem" }}>No analysts have signed up yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Analyst</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Predictions</th>
                  <th>Churners flagged</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {analysts.map((a) => {
                  const c = counts[a.username] || { total: 0, churn: 0 };
                  return (
                    <tr key={a.username}>
                      <td>
                        <div className="row">
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.85rem" }}>
                            {a.username.slice(0, 1).toUpperCase()}
                          </div>
                          <b style={{ textTransform: "capitalize" }}>{a.username}</b>
                        </div>
                      </td>
                      <td className="muted">{a.email || "—"}</td>
                      <td>{fmt(a.createdAt)}</td>
                      <td>{c.total}</td>
                      <td>
                        <span className="badge badge-churn">{c.churn}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-danger btn-sm" onClick={() => confirmRemove(a.username)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
