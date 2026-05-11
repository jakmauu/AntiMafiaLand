import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { landColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { registerLand } from "../../services/adminApi";
import { getLand, getLands } from "../../services/landApi";

export default function LandRegistry() {
  const [form, setForm] = useState({ owner: "", metadataURI: "", price: "1000" });
  const [lookupId, setLookupId] = useState("1");
  const [lookup, setLookup] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, loading, error, setData } = useDashboardData(() => getLands(), []);

  async function submitRegister(e) {
    e.preventDefault();
    try {
      setBusy(true);
      const result = await registerLand(form);
      setMessage(`Register land sukses. Tx: ${result.txHash}`);
      setData(await getLands());
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }

  async function submitLookup(e) {
    e.preventDefault();
    try { setBusy(true); setLookup(await getLand(lookupId)); } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <section className="operations-grid page-section">
        <article className="operation-card wide-op"><h3>Register Land</h3><form onSubmit={submitRegister}><div className="form-grid three-cols"><label>Owner Address<input value={form.owner} onChange={(e)=>setForm((p)=>({...p, owner:e.target.value}))} /></label><label>Metadata URI<input value={form.metadataURI} onChange={(e)=>setForm((p)=>({...p, metadataURI:e.target.value}))} /></label><label>Price<input value={form.price} onChange={(e)=>setForm((p)=>({...p, price:e.target.value}))} /></label></div><button className="primary" disabled={busy}>Register Land</button></form>{message ? <p className="form-message">{message}</p> : null}</article>
        <article className="operation-card"><h3>Land Lookup</h3><form onSubmit={submitLookup} className="inline-input"><input type="number" value={lookupId} onChange={(e)=>setLookupId(e.target.value)} /><button className="ghost" disabled={busy}>Get Land</button></form>{lookup ? <pre>{JSON.stringify(lookup, null, 2)}</pre> : <EmptyState message="Lookup result will appear here." />}</article>
      </section>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : <DataTable title="Registered Land Data" columns={landColumns} rows={data?.lands ?? []} />}
    </>
  );
}
