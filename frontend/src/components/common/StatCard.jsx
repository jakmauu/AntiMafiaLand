export default function StatCard({ label, value, delta, tone = "blue" }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{String(label).slice(0, 1)}</div>
      <div><span>{label}</span><strong>{value ?? 0}</strong>{delta ? <small className={String(delta).startsWith("-") ? "negative" : "positive"}>{delta}</small> : null}</div>
    </article>
  );
}
