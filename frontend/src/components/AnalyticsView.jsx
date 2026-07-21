import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { aggregate, summarize } from "../store/predictions";
import { useTheme } from "../theme/ThemeContext";

const RED = "#ff2d43";
const GREEN = "#22d37e";

function StatCard({ ico, cls, label, value }) {
  return (
    <div className="stat">
      <div className={`stat-ico ${cls}`}>{ico}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function AnalyticsView({ records }) {
  const [gran, setGran] = useState("day");
  const { isDark } = useTheme();
  const gridStroke = isDark ? "#332c34" : "#f0e2e3";
  const tickFill = isDark ? "#948b93" : "#8b8288";
  const tooltipStyle = {
    borderRadius: 12,
    border: `1px solid ${isDark ? "#3a3340" : "#f0e2e3"}`,
    background: isDark ? "#201d22" : "#fff",
    color: isDark ? "#f3eef1" : "inherit",
    fontSize: 13,
  };
  const s = summarize(records);
  const trend = aggregate(records, gran).map((b) => ({
    period: b.period,
    Churn: b.churn,
    "No Churn": b.no_churn,
  }));
  const pie = [
    { name: "Likely to churn", value: s.churn, color: RED },
    { name: "Likely to stay", value: s.no_churn, color: GREEN },
  ];

  if (s.total === 0) {
    return (
      <div className="card card-pad empty">
        <div className="em-ico">📭</div>
        <h3 style={{ marginTop: "0.6rem" }}>No predictions yet</h3>
        <p>Run an individual or batch prediction and your analytics will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="stat-grid">
        <StatCard ico="🧮" cls="ico-ink" label="Total predictions" value={s.total} />
        <StatCard ico="⚠️" cls="ico-red" label="Likely churners" value={s.churn} />
        <StatCard ico="✅" cls="ico-green" label="Likely to stay" value={s.no_churn} />
        <StatCard ico="📉" cls="ico-red" label="Churn rate" value={`${s.churnRate}%`} />
      </div>

      <div className="chart-grid">
        <div className="card chart-card">
          <div className="spread" style={{ marginBottom: "1rem" }}>
            <div className="chart-title">Churn vs. Non-churn over time</div>
            <div className="seg">
              {["day", "week", "month"].map((g) => (
                <button
                  key={g}
                  className={gran === g ? "active" : ""}
                  onClick={() => setGran(g)}
                >
                  {g[0].toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: tickFill }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickFill }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
              <Legend wrapperStyle={{ fontSize: 13, color: tickFill }} />
              <Bar dataKey="No Churn" stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Churn" stackId="a" fill={RED} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <div className="chart-title" style={{ marginBottom: "1rem" }}>Overall split</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pie}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={2}
              >
                {pie.map((e) => (
                  <Cell key={e.name} fill={e.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 13, color: tickFill }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
