import { useAuth } from "../auth/AuthContext";
import { getVisible } from "../store/predictions";
import AnalyticsView from "../components/AnalyticsView";

export default function Dashboard() {
  const { user } = useAuth();
  const records = getVisible(user);

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Your churn predictions at a glance — updated as you score customers.</p>
      </div>
      <AnalyticsView records={records} />
    </>
  );
}
