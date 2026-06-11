import { useCountdown } from '../hooks/useCountdown';

export default function CountdownTimer({ kickoffTime }) {
  const { days, hours, minutes, seconds, isClosed, isTooEarly, totalSeconds } = useCountdown(kickoffTime);

  if (isClosed) {
    return (
      <div className="countdown countdown-closed">
        <span className="countdown-label">Predictions Closed</span>
        <div className="countdown-icon">🔒</div>
      </div>
    );
  }

  const isUrgent = totalSeconds > 0 && totalSeconds < 600 && !isTooEarly; // < 10 minutes

  return (
    <div className={`countdown ${isUrgent ? 'countdown-urgent' : ''}`}>
      <span className="countdown-label">{isTooEarly ? 'Predictions open in' : 'Predictions close in'}</span>
      <div className="countdown-digits">
        {days > 0 && (
          <div className="countdown-unit">
            <span className="countdown-value">{days}</span>
            <span className="countdown-unit-label">d</span>
          </div>
        )}
        <div className="countdown-unit">
          <span className="countdown-value">{String(hours).padStart(2, '0')}</span>
          <span className="countdown-unit-label">h</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{String(minutes).padStart(2, '0')}</span>
          <span className="countdown-unit-label">m</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{String(seconds).padStart(2, '0')}</span>
          <span className="countdown-unit-label">s</span>
        </div>
      </div>
    </div>
  );
}
