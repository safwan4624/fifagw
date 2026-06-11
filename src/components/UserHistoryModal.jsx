import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { subscribeToUserPredictions } from '../services/predictionService';
import { getFlag } from '../config/teams';
import LoadingSpinner from './LoadingSpinner';

export default function UserHistoryModal({ targetUser, fixtures, onClose }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUser) return;
    const unsub = subscribeToUserPredictions(targetUser.id, (data) => {
      setPredictions(data);
      setLoading(false);
    });
    return () => unsub();
  }, [targetUser]);

  const historyItems = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];
    
    const now = Date.now();
    const items = predictions.map(pred => {
      const fixture = fixtures.find(f => f.id === pred.fixtureId);
      return { pred, fixture };
    }).filter(({ fixture }) => {
      if (!fixture) return false;
      // ONLY SHOW CLOSED/LOCKED FIXTURES for confidentiality
      const kt = fixture.kickoffTime?.toDate ? fixture.kickoffTime.toDate().getTime() : new Date(fixture.kickoffTime).getTime();
      const isClosed = fixture.status === 'closed' || fixture.status === 'completed' || now >= kt - 3600000;
      return isClosed;
    });

    // Sort by kickoff time descending (most recent first)
    return items.sort((a, b) => {
      const timeA = a.fixture.kickoffTime?.toDate ? a.fixture.kickoffTime.toDate().getTime() : new Date(a.fixture.kickoffTime).getTime();
      const timeB = b.fixture.kickoffTime?.toDate ? b.fixture.kickoffTime.toDate().getTime() : new Date(b.fixture.kickoffTime).getTime();
      return timeB - timeA;
    });
  }, [predictions, fixtures]);

  if (!targetUser) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '20px' }}>
      <div className="modal-content card-glass" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', padding: '0', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {targetUser.photoURL && (
              <img src={targetUser.photoURL} alt="" className="avatar avatar-sm" referrerPolicy="no-referrer" />
            )}
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{targetUser.displayName}'s Predictions</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 'var(--space-8)' }}>
              <LoadingSpinner text="Loading history..." />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <p>No closed predictions available yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                    <th>Date & Time</th>
                    <th>Match</th>
                    <th style={{ textAlign: 'center' }}>Actual Score</th>
                    <th style={{ textAlign: 'center' }}>Predicted</th>
                    <th style={{ textAlign: 'center' }}>Points Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map(({ pred, fixture }) => {
                    const isCompleted = fixture.status === 'completed';
                    const pointsAwarded = pred.pointsAwarded || 0;
                    
                    const kt = fixture.kickoffTime?.toDate ? fixture.kickoffTime.toDate() : new Date(fixture.kickoffTime);
                    
                    let highlightClass = '';
                    if (isCompleted) {
                      if (pointsAwarded === 3 || pointsAwarded > 1) {
                        highlightClass = 'history-row-perfect';
                      } else if (pointsAwarded === 1) {
                        highlightClass = 'history-row-wild';
                      } else {
                        highlightClass = 'history-row-wrong';
                      }
                    }

                    const matchNum = fixtures.findIndex(x => x.id === fixture.id) + 1;

                    return (
                      <tr key={pred.id} className={`history-row ${highlightClass}`}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-subtle)' }}>{matchNum}</td>
                        <td>
                          <div className="history-datetime">
                            <span className="history-date">{format(kt, 'MMM d')}</span>
                            <span className="history-time">{format(kt, 'h:mm a')}</span>
                          </div>
                        </td>
                        <td>
                          <div className="history-teams">
                            <div className="team-with-flag">
                              {getFlag(fixture.homeTeam)} <span className="team-name-short">{fixture.homeTeam.substring(0, 3).toUpperCase()}</span>
                            </div>
                            <span className="history-vs">vs</span>
                            <div className="team-with-flag">
                              <span className="team-name-short">{fixture.awayTeam.substring(0, 3).toUpperCase()}</span> {getFlag(fixture.awayTeam)}
                            </div>
                          </div>
                        </td>
                        <td className="history-score-cell" style={{ textAlign: 'center' }}>
                          {isCompleted ? (
                            <strong>{fixture.homeScore} - {fixture.awayScore}</strong>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="history-score-cell" style={{ textAlign: 'center' }}>
                          <strong>{pred.predictedHomeScore} - {pred.predictedAwayScore}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className={`history-points-badge ${isCompleted ? `points-${pointsAwarded}` : 'points-pending'}`}>
                            {isCompleted ? `+${pointsAwarded}` : 'Pending'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
