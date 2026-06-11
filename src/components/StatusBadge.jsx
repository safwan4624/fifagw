export default function StatusBadge({ status }) {
  const labels = {
    upcoming: 'Open',
    closed: 'Closed',
    completed: 'Completed',
  };

  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot"></span>
      {labels[status] || status}
    </span>
  );
}
