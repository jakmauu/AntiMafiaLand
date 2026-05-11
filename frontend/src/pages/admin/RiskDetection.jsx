import { useState } from "react";
import ChartCard, { DonutVisual } from "../../components/common/ChartCard";
import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { transferColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getAdminDashboardSummary } from "../../services/adminApi";
import { validateRisk } from "../../services/riskApi";

export default function RiskDetection() {
  const [form, setForm] = useState({ landId: "1", riskScore: "25" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, loading, error, setData } = useDashboardData(getAdminDashboardSummary, []);

  async function submit(e) {
    e.preventDefault();
    try { setBusy(true); const result = await validateRisk(form); setMessage(`Validate risk sukses. Tx: ${result.txHash}`); setData(await getAdminDashboardSummary()); } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }

  if (loading) return <LoadingState label="Loading risk data..." />;
  if (error) return <ErrorState message={error} />;
  const suspicious = (data?.transfers ?? []).filter((item) => item.riskLevel === "High" || item.status === "Frozen");
  return (
    <>
      <section className="chart-grid compact-charts"><ChartCard title="Risk Level Summary"><DonutVisual data={data?.riskDistribution ?? []} /></ChartCard><ChartCard title="Verification Risk Status"><DonutVisual data={data?.verificationSummary ?? []} labelKey="status" /></ChartCard></section>
      <article className="operation-card page-section"><h3>Validate Risk</h3><form onSubmit={submit}><div className="form-grid"><label>Land ID<input type="number" value={form.landId} onChange={(e)=>setForm((p)=>({...p, landId:e.target.value}))} /></label><label>Risk Score<input type="number" min="0" max="100" value={form.riskScore} onChange={(e)=>setForm((p)=>({...p, riskScore:e.target.value}))} /></label></div><button className="primary" disabled={busy}>Validate Risk</button></form>{message ? <p className="form-message">{message}</p> : null}</article>
      <DataTable title="Suspicious Transaction List" columns={transferColumns} rows={suspicious} />
    </>
  );
}
