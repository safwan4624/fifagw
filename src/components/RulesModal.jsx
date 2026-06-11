import { useAuth } from '../contexts/AuthContext';

export default function RulesModal() {
  const { hasSeenRules, markRulesSeen } = useAuth();

  if (hasSeenRules) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '20px' }}>
      <div className="modal-content card-glass" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-xl)', padding: '0' }}>

        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Welcome to POSIBOLT FIFA WORLD CUP '26</h2>
          <p style={{ color: 'var(--text-subtle)' }}>Please review the rules before you start predicting.</p>
        </div>

        <div className="rules-container" style={{ padding: 'var(--space-6)' }}>
          {/* Section 1: How to Play */}
          <section className="rule-section card-glass" style={{ flexDirection: 'column', padding: 'var(--space-4)' }}>
            <div className="rule-content">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>🎮 How to Play</h2>
              <p style={{ fontSize: '0.9rem', marginBottom: '0' }}>
                Accurately predict the final scoreline of each World Cup match before it kicks off.
                The closer you are to the actual result, the more points you earn.
              </p>
            </div>
          </section>

          {/* Section 2: Prediction Window */}
          <section className="rule-section card-glass" style={{ flexDirection: 'column', padding: 'var(--space-4)' }}>
            <div className="rule-content">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>⏳ The Prediction Window</h2>
              <ul className="rule-list" style={{ fontSize: '0.9rem', marginBottom: '0' }}>
                <li><strong>Opening:</strong> A match becomes open for prediction exactly <strong>72 hours</strong> before kickoff.</li>
                <li><strong>Closing:</strong> Predictions are strictly locked exactly <strong>1 hour</strong> before kickoff.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Point System */}
          <section className="rule-section card-glass" style={{ flexDirection: 'column', padding: 'var(--space-4)' }}>
            <div className="rule-content">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>🎯 Point System</h2>
              <p style={{ fontSize: '0.9rem' }}>You can earn a maximum of <strong>3 points</strong> per match:</p>

              <div className="points-breakdown" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '0' }}>
                <div className="point-card" style={{ padding: '12px' }}>
                  <div className="point-value" style={{ fontSize: '1.5rem' }}>1 <span className="point-unit">pt</span></div>
                  <div className="point-desc">
                    <strong>Correct Outcome</strong>
                    <span style={{ fontSize: '0.8rem' }}>Predicted the winner (or a draw), but missed the exact score.</span>
                  </div>
                </div>
                <div className="point-card point-card-bonus" style={{ padding: '12px' }}>
                  <div className="point-value" style={{ fontSize: '1.5rem' }}>+2 <span className="point-unit">pts</span></div>
                  <div className="point-desc">
                    <strong>Exact Score Bonus</strong>
                    <span style={{ fontSize: '0.8rem' }}>Nailed the exact final scoreline.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div style={{ padding: 'var(--space-5)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={markRulesSeen} style={{ width: '100%' }}>
            I Understand, Let's Play!
          </button>
        </div>

      </div>
    </div>
  );
}
