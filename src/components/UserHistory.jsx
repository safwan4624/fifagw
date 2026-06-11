import { useState, useEffect, useMemo } from 'react';
import { subscribeToUserPredictions } from '../services/predictionService';
import { getFlag } from '../config/teams';
import LoadingSpinner from './LoadingSpinner';

export default function UserHistory({ userId, fixtures }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToUserPredictions(userId, (data) => {
      setPredictions(data);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

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

  if (loading) {
    return (
      <div className="user-history-panel">
        <LoadingSpinner text="Loading history..." />
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="user-history-panel">
        <div className="empty-state">
          <p>No closed predictions available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-history-panel">
      <div className="history-grid">
        {historyItems.map(({ pred, fixture }) => {
          const isCompleted = fixture.status === 'completed';
          const pointsAwarded = pred.pointsAwarded || 0;
          
          return (
            <div key={pred.id} className="history-item">
              <div className="history-match" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {getFlag(fixture.homeTeam)} {fixture.homeTeam} 
                <span style={{ color: 'var(--text-subtle)', margin: '0 4px' }}>vs</span> 
                {fixture.awayTeam} {getFlag(fixture.awayTeam)}
                {isCompleted && <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 'bold' }}>({fixture.homeScore}-{fixture.awayScore})</span>}
              </div>
              <div className="history-prediction">
                Predicted: {pred.predictedHomeScore}-{pred.predictedAwayScore}
              </div>
              <div className={`history-points ${pointsAwarded > 0 ? 'positive' : ''}`}>
                {isCompleted ? `${pointsAwarded} pts` : 'Pending'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
