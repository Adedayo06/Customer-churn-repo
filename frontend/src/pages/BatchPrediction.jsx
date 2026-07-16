import { useRef, useState } from "react";
import { predictBatch } from "../api";
import { useAuth } from "../auth/AuthContext";
import { logPredictions } from "../store/predictions";

export default function BatchPrediction() {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function pick(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Please choose a .csv file.");
      return;
    }
    setError("");
    setResult(null);
    setFile(f);
  }

  async function run() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const res = await predictBatch(file);
      setResult(res);
      logPredictions(user, res.predictions, "batch");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Batch Customer Prediction</h1>
        <p>Upload a CSV of customers and get a churn prediction for every row.</p>
      </div>

      {!result && (
        <aside className="hint-float">
          <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Expected columns</h4>
          <p style={{ fontSize: "0.85rem", marginTop: 0, color: "var(--red-700)" }}>
            One customer per row with these headers:
          </p>
          <code style={{ fontSize: "0.8rem", display: "block", background: "#fff", padding: "0.7rem", borderRadius: 10, lineHeight: 1.7 }}>
            credit_score, gender, age, tenure, balance, products_number, credit_card,
            active_member, estimated_salary
          </code>
          <p style={{ fontSize: "0.82rem", color: "var(--red-700)" }}>
            <code>customer_id</code> and <code>country</code> are optional. A ready-made
            <b> sample_customers.csv</b> ships in the <code>backend/</code> folder.
          </p>
        </aside>
      )}

      <div className="stack" style={{ maxWidth: 560 }}>
        <div
          className={"dropzone" + (drag ? " drag" : "")}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        >
          <div className="dz-ico">📁</div>
          <h3 style={{ margin: "0.5rem 0 0.2rem" }}>
            {file ? file.name : "Drop your CSV here"}
          </h3>
          <p className="muted" style={{ margin: 0 }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB — click Predict to run` : "or click to browse"}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            hidden
            onChange={(e) => pick(e.target.files[0])}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="row">
          <button className="btn btn-primary" onClick={run} disabled={!file || loading}>
            {loading ? <span className="spinner" /> : "Predict batch"}
          </button>
          {file && (
            <button className="btn btn-ghost" onClick={() => { setFile(null); setResult(null); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="card card-pad" style={{ marginTop: "1.3rem" }}>
          <div className="spread" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Results</h3>
            <div className="row">
              <span className="badge badge-churn">{result.churn_count} likely to churn</span>
              <span className="badge badge-stay">{result.no_churn_count} likely to stay</span>
              <span className="muted">of {result.count}</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer ID</th>
                  <th>Prediction</th>
                  <th>Churn probability</th>
                </tr>
              </thead>
              <tbody>
                {result.predictions.map((p, i) => (
                  <tr key={i}>
                    <td className="muted">{i + 1}</td>
                    <td>{p.customer_id ?? "—"}</td>
                    <td>
                      <span className={"badge " + (p.churn === 1 ? "badge-churn" : "badge-stay")}>
                        {p.churn === 1 ? "Churn" : "Stay"}
                      </span>
                    </td>
                    <td>{(p.churn_probability * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
