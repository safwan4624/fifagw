import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { submitPrediction } from '../services/predictionService';
import { getFlag } from '../config/teams';
import { useToast } from './Toast';
import ScoreInput from './ScoreInput';
import CountdownTimer from './CountdownTimer';
import { useCountdown } from '../hooks/useCountdown';

export default function MatchCard({ fixture, prediction, matchNumber, onShowPredictions }) {
  const { user } = useAuth();
  const toast = useToast();
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing prediction
  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.predictedHomeScore ?? '');
      setAwayScore(prediction.predictedAwayScore ?? '');
    }
  }, [prediction]);

  const kickoffDate = fixture.kickoffTime?.toDate ? fixture.kickoffTime.toDate() : new Date(fixture.kickoffTime);
  const { isClosed: hookClosed, isTooEarly } = useCountdown(kickoffDate);
  const isCompleted = fixture.status === 'completed';
  const isClosed = fixture.status === 'closed' || isCompleted || hookClosed;

  const hasChanged = prediction
    ? (Number(homeScore) !== prediction.predictedHomeScore || Number(awayScore) !== prediction.predictedAwayScore)
    : true;

  const canSubmit = homeScore !== '' && awayScore !== '' && hasChanged;

  const handleSubmit = async () => {
    if (homeScore === '' || awayScore === '' || homeScore === null || awayScore === null) {
      toast.error('Please enter both scores');
      return;
    }
    setSaving(true);
    try {
      await submitPrediction(user.uid, fixture.id, Number(homeScore), Number(awayScore));
      toast.success('Prediction saved! ⚽');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save prediction');
    } finally {
      setSaving(false);
    }
  };

  const gotExactScore = prediction?.pointsAwarded >= 3;

  return (
    <div className={`match-card card-glass ${isCompleted ? 'match-card-completed' : ''} ${gotExactScore ? 'match-card-correct' : ''}`} style={{ position: 'relative' }} id={`match-${fixture.id}`}>
      {fixture.round && (
        <span style={{ 
          position: 'absolute', 
          top: '12px',
          right: '12px', 
          background: 'rgba(59, 130, 246, 0.2)', 
          padding: '2px 8px', 
          borderRadius: '12px', 
          fontSize: '10px', 
          fontWeight: '600', 
          color: 'var(--color-primary-light)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          zIndex: 2
        }}>
          {fixture.round}
        </span>
      )}
      <div className="match-card-header" style={{ justifyContent: 'center' }}>
        <span className="match-number">Match {matchNumber}</span>
      </div>

      <div className="match-card-body">
        <div className="match-team match-team-home">
          <span className="team-flag">{getFlag(fixture.homeTeam)}</span>
          <span className="team-name">{fixture.homeTeam}</span>
        </div>

        <div className="match-center">
          {isCompleted ? (
            <div className="match-result">
              <span className="result-score">{fixture.homeScore}</span>
              <span className="result-separator">–</span>
              <span className="result-score">{fixture.awayScore}</span>
            </div>
          ) : (
            <div className="match-time">
              <span className="match-date">{format(kickoffDate, 'MMM d')}</span>
              <span className="match-kickoff">{format(kickoffDate, 'h:mm a')}</span>
            </div>
          )}
        </div>

        <div className="match-team match-team-away">
          <span className="team-flag">{getFlag(fixture.awayTeam)}</span>
          <span className="team-name">{fixture.awayTeam}</span>
        </div>
      </div>

      {/* Prediction section */}
      {!isCompleted && (
        <div className="match-prediction">
          {isTooEarly ? (
            <div className="prediction-closed">
              <span className="prediction-label">Prediction opens at {format(new Date(kickoffDate.getTime() - 72 * 3600000), 'MMM d, h:mm a')}</span>
            </div>
          ) : !isClosed ? (
            <>
              <div className="prediction-inputs">
                <ScoreInput value={homeScore} onChange={setHomeScore} disabled={isClosed} />
                <span className="prediction-vs">vs</span>
                <ScoreInput value={awayScore} onChange={setAwayScore} disabled={isClosed} />
              </div>
              <button
                className={`btn btn-primary btn-sm prediction-submit ${saved ? 'btn-saved' : ''}`}
                onClick={handleSubmit}
                disabled={saving || isClosed || !canSubmit}
                id={`submit-${fixture.id}`}
              >
                {saving ? 'Saving...' : saved ? '✓ Saved' : prediction ? 'Update' : 'Submit'}
              </button>
            </>
          ) : prediction ? (
            <div className="prediction-closed">
              <span className="prediction-label">Your prediction</span>
              <div className="prediction-scores">
                <span className="prediction-score">{prediction.predictedHomeScore}</span>
                <span className="prediction-vs">–</span>
                <span className="prediction-score">{prediction.predictedAwayScore}</span>
              </div>
            </div>
          ) : (
            <div className="prediction-closed">
              <span className="prediction-label">Your prediction</span>
              <div className="prediction-scores" style={{ opacity: 0.5 }}>
                <span className="prediction-score">_</span>
                <span className="prediction-vs">–</span>
                <span className="prediction-score">_</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result + prediction comparison for completed matches */}
      {isCompleted && (
        <div className="match-prediction-result">
          <div className="prediction-comparison">
            <span className="prediction-label">Your prediction</span>
            <div className="prediction-scores" style={{ opacity: prediction ? 1 : 0.5 }}>
              <span className="prediction-score">{prediction ? prediction.predictedHomeScore : '_'}</span>
              <span className="prediction-vs">–</span>
              <span className="prediction-score">{prediction ? prediction.predictedAwayScore : '_'}</span>
            </div>
          </div>
          {gotExactScore && (
            <div className="points-badge">
              <span>+{prediction.points} pt{prediction.points !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* View all predictions button — shown in result tab */}
      {isCompleted && onShowPredictions && (
        <button
          className="btn-view-predictions"
          onClick={() => onShowPredictions(fixture)}
          id={`view-preds-${fixture.id}`}
        >
          <span>👥</span> View All Predictions
        </button>
      )}

      {/* Countdown for upcoming matches */}
      {fixture.status === 'upcoming' && !isClosed && (
        <div className="match-countdown" style={{ display: 'flex', justifyContent: 'center' }}>
          <CountdownTimer kickoffTime={kickoffDate} />
        </div>
      )}
    </div>
  );
}
