export default function LoadingState({ label = "Loading data..." }) {
  return <div className="state-card loading-state">{label}</div>;
}
