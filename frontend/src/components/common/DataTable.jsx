import EmptyState from "./EmptyState";

export default function DataTable({ title, columns = [], rows = [], actionLabel = "View All" }) {
  return (
    <article className="data-table-card">
      <div className="card-heading"><h3>{title}</h3><button className="mini-select" type="button">{actionLabel}</button></div>
      {!rows.length ? <EmptyState message="No records found." /> : (
        <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id ?? row.txHash ?? index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>
      )}
    </article>
  );
}
