import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToLeaderboard } from '../services/leaderboardService';
import { subscribeToFixtures } from '../services/fixtureService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import UserHistoryModal from '../components/UserHistoryModal';
import LeaderboardExportView from '../components/LeaderboardExportView';
import html2canvas from 'html2canvas';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    let leaderboardLoaded = false;
    let fixturesLoaded = false;

    const unsubLeaderboard = subscribeToLeaderboard((data) => {
      setLeaderboard(data);
      leaderboardLoaded = true;
      if (fixturesLoaded) setLoading(false);
    });

    const unsubFixtures = subscribeToFixtures((data) => {
      setFixtures(data);
      fixturesLoaded = true;
      if (leaderboardLoaded) setLoading(false);
    });

    return () => {
      unsubLeaderboard();
      unsubFixtures();
    };
  }, []);

  const filteredLeaderboard = searchQuery
    ? leaderboard.filter(entry =>
      entry.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : leaderboard;

  // Stats
  const currentUserEntry = leaderboard.find(e => e.id === user?.uid);
  const totalParticipants = leaderboard.length;

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  const handleRowClick = (userEntry) => {
    setSelectedHistoryUser(userEntry);
  };

  const downloadFallback = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphwhite-leaderboard.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      // Temporarily ensure the element is properly staged for html2canvas
      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        backgroundColor: '#0a0e1a',
        scale: 2 // High res
      });

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Canvas to Blob failed');

        const file = new File([blob], 'graphwhite-leaderboard.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'WC 2026 Leaderboard',
              text: 'Check out the top 20 leaderboard!',
              files: [file]
            });
          } catch (shareErr) {
            // Fallback if sharing fails (but not if user aborts)
            if (shareErr.name !== 'AbortError') {
              downloadFallback(blob);
            }
          }
        } else {
          // Native share not supported, download instead
          downloadFallback(blob);
        }
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate image.');
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-content">
          <LoadingSpinner text="Loading leaderboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page" id="leaderboard-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="page-title">Leaderboard</h1>
              <p className="page-subtitle">Live standings</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleShare}
              disabled={isExporting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '1.2rem' }}>{isExporting ? '⏳' : '📤'}</span>
              {isExporting ? 'Generating...' : 'Share / Export'}
            </button>
          </div>
          <div className="fixtures-stats">
            <div className="stat-chip">
              <span className="stat-label">Participants</span>
              <span className="stat-value">{totalParticipants}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Rank</span>
              <span className="stat-value">{currentUserEntry?.rank || '–'}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Points</span>
              <span className="stat-value">{currentUserEntry?.totalPoints || 0}</span>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="podium">
            {/* Second place */}
            <div className="podium-entry podium-2">
              <img src={leaderboard[1].photoURL || ''} alt="" className="podium-avatar" referrerPolicy="no-referrer" />
              <span className="podium-rank">🥈</span>
              <span className="podium-name">{leaderboard[1].displayName?.split(' ')[0]}</span>
              <span className="podium-points">{leaderboard[1].totalPoints} pts</span>
              <div className="podium-bar podium-bar-2"></div>
            </div>
            {/* First place */}
            <div className="podium-entry podium-1">
              <img src={leaderboard[0].photoURL || ''} alt="" className="podium-avatar" referrerPolicy="no-referrer" />
              <span className="podium-rank">🥇</span>
              <span className="podium-name">{leaderboard[0].displayName?.split(' ')[0]}</span>
              <span className="podium-points">{leaderboard[0].totalPoints} pts</span>
              <div className="podium-bar podium-bar-1"></div>
            </div>
            {/* Third place */}
            <div className="podium-entry podium-3">
              <img src={leaderboard[2].photoURL || ''} alt="" className="podium-avatar" referrerPolicy="no-referrer" />
              <span className="podium-rank">🥉</span>
              <span className="podium-name">{leaderboard[2].displayName?.split(' ')[0]}</span>
              <span className="podium-points">{leaderboard[2].totalPoints} pts</span>
              <div className="podium-bar podium-bar-3"></div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="leaderboard-search">
          <input
            type="text"
            className="input"
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="leaderboard-search"
          />
        </div>

        {/* Leaderboard table */}
        <div className="leaderboard-table card-glass" style={{ overflow: 'hidden' }}>
          <div className="leaderboard-header-row">
            <span className="leaderboard-col-rank">Rank</span>
            <span className="leaderboard-col-player">Player</span>
            <span className="leaderboard-col-points">Points</span>
          </div>
          {filteredLeaderboard.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🔍</span>
              <p>No participants found</p>
            </div>
          ) : (
            filteredLeaderboard.map((entry) => (
              <div key={entry.id}>
                <div
                  className={`leaderboard-row ${getRankClass(entry.rank)} ${entry.id === user?.uid ? 'leaderboard-current-user' : ''}`}
                  id={`lb-row-${entry.id}`}
                  onClick={() => handleRowClick(entry)}
                >
                  <span className="leaderboard-col-rank">
                    <span className="leaderboard-rank">{getRankIcon(entry.rank)}</span>
                  </span>
                  <div className="leaderboard-col-player">
                    <img
                      src={entry.photoURL || ''}
                      alt=""
                      className="avatar avatar-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="leaderboard-player-info">
                      <span className="leaderboard-name">
                        <span className="leaderboard-name-text">{entry.displayName}</span>
                        {entry.id === user?.uid && <span className="you-badge">You</span>}
                      </span>
                    </div>
                  </div>
                  <span className="leaderboard-col-points" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span className="leaderboard-points">{entry.totalPoints}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <LeaderboardExportView leaderboard={leaderboard} ref={exportRef} />

      {selectedHistoryUser && (
        <UserHistoryModal
          targetUser={selectedHistoryUser}
          fixtures={fixtures}
          onClose={() => setSelectedHistoryUser(null)}
        />
      )}
    </div>
  );
}
