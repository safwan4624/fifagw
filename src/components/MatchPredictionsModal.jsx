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
      // Sort: exact score first, then correct outcome, then wrong, then by displayName
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

  const actualHome = fixture.homeScore ?? '-';
  const actualAway = fixture.awayScore ?? '-';
  const isCompleted = fixture.status === 'completed';

  const getOutcomeLabel = (pred) => {
    if (!isCompleted || pred.pointsAwarded === undefined) return null;
    if (pred.pointsAwarded >= 3) return { label: 'Exact ⚽', cls: 'pred-outcome-exact' };
    if (pred.pointsAwarded === 1) return { label: 'Correct', cls: 'pred-outcome-correct' };
    return { label: 'Wrong', cls: 'pred-outcome-wrong' };
  };

  // Stats summary
  const total = predictions.length;
  const exact = predictions.filter(p => (p.pointsAwarded ?? 0) >= 3).length;
  const correct = predictions.filter(p => (p.pointsAwarded ?? 0) === 1).length;
  const wrong = predictions.filter(p => isCompleted && (p.pointsAwarded ?? 0) === 0).length;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card-glass match-pred-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Match predictions"
      >
        {/* Header */}
        <div className="match-pred-modal-header">
          <div className="match-pred-modal-teams">
            <span className="pred-team-flag">{getFlag(fixture.homeTeam)}</span>
            <div className="pred-match-score-block">
              <span className="pred-team-name">{fixture.homeTeam}</span>
              {isCompleted && (
                <span className="pred-actual-score">
                  {actualHome} – {actualAway}
                </span>
              )}
              <span className="pred-team-name">{fixture.awayTeam}</span>
            </div>
            <span className="pred-team-flag">{getFlag(fixture.awayTeam)}</span>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            id="match-pred-modal-close"
          >
            ×
          </button>
        </div>

        {/* Summary chips */}
        {isCompleted && total > 0 && (
          <div className="pred-summary-chips">
            <div className="pred-chip pred-chip-total">
              <span>{total}</span>
              <span className="pred-chip-label">Participants</span>
            </div>
            <div className="pred-chip pred-chip-exact">
              <span>{exact}</span>
              <span className="pred-chip-label">Exact</span>
            </div>
            <div className="pred-chip pred-chip-correct">
              <span>{correct}</span>
              <span className="pred-chip-label">Correct</span>
            </div>
            <div className="pred-chip pred-chip-wrong">
              <span>{wrong}</span>
              <span className="pred-chip-label">Wrong</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="match-pred-modal-body">
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
            <div className="pred-list">
              {predictions.map((pred, idx) => {
                const outcome = getOutcomeLabel(pred);
                return (
                  <div
                    key={pred.id}
                    className={`pred-row ${outcome?.cls ?? ''}`}
                  >
                    <span className="pred-rank">#{idx + 1}</span>
                    <div className="pred-user-info">
                      {pred.photoURL ? (
                        <img
                          src={pred.photoURL}
                          alt=""
                          className="avatar avatar-xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="avatar avatar-xs avatar-placeholder">
                          {(pred.displayName ?? 'A')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="pred-user-name">{pred.displayName ?? 'Anonymous'}</span>
                    </div>
                    <div className="pred-scores-cell">
                      <span className="pred-score-val">{pred.predictedHomeScore ?? '_'}</span>
                      <span className="pred-score-sep">–</span>
                      <span className="pred-score-val">{pred.predictedAwayScore ?? '_'}</span>
                    </div>
                    {isCompleted && outcome && (
                      <div className={`pred-outcome-badge ${outcome.cls}`}>
                        {outcome.label}
                      </div>
                    )}
                    {isCompleted && (
                      <div className="pred-points-badge">
                        +{pred.pointsAwarded ?? 0}
                      </div>
                    )}
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
