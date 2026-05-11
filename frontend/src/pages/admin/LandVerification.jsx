import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { transferColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { approveTransfer, executeTransfer, freezeTransfer, getPendingVerifications } from "../../services/adminApi";

export default function LandVerification() {
  const [landId, setLandId] = useState("1");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, loading, error, setData } = useDashboardData(getPendingVerifications, []);

  async function run(action, label) {
    try {
      setBusy(true);
      const result = await action(landId);
      setMessage(`${label} sukses. Tx: ${result.txHash}`);
      setData(await getPendingVerifications());
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <article className="operation-card page-section"><h3>Verification Control</h3><label>Land ID<input type="number" value={landId} onChange={(e)=>setLandId(e.target.value)} /></label><div className="button-row"><button className="ghost" onClick={()=>run(approveTransfer, "Approve")} disabled={busy}>Approve</button><button className="ghost" onClick={()=>run(executeTransfer, "Execute")} disabled={busy}>Execute</button><button className="danger" onClick={()=>run(freezeTransfer, "Freeze")} disabled={busy}>Freeze</button></div>{message ? <p className="form-message">{message}</p> : null}</article>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : <DataTable title="Pending Verification List" columns={transferColumns} rows={data?.verifications ?? []} />}
    </>
  );
}
