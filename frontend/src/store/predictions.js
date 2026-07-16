// Local log of every prediction made through the app. Each record is tagged
// with the user who made it, so analysts see only their own and admins see all.
// (Scoping is enforced here in the browser, matching the mock-auth choice.)

const KEY = "cc_predictions";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

let _id = Date.now();
const nextId = () => `${++_id}`;

// Append one or more prediction results made by `user`.
// `results` items: { churn, churn_probability, customer_id }
export function logPredictions(user, results, source) {
  const now = new Date().toISOString();
  const rows = results.map((r) => ({
    id: nextId(),
    username: user.username,
    createdAt: now,
    source, // "single" | "batch"
    customerId: r.customer_id ?? null,
    churn: Number(r.churn),
    churnProbability: Number(r.churn_probability),
  }));
  writeAll([...rows, ...readAll()]);
  return rows;
}

// Records visible to a given user (analysts: own; admin: everyone's).
export function getVisible(user) {
  const all = readAll();
  if (user.role === "admin") return all;
  return all.filter((r) => r.username === user.username);
}

// ---- aggregation ----------------------------------------------------------
function pad(n) {
  return String(n).padStart(2, "0");
}

// ISO-week label like "2026-W28".
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
    );
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

function periodKey(iso, granularity) {
  const d = new Date(iso);
  if (granularity === "month") return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  if (granularity === "week") return isoWeek(d);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // day
}

// -> [{ period, churn, no_churn, total }] ordered oldest -> newest
export function aggregate(records, granularity) {
  const map = new Map();
  for (const r of records) {
    const key = periodKey(r.createdAt, granularity);
    const bucket = map.get(key) || { period: key, churn: 0, no_churn: 0, total: 0 };
    if (r.churn === 1) bucket.churn += 1;
    else bucket.no_churn += 1;
    bucket.total += 1;
    map.set(key, bucket);
  }
  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export function summarize(records) {
  const total = records.length;
  const churn = records.filter((r) => r.churn === 1).length;
  return {
    total,
    churn,
    no_churn: total - churn,
    churnRate: total ? Math.round((churn / total) * 100) : 0,
  };
}

// Per-analyst breakdown for the admin view.
export function byAnalyst(records) {
  const map = new Map();
  for (const r of records) {
    const b = map.get(r.username) || { username: r.username, total: 0, churn: 0 };
    b.total += 1;
    if (r.churn === 1) b.churn += 1;
    map.set(r.username, b);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
