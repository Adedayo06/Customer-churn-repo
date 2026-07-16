// Thin client for the FastAPI churn backend.
const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function toError(res) {
  try {
    const data = await res.json();
    const detail = data.detail;
    if (Array.isArray(detail)) {
      // FastAPI/Pydantic validation errors
      return new Error(detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join("; "));
    }
    return new Error(detail || JSON.stringify(data));
  } catch {
    return new Error(`Request failed (${res.status})`);
  }
}

export async function predictSingle(payload) {
  const res = await fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function predictBatch(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/predict/batch`, { method: "POST", body: fd });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function fetchAnalytics(granularity) {
  const res = await fetch(`${BASE}/analytics/${granularity}`);
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function fetchSummary() {
  const res = await fetch(`${BASE}/analytics/summary`);
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function health() {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw await toError(res);
  return res.json();
}

export const API_BASE = BASE;
