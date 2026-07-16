import { useState } from "react";
import { predictSingle } from "../api";
import { useAuth } from "../auth/AuthContext";
import { logPredictions } from "../store/predictions";

const BLANK = {
  customer_id: "",
  credit_score: "",
  country: "",
  gender: "Female",
  age: "",
  tenure: "",
  balance: "",
  products_number: "",
  credit_card: "1",
  active_member: "1",
  estimated_salary: "",
};

const EXAMPLE = {
  customer_id: "15634602",
  credit_score: "619",
  country: "France",
  gender: "Female",
  age: "42",
  tenure: "2",
  balance: "0",
  products_number: "1",
  credit_card: "1",
  active_member: "1",
  estimated_salary: "101348.88",
};

export default function SinglePrediction() {
  const { user } = useAuth();
  const [form, setForm] = useState(BLANK);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        credit_score: Number(form.credit_score),
        gender: form.gender,
        age: Number(form.age),
        tenure: Number(form.tenure),
        balance: Number(form.balance),
        products_number: Number(form.products_number),
        credit_card: Number(form.credit_card),
        active_member: Number(form.active_member),
        estimated_salary: Number(form.estimated_salary),
      };
      if (form.customer_id) payload.customer_id = form.customer_id;
      if (form.country) payload.country = form.country;

      const res = await predictSingle(payload);
      setResult(res);
      logPredictions(user, [res], "single");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const churned = result?.churn === 1;

  return (
    <>
      <div className="page-head">
        <h1>Individual Customer Prediction</h1>
        <p>Enter a customer's details to get an instant churn prediction.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
        <div className="card card-pad">
          <div className="spread" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem" }}>Customer details</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(EXAMPLE)}>
              Fill example
            </button>
          </div>
          <form onSubmit={submit}>
            {error && <div className="error-msg" style={{ marginBottom: "1rem" }}>{error}</div>}

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <label className="field">
                <span>Customer ID (optional)</span>
                <input value={form.customer_id} onChange={set("customer_id")} placeholder="15634602" />
              </label>
              <label className="field">
                <span>Country (optional, ignored by model)</span>
                <input value={form.country} onChange={set("country")} placeholder="France" />
              </label>
              <label className="field">
                <span>Credit score</span>
                <input type="number" step="any" value={form.credit_score} onChange={set("credit_score")} placeholder="619" required />
              </label>
              <label className="field">
                <span>Gender</span>
                <select value={form.gender} onChange={set("gender")}>
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </label>
              <label className="field">
                <span>Age</span>
                <input type="number" step="any" value={form.age} onChange={set("age")} placeholder="42" required />
              </label>
              <label className="field">
                <span>Tenure (years)</span>
                <input type="number" step="any" value={form.tenure} onChange={set("tenure")} placeholder="2" required />
              </label>
              <label className="field">
                <span>Balance</span>
                <input type="number" step="any" value={form.balance} onChange={set("balance")} placeholder="0.00" required />
              </label>
              <label className="field">
                <span>Number of products</span>
                <input type="number" step="any" value={form.products_number} onChange={set("products_number")} placeholder="1" required />
              </label>
              <label className="field">
                <span>Has credit card?</span>
                <select value={form.credit_card} onChange={set("credit_card")}>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </label>
              <label className="field">
                <span>Active member?</span>
                <select value={form.active_member} onChange={set("active_member")}>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span>Estimated salary</span>
                <input type="number" step="any" value={form.estimated_salary} onChange={set("estimated_salary")} placeholder="101348.88" required />
              </label>
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Predict churn"}
            </button>
          </form>
        </div>

        <div className="stack">
          {result ? (
            <div className={`result-card ${churned ? "result-churn" : "result-stay"}`}>
              <div className="rc-label">Prediction{result.customer_id ? ` · #${result.customer_id}` : ""}</div>
              <div className="rc-verdict">{churned ? "Likely to churn" : "Likely to stay"}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.95 }}>
                Churn probability: <b>{(result.churn_probability * 100).toFixed(1)}%</b>
              </div>
              <div className="prob-bar">
                <div style={{ width: `${result.churn_probability * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="card card-pad empty">
              <div className="em-ico">🔮</div>
              <p style={{ marginTop: "0.5rem" }}>Your prediction will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
