import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { subscribeToFixtures, addFixture, updateFixtureResult, deleteFixture, seedFixtures, updateFixture } from '../services/fixtureService';
import { calculatePointsForFixture, getPredictionsCountForFixture, subscribeToAllPredictions } from '../services/predictionService';
import { db } from '../config/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { getAllTeamNames, getFlag } from '../config/teams';
import { TOURNAMENT_ROUNDS } from '../config/rounds';
import { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

const SAMPLE_FIXTURES_JSON = `[
  {
    "homeTeam": "Mexico",
    "awayTeam": "South Africa",
    "kickoffTime": "2026-06-12 12:30 AM",
    "round": "Group A"
  }
]`;

export default function AdminPage() {
  const toast = useToast();
  const [fixtures, setFixtures] = useState([]);
  const [predictionCounts, setPredictionCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterRound, setFilterRound] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, open, closed, completed

  // Add fixture
  const [newFixture, setNewFixture] = useState({ homeTeam: '', awayTeam: '', kickoffTime: '', round: '' });
  const [isAddingFixture, setIsAddingFixture] = useState(false);

  // Bulk import
  const [bulkJson, setBulkJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [isImportingFixtures, setIsImportingFixtures] = useState(false);

  // Inline Editing
  const [editingFixtureId, setEditingFixtureId] = useState(null);
  const [editingHasPredictions, setEditingHasPredictions] = useState(false);
  const [editFixtureData, setEditFixtureData] = useState({ homeTeam: '', awayTeam: '', kickoffTime: '', round: '' });

  // Inline Scoring
  const [scoringFixtureId, setScoringFixtureId] = useState(null);
  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');
  const [submittingScore, setSubmittingScore] = useState(false);

  const teamNames = getAllTeamNames();

  useEffect(() => {
    let fixturesLoaded = false;
    let predictionsLoaded = false;

    const unsubFixtures = subscribeToFixtures((data) => {
      setFixtures(data);
      fixturesLoaded = true;
      if (predictionsLoaded) setLoading(false);
    });

    const unsubPredictions = subscribeToAllPredictions((data) => {
      const counts = {};
      data.forEach(p => {
        counts[p.fixtureId] = (counts[p.fixtureId] || 0) + 1;
      });
      setPredictionCounts(counts);
      predictionsLoaded = true;
      if (fixturesLoaded) setLoading(false);
    });

    return () => {
      unsubFixtures();
      unsubPredictions();
    };
  }, []);

  // Filtered fixtures
  const filteredFixtures = fixtures.filter(f => {
    if (filterRound && f.round !== filterRound) return false;
    
    if (filterStatus !== 'all') {
      const kt = f.kickoffTime?.toDate ? f.kickoffTime.toDate().getTime() : new Date(f.kickoffTime).getTime();
      const now = Date.now();
      
      if (filterStatus === 'upcoming') {
        if (f.status === 'completed' || now >= kt - (72 * 3600000)) return false;
      } else if (filterStatus === 'open') {
        if (f.status === 'completed' || now < kt - (72 * 3600000) || now >= kt - 3600000) return false;
      } else if (filterStatus === 'closed') {
        if (f.status === 'completed') return false;
        const isTimeClosed = now >= kt - 3600000;
        if (!isTimeClosed && f.status !== 'closed') return false;
      } else if (filterStatus === 'completed') {
        if (f.status !== 'completed') return false;
      }
    }
    return true;
  });

  // Handle result submission inline
  const handleSubmitScore = async (fixtureId) => {
    if (scoreHome === '' || scoreAway === '') {
      toast.error('Please enter both scores');
      return;
    }
    setSubmittingScore(true);
    try {
      await updateFixtureResult(fixtureId, Number(scoreHome), Number(scoreAway));
      await calculatePointsForFixture(fixtureId, Number(scoreHome), Number(scoreAway));
      toast.success('Result saved and points calculated! 🎉');
      setScoringFixtureId(null);
      setScoreHome('');
      setScoreAway('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit result: ' + err.message);
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleScoreClick = (f) => {
    setScoringFixtureId(f.id);
    setScoreHome(f.homeScore ?? '');
    setScoreAway(f.awayScore ?? '');
    setEditingFixtureId(null);
  };

  // Handle add fixture
  const handleAddFixture = async () => {
    if (!newFixture.homeTeam || !newFixture.awayTeam || !newFixture.kickoffTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await addFixture({
        ...newFixture,
        kickoffTime: new Date(newFixture.kickoffTime),
        status: 'upcoming',
        homeScore: null,
        awayScore: null,
      });
      toast.success('Fixture added! ⚽');
      setNewFixture({ homeTeam: '', awayTeam: '', kickoffTime: '', round: '' });
      setIsAddingFixture(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add fixture');
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    setImporting(true);
    try {
      const sanitizedJson = bulkJson.replace(/[\u201C\u201D]/g, '"');
      const data = JSON.parse(sanitizedJson);
      if (!Array.isArray(data)) throw new Error('JSON must be an array');
      const fixturesData = data.map(f => ({
        ...f,
        kickoffTime: new Date(f.kickoffTime),
        status: 'upcoming',
        homeScore: null,
        awayScore: null,
      }));
      await seedFixtures(fixturesData);
      toast.success(`Imported ${fixturesData.length} fixtures! 🎉`);
      setBulkJson('');
      setIsImportingFixtures(false);
    } catch (err) {
      console.error(err);
      toast.error('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Handle delete fixture
  const handleDeleteFixture = async (fixtureId) => {
    if (!window.confirm('Are you sure you want to delete this fixture?')) return;
    try {
      const predCount = await getPredictionsCountForFixture(fixtureId);
      if (predCount > 0) {
        toast.error(`Cannot delete! This match already has ${predCount} prediction(s).`);
        return;
      }
      await deleteFixture(fixtureId);
      toast.success('Fixture deleted');
    } catch (err) {
      toast.error('Failed to delete fixture');
    }
  };

  // Handle edit fixture
  const handleEditClick = (f) => {
    try {
      const predCount = predictionCounts[f.id] || 0;
      setEditingHasPredictions(predCount > 0);

      setEditingFixtureId(f.id);
      setScoringFixtureId(null);

      const kt = f.kickoffTime?.toDate ? f.kickoffTime.toDate() : new Date(f.kickoffTime);
      const tzOffset = kt.getTimezoneOffset() * 60000;
      const localISOTime = new Date(kt - tzOffset).toISOString().slice(0, 16);

      setEditFixtureData({
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        kickoffTime: localISOTime,
        round: f.round || '',
      });
    } catch (err) {
      toast.error('Failed to initiate edit mode');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateFixture(editingFixtureId, {
        ...editFixtureData,
        kickoffTime: new Date(editFixtureData.kickoffTime),
      });
      toast.success('Fixture updated! ⚽');
      setEditingFixtureId(null);
    } catch (err) {
      toast.error('Failed to update fixture: ' + err.message);
    }
  };

  const handleRecalculate = async (fixture) => {
    try {
      await calculatePointsForFixture(fixture.id, fixture.homeScore, fixture.awayScore);
      toast.success('Points recalculated!');
    } catch (err) {
      toast.error('Recalculation failed: ' + err.message);
    }
  };


  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-content"><LoadingSpinner text="Loading admin panel..." /></div>
      </div>
    );
  }

  return (
    <div className="page" id="admin-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage Fixtures</h1>
            <p className="page-subtitle">Manage fixtures, enter results, and calculate points</p>
          </div>
        </div>

        <div className="admin-section" id="admin-manage">
          {/* Top Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>All Fixtures ({filteredFixtures.length})</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isImportingFixtures && (
                <button className="btn btn-sm btn-secondary" onClick={() => { setIsImportingFixtures(true); setIsAddingFixture(false); }}>
                  📦 Bulk Import
                </button>
              )}
              {!isAddingFixture && (
                <button className="btn btn-sm btn-primary" onClick={() => { setIsAddingFixture(true); setIsImportingFixtures(false); }}>
                  ➕ Add Fixture
                </button>
              )}
            </div>
          </div>

          {/* Inline Import Form - Moved Above Filters */}
          {isImportingFixtures && (
            <div className="admin-fixture-row card-highlight card-glass" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>Bulk Import Fixtures JSON</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Use readable formats like "2026-06-12 12:30 AM" or "2026-06-12 20:00"</p>
              <textarea className="input textarea" rows="8" value={bulkJson} onChange={e => setBulkJson(e.target.value)} placeholder={SAMPLE_FIXTURES_JSON} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => setIsImportingFixtures(false)}>Cancel</button>
                <button className="btn btn-sm btn-primary" onClick={handleBulkImport} disabled={importing || !bulkJson.trim()}>{importing ? 'Importing...' : 'Import Fixtures'}</button>
              </div>
            </div>
          )}

          {/* Inline Add Form - Moved Above Filters */}
          {isAddingFixture && (
            <div className="admin-fixture-row card-highlight card-glass" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>New Fixture</h3>
              <div className="form-row">
                <select className="input select" value={newFixture.round} onChange={e => setNewFixture({ ...newFixture, round: e.target.value })}>
                  <option value="">Select Round...</option>
                  {TOURNAMENT_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-row">
                <select className="input select" value={newFixture.homeTeam} onChange={e => setNewFixture({ ...newFixture, homeTeam: e.target.value })}>
                  <option value="">Home Team...</option>
                  {teamNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <select className="input select" value={newFixture.awayTeam} onChange={e => setNewFixture({ ...newFixture, awayTeam: e.target.value })}>
                  <option value="">Away Team...</option>
                  {teamNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <input type="datetime-local" className="input" value={newFixture.kickoffTime} onChange={e => setNewFixture({ ...newFixture, kickoffTime: e.target.value })} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => setIsAddingFixture(false)}>Cancel</button>
                <button className="btn btn-sm btn-primary" onClick={handleAddFixture}>Save New Fixture</button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card-glass" style={{ padding: '12px', marginBottom: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select className="input select" style={{ width: '150px' }} value={filterRound} onChange={e => setFilterRound(e.target.value)}>
              <option value="">All Rounds</option>
              {TOURNAMENT_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="input select" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="admin-fixtures-list">
            {filteredFixtures.length === 0 && !isAddingFixture && !isImportingFixtures ? (
              <div className="empty-state">
                <span className="empty-state-icon">📭</span>
                <p>No fixtures found. Adjust filters or add new fixtures.</p>
              </div>
            ) : (
              filteredFixtures.map(f => {
                const kt = f.kickoffTime?.toDate ? f.kickoffTime.toDate() : new Date(f.kickoffTime);
                const now = Date.now();
                let displayStatus = f.status;
                if (f.status === 'upcoming' || f.status === 'closed') {
                  if (now >= kt.getTime() - 3600000) {
                    displayStatus = 'closed';
                  } else if (now >= kt.getTime() - (72 * 3600000)) {
                    displayStatus = 'open';
                  } else {
                    displayStatus = 'upcoming';
                  }
                }

                // Inline Edit Form
                if (editingFixtureId === f.id) {
                  return (
                    <div key={f.id} className="admin-fixture-row card-glass" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                      <div className="form-row">
                        <select className="input select" value={editFixtureData.round} onChange={e => setEditFixtureData({ ...editFixtureData, round: e.target.value })}>
                          <option value="">Select Round...</option>
                          {TOURNAMENT_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      {editingHasPredictions && <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', margin: 0 }}>Team changes are disabled because predictions exist for this match.</p>}
                      <div className="form-row">
                        <select className="input select" value={editFixtureData.homeTeam} onChange={e => setEditFixtureData({ ...editFixtureData, homeTeam: e.target.value })} disabled={editingHasPredictions}>
                          <option value="">Home Team</option>
                          {teamNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <select className="input select" value={editFixtureData.awayTeam} onChange={e => setEditFixtureData({ ...editFixtureData, awayTeam: e.target.value })} disabled={editingHasPredictions}>
                          <option value="">Away Team</option>
                          {teamNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                      <input type="datetime-local" className="input" value={editFixtureData.kickoffTime} onChange={e => setEditFixtureData({ ...editFixtureData, kickoffTime: e.target.value })} />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setEditingFixtureId(null)}>Cancel</button>
                        <button className="btn btn-sm btn-primary" onClick={handleSaveEdit}>Save</button>
                      </div>
                    </div>
                  );
                }

                // Inline Score Form
                if (scoringFixtureId === f.id) {
                  return (
                    <div key={f.id} className="admin-fixture-row card-highlight card-glass" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', padding: '1rem 0' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>HOME</span>
                          <strong>{getFlag(f.homeTeam)} {f.homeTeam}</strong>
                        </div>
                        <input type="number" className="input score-input-admin" min="0" value={scoreHome} onChange={e => setScoreHome(e.target.value)} placeholder="0" style={{ width: '80px', textAlign: 'center' }} />
                        <span>-</span>
                        <input type="number" className="input score-input-admin" min="0" value={scoreAway} onChange={e => setScoreAway(e.target.value)} placeholder="0" style={{ width: '80px', textAlign: 'center' }} />
                        <div>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>AWAY</span>
                          <strong>{f.awayTeam} {getFlag(f.awayTeam)}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setScoringFixtureId(null)}>Cancel</button>
                        <button className="btn btn-sm btn-primary" onClick={() => handleSubmitScore(f.id)} disabled={submittingScore}>{submittingScore ? 'Submitting...' : 'Submit Result & Calculate'}</button>
                      </div>
                    </div>
                  );
                }

                // Standard Row
                const matchNum = fixtures.findIndex(x => x.id === f.id) + 1;
                return (
                  <div key={f.id} className="admin-fixture-row card-glass">
                    <div className="admin-fixture-info">
                      <span className="admin-fixture-matchNumber">{matchNum} {f.round && `(${f.round})`}</span>
                      <span className="admin-fixture-teams">
                        {getFlag(f.homeTeam)} {f.homeTeam} vs {f.awayTeam} {getFlag(f.awayTeam)}
                      </span>
                      <span className="admin-fixture-time">{format(kt, 'MMM d, h:mm a')}</span>
                      {filterStatus === 'all' && (
                        <span className={`badge badge-${displayStatus}`}>{displayStatus}</span>
                      )}
                      {f.status === 'completed' && (
                        <span className="admin-fixture-score">{f.homeScore} – {f.awayScore}</span>
                      )}
                    </div>
                    <div className="admin-fixture-actions">
                      {(displayStatus === 'closed' || displayStatus === 'completed') && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleScoreClick(f)}>
                          {f.status === 'completed' ? 'Edit Score' : 'Enter Score'}
                        </button>
                      )}
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEditClick(f)}>
                        Edit
                      </button>
                      {(!predictionCounts[f.id] || predictionCounts[f.id] === 0) && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteFixture(f.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
