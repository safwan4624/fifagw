import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToFixtures } from '../services/fixtureService';
import { subscribeToUserPredictions } from '../services/predictionService';
import { TOURNAMENT_ROUNDS } from '../config/rounds';
import MatchCard from '../components/MatchCard';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import MatchPredictionsModal from '../components/MatchPredictionsModal';

export default function FixturesPage() {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [expandedDate, setExpandedDate] = useState(null);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);

  // Subscribe to fixtures
  useEffect(() => {
    const unsub = subscribeToFixtures((data) => {
      setFixtures(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to user predictions
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserPredictions(user.uid, (data) => {
      const predMap = {};
      data.forEach(p => { predMap[p.fixtureId] = p; });
      setPredictions(predMap);
    });
    return () => unsub();
  }, [user]);

  // Filter fixtures
  const filteredFixtures = useMemo(() => {
    const now = Date.now();
    return fixtures.filter(f => {
      const kt = f.kickoffTime?.toDate ? f.kickoffTime.toDate().getTime() : new Date(f.kickoffTime).getTime();

      if (statusFilter === 'open') {
        // Not completed, inside 72h window, and not closed (1 hour before kickoff)
        return f.status !== 'completed' && now >= kt - (72 * 3600000) && now < kt - 3600000;
      }

      if (statusFilter === 'upcoming') {
        // Not completed and outside the 72h window
        return f.status !== 'completed' && now < kt - (72 * 3600000);
      }

      if (statusFilter === 'closed') {
        // Not completed but closed (within 1 hour before kickoff or explicitly marked closed)
        return (f.status !== 'completed' && now >= kt - 3600000) || f.status === 'closed';
      }

      if (statusFilter === 'result') {
        // All completed matches
        return f.status === 'completed';
      }

      return false;
    });
  }, [fixtures, statusFilter]);

  // Group results by date
  const groupedResults = useMemo(() => {
    if (statusFilter !== 'result') return null;
    const groups = {};
    filteredFixtures.forEach(f => {
      const kt = f.kickoffTime?.toDate ? f.kickoffTime.toDate() : new Date(f.kickoffTime);
      const dateStr = format(kt, 'MMM d, yyyy');
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(f);
    });
    // Convert to array
    return Object.entries(groups).map(([date, matches]) => ({ date, matches }));
  }, [filteredFixtures, statusFilter]);

  // Auto-expand the most recent date if switching to results
  useEffect(() => {
    if (statusFilter === 'result' && groupedResults && groupedResults.length > 0 && !hasAutoExpanded) {
      setExpandedDate(groupedResults[groupedResults.length - 1].date);
      setHasAutoExpanded(true);
    }
  }, [statusFilter, groupedResults, hasAutoExpanded]);

  // Reset auto-expand when leaving results tab
  useEffect(() => {
    if (statusFilter !== 'result') {
      setHasAutoExpanded(false);
      setExpandedDate(null);
    }
  }, [statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const now = Date.now();
    
    // Get all fixtures that have entered the 'open' window or are already closed/completed
    const activeFixtures = fixtures.filter(f => {
      const kt = f.kickoffTime?.toDate ? f.kickoffTime.toDate().getTime() : new Date(f.kickoffTime).getTime();
      return (now >= kt - (72 * 3600000)) || f.status === 'closed' || f.status === 'completed';
    });

    const totalActive = activeFixtures.length;
    const predictedActive = activeFixtures.filter(f => predictions[f.id]).length;
    
    let totalPoints = 0;
    Object.values(predictions).forEach(p => {
      if (p.pointsAwarded > 0) {
        totalPoints += p.pointsAwarded;
      }
    });

    return { totalActive, predictedActive, totalPoints };
  }, [fixtures, predictions]);

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-content">
          <LoadingSpinner text="Loading fixtures..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page" id="fixtures-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Fixtures</h1>
            <p className="page-subtitle">Predict match scores</p>
          </div>
          <div className="fixtures-stats">
            <div className="stat-chip">
              <span className="stat-label">Points</span>
              <span className="stat-value">{stats.totalPoints}</span>  
            </div>
            <div className="stat-chip">
              <span className="stat-label">Predicted</span>
              <span className="stat-value">{stats.predictedActive}/{stats.totalActive}</span>
            </div>
          </div>
        </div>

        {/* Status filter */}
        <div className="status-filters">
          {[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'open', label: 'Open' },
            { key: 'closed', label: 'Closed' },
            { key: 'result', label: 'Result' },
          ].map(f => (
            <button
              key={f.key}
              className={`filter-chip ${statusFilter === f.key ? 'filter-chip-active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Match cards */}
        {filteredFixtures.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <h3>No matches found</h3>
            <p>Try selecting a different filter</p>
          </div>
        ) : statusFilter === 'result' && groupedResults ? (
          <div className="results-accordion">
            {groupedResults.map(group => (
              <div key={group.date} className={`accordion-section ${expandedDate === group.date ? 'expanded' : ''}`}>
                <div 
                  className="accordion-header card-glass" 
                  onClick={() => setExpandedDate(expandedDate === group.date ? null : group.date)}
                >
                  <div className="accordion-title">
                    <span className="accordion-date">{group.date}</span>
                    <span className="accordion-badge">{group.matches.length} match{group.matches.length !== 1 ? 'es' : ''}</span>
                  </div>
                  <span className="accordion-icon">{expandedDate === group.date ? '▼' : '▶'}</span>
                </div>
                
                {expandedDate === group.date && (
                  <div className="accordion-body fixtures-grid">
                    {group.matches.map(fixture => {
                      const matchNum = fixtures.findIndex(x => x.id === fixture.id) + 1;
                      return (
                        <MatchCard
                          key={fixture.id}
                          fixture={fixture}
                          prediction={predictions[fixture.id]}
                          matchNumber={matchNum}
                          onShowPredictions={setSelectedFixture}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="fixtures-grid">
            {filteredFixtures.map(fixture => {
              const matchNum = fixtures.findIndex(x => x.id === fixture.id) + 1;
              return (
                <MatchCard
                  key={fixture.id}
                  fixture={fixture}
                  prediction={predictions[fixture.id]}
                  matchNumber={matchNum}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Match predictions modal */}
      {selectedFixture && (
        <MatchPredictionsModal
          fixture={selectedFixture}
          onClose={() => setSelectedFixture(null)}
        />
      )}
    </div>
  );
}
