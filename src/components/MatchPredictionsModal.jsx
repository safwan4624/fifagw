import { useState, useEffect } from 'react';
import { subscribeToFixturePredictionsWithUsers } from '../services/predictionService';
import { getFlag } from '../config/teams';
import LoadingSpinner from './LoadingSpinner';

export default function MatchPredictionsModal({ fixture, onClose }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fixture) return;
    const unsub = subscribeToFixturePredictionsWithUsers(fixture.id, (data) => {
      const sorted = [...data].sort((a, b) => {
        const pts = (b.pointsAwarded ?? 0) - (a.pointsAwarded ?? 0);
        if (pts !== 0) return pts;
        return (a.displayName ?? '').localeCompare(b.displayName ?? '');
      });
      setPredictions(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, [fixture]);

  if (!fixture) return null;

  const isCompleted = fixture.status === 'completed';

  // Crown shown for any user who earned points (correct outcome or exact score)
  const hasCrown = (pred) => isCompleted && (pred.pointsAwarded ?? 0) > 0;

  // Points label colour
  const ptsClass = (pts) => {
    if (pts >= 3) return 'pts-exact';
    if (pts === 1) return 'pts-correct';
    return 'pts-wrong';
  };

  // Left border colour
  const rowBorderClass = (pred) => {
    if (!isCompleted) return '';
    const pts = pred.pointsAwarded ?? 0;
    if (pts >= 3) return 'pred-row-exact';
    if (pts === 1) return 'pred-row-correct';
    return 'pred-row-wrong';
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="mpm-shell card-glass"
        role="dialog"
        aria-modal="true"
        aria-label="Match predictions"
      >
        {/* ── Title bar ── */}
        <div className="mpm-titlebar">
          <span className="mpm-title">Match Predictions</span>
          <button
            className="mpm-close"
            onClick={onClose}
            aria-label="Close"
            id="match-pred-modal-close"
          >
            ×
          </button>
        </div>

        {/* ── Match summary line ── */}
        <div className="mpm-match-line">
          <span className="mpm-flag">{getFlag(fixture.homeTeam)}</span>
          <span className="mpm-team">{fixture.homeTeam}</span>
          {isCompleted && (
            <span className="mpm-score">
              {fixture.homeScore} - {fixture.awayScore}
            </span>
          )}
          <span className="mpm-team">{fixture.awayTeam}</span>
          <span className="mpm-flag">{getFlag(fixture.awayTeam)}</span>
        </div>

        <div className="mpm-divider" />

        {/* ── List ── */}
        <div className="mpm-body">
          {loading ? (
            <div style={{ padding: '2rem' }}>
              <LoadingSpinner text="Loading predictions..." />
            </div>
          ) : predictions.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <span className="empty-state-icon">🔮</span>
              <p>No predictions were submitted for this match.</p>
            </div>
          ) : (
            <div className="mpm-list">
              {predictions.map((pred) => {
                const pts = pred.pointsAwarded ?? 0;
                const crowned = hasCrown(pred);
                return (
                  <div key={pred.id} className={`mpm-row ${rowBorderClass(pred)}`}>
                    {/* Avatar + crown */}
                    <div className="mpm-avatar-wrap">
                      {crowned && <span className="mpm-crown">👑</span>}
                      {pred.photoURL ? (
                        <img
                          src={pred.photoURL}
                          alt=""
                          className="mpm-avatar"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="mpm-avatar mpm-avatar-letter">
                          {(pred.displayName ?? 'A')[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <span className="mpm-name">{pred.displayName ?? 'Anonymous'}</span>

                    {/* Score + pts */}
                    <div className="mpm-right">
                      <span className="mpm-pred-score">
                        {pred.predictedHomeScore ?? '_'} - {pred.predictedAwayScore ?? '_'}
                      </span>
                      {isCompleted && (
                        <span className={`mpm-pts ${ptsClass(pts)}`}>
                          +{pts} pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
