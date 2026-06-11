export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  return (
    <div className={`spinner-container spinner-${size}`}>
      <div className="spinner">
        <div className="spinner-ring"></div>
        <span className="spinner-icon">⚽</span>
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}
