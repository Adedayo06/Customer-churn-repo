import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getVisible } from "../store/predictions";

function fmt(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function History() {
  const { user } = useAuth();
  const records = useMemo(() => getVisible(user), [user]);
  const [filter, setFilter] = useState("all"); // all | churn | stay

  const rows = records.filter((r) =>
    filter === "all" ? true : filter === "churn" ? r.churn === 1 : r.churn === 0
  );

  return (
    <>
      <div className="page-head">
        <h1>Prediction History</h1>
        <p>Every customer you've scored, most recent first.</p>
      </div>

      <div className="card card-pad">
        <div className="spread" style={{ marginBottom: "1rem" }}>
          <div className="seg">
            {[["all", "All"], ["churn", "Churn"], ["stay", "Stay"]].map(([k, l]) => (
              <button key={k} className={filter === k ? "active" : ""} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
          <span className="muted">{rows.length} record{rows.length === 1 ? "" : "s"}</span>
        </div>

        {rows.length === 0 ? (
          <div className="empty">
            <div className="em-ico">🗂️</div>
            <p style={{ marginTop: "0.5rem" }}>No predictions to show yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer ID</th>
                  <th>Source</th>
                  <th>Prediction</th>
                  <th>Probability</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{fmt(r.createdAt)}</td>
                    <td>{r.customerId ?? "—"}</td>
                    <td style={{ textTransform: "capitalize" }}>{r.source}</td>
                    <td>
                      <span className={"badge " + (r.churn === 1 ? "badge-churn" : "badge-stay")}>
                        {r.churn === 1 ? "Churn" : "Stay"}
                      </span>
                    </td>
                    <td>{(r.churnProbability * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
