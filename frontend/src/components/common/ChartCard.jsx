export function LineVisual({ data = [] }) {
  const values = data.length ? data.map((item) => Number(item.value ?? item.count ?? 0)) : [0];
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = 15 + (index * 375) / Math.max(values.length - 1, 1);
    const y = 170 - (value / max) * 145;
    return `${x},${y}`;
  });
  const d = points.map((point, index) => `${index === 0 ? "M" : "L"}${point}`).join(" ");
  return (
    <div className="line-visual"><div className="grid-lines" /><svg viewBox="0 0 420 190" role="img" aria-label="Trend"><path className="line-path" d={d || "M15,170 L390,170"} /></svg><span>Registered Lands</span></div>
  );
}

export function DonutVisual({ data = [], labelKey = "riskLevel", valueKey = "count", center = "Total" }) {
  const total = data.reduce((sum, item) => sum + Number(item[valueKey] ?? 0), 0);
  return (
    <div className="donut-wrap">
      <div className="donut-chart"><strong>{total}</strong><span>{center}</span></div>
      <ul className="legend-list">
        {data.length ? data.map((item, index) => <li key={`${item[labelKey]}-${index}`}><span className={`legend ${["green", "yellow", "orange", "red", "blue"][index % 5]}`} />{item[labelKey]} <b>{item[valueKey]}</b></li>) : <li>No data</li>}
      </ul>
    </div>
  );
}

export function BarVisual({ data = [] }) {
  const max = Math.max(...data.map((item) => Number(item.count ?? 0)), 1);
  return <div className="bar-list">{data.length ? data.map((item) => <div className="bar-row" key={item.region}><span>{item.region}</span><div><i style={{ width: `${(Number(item.count) / max) * 100}%` }} /></div><strong>{item.count}</strong></div>) : <p className="empty-state">No region data.</p>}</div>;
}

export default function ChartCard({ title, children }) {
  return <article className="chart-card"><div className="card-heading"><h3>{title}</h3><button className="mini-select" type="button">This Month</button></div>{children}</article>;
}
