import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { landColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getUserLands } from "../../services/userApi";

export default function MyLands() {
  const { wallet, system } = useOutletContext();
  const [form, setForm] = useState({ landId: "1", to: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, loading, error } = useDashboardData(() => getUserLands(wallet.walletAddress), [wallet.walletAddress]);

  async function submit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      const tx = await wallet.requestTransfer({ contractAddress: system.contractAddress || system.health?.contractAddress, landId: form.landId, to: form.to });
      setMessage(`requestTransfer sukses. Tx: ${tx.hash}`);
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <article className="operation-card page-section"><h3>Ownership Transfer Request</h3><p className="helper-text">Only the current land owner wallet can request transfer.</p><form onSubmit={submit}><div className="form-grid three-cols"><label>Land ID<input type="number" value={form.landId} onChange={(e)=>setForm((p)=>({...p, landId:e.target.value}))} /></label><label>Recipient Wallet<input value={form.to} onChange={(e)=>setForm((p)=>({...p, to:e.target.value}))} /></label><button className="primary align-end" disabled={busy}>{busy ? "Submitting..." : "Request Transfer"}</button></div></form>{message ? <p className="form-message">{message}</p> : null}</article>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : <DataTable title="My Registered Lands" columns={landColumns} rows={data?.lands ?? []} />}
    </>
  );
}
