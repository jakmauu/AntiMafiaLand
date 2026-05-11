export default function StatusBadge({ children, tone = "blue" }) {
  return <span className={`table-badge ${String(tone || children).toLowerCase()}`}>{children}</span>;
}
