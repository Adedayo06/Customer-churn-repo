import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getVisible, byAnalyst } from "../store/predictions";
import { fetchSummary } from "../api";
import AnalyticsView from "../components/AnalyticsView";

export default function AdminAnalytics() {
  const { user } = useAuth();
  const records = getVisible(user); // admin => all analysts' predictions
  const perAnalyst = byAnalyst(records);
  const [server, setServer] = useState(null);
  const [serverErr, setServerErr] = useState("");

  useEffect(() => {
    fetchSummary()
      .then(setServer)
      .catch((e) => setServerErr(e.message));
  }, []);

  return (
    <>
      <div className="page-head">
        <h1>Customer Analysis</h1>
        <p>Churn analysis across every analyst on the workspace.</p>
      </div>

      <AnalyticsView records={records} />

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginTop: "1.3rem", alignItems: "start" }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem" }}>Breakdown by analyst</h3>
          {perAnalyst.length === 0 ? (
            <div className="empty"><p>No predictions recorded yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Analyst</th>
                    <th>Predictions</th>
                    <th>Churners</th>
                    <th>Churn rate</th>
                  </tr>
                </thead>
                <tbody>
                  {perAnalyst.map((a) => (
                    <tr key={a.username}>
                      <td style={{ textTransform: "capitalize" }}><b>{a.username}</b></td>
                      <td>{a.total}</td>
                      <td>{a.churn}</td>
                      <td>{a.total ? Math.round((a.churn / a.total) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.4rem" }}>Server-side totals</h3>
          <p className="muted" style={{ fontSize: "0.83rem", marginTop: 0 }}>
            Live from the backend database (every prediction ever stored, all sources).
          </p>
          {serverErr ? (
            <div className="error-msg">Backend unreachable: {serverErr}</div>
          ) : !server ? (
            <p className="muted">Loading…</p>
          ) : (
            <div className="stack" style={{ gap: "0.6rem" }}>
              <div className="spread">
                <span className="muted">Total predictions</span>
                <b>{server.total_predictions}</b>
              </div>
              <div className="spread">
                <span className="muted">Likely churners</span>
                <span className="badge badge-churn">{server.churn}</span>
              </div>
              <div className="spread">
                <span className="muted">Likely to stay</span>
                <span className="badge badge-stay">{server.no_churn}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
