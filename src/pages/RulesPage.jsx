import Navbar from '../components/Navbar';

export default function RulesPage() {
  return (
    <div className="page" id="rules-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Game Rules</h1>
            <p className="page-subtitle">Everything you need to know to play and win.</p>
          </div>
        </div>

        <div className="rules-container">

          {/* Section 1: How to Play */}
          <section className="rule-section card-glass">
            <div className="rule-icon">🎮</div>
            <div className="rule-content">
              <h2>How to Play</h2>
              <p>
                Welcome to the GRAPHWHITE <strong>FIFA World Cup 2026 Predictor</strong>!
                Your goal is simple: accurately predict the final scoreline of each World Cup match before it kicks off.
                The closer you are to the actual result, the more points you earn.
              </p>
            </div>
          </section>

          {/* Section 2: Prediction Window */}
          <section className="rule-section card-glass">
            <div className="rule-icon">⏳</div>
            <div className="rule-content">
              <h2>The Prediction Window</h2>
              <p>
                Matches are not open for prediction indefinitely. To ensure fair play, strict time windows are enforced:
              </p>
              <ul className="rule-list">
                <li><strong>Opening:</strong> A match becomes open for prediction exactly <strong>72 hours</strong> before its scheduled kickoff time.</li>
                <li><strong>Closing:</strong> Predictions are strictly locked exactly <strong>1 hour</strong> before kickoff. Once a match is locked, you can no longer submit or edit your prediction.</li>
              </ul>
              <div className="rule-alert">
                <strong>Tip:</strong> Keep an eye on the countdown timers on the Fixtures page to ensure you don't miss a window!
              </div>
            </div>
          </section>

          {/* Section 3: Point System */}
          <section className="rule-section card-glass">
            <div className="rule-icon">🎯</div>
            <div className="rule-content">
              <h2>Point System</h2>
              <p>
                Points are awarded automatically after a match concludes and the final score is entered by the admin. You can earn a maximum of <strong>3 points</strong> per match:
              </p>

              <div className="points-breakdown">
                <div className="point-card">
                  <div className="point-value">1 <span className="point-unit">pt</span></div>
                  <div className="point-desc">
                    <strong>Correct Outcome</strong>
                    <span>You correctly predicted the winner (or a draw), but missed the exact score.</span>
                  </div>
                </div>
                <div className="point-card point-card-bonus">
                  <div className="point-value">+2 <span className="point-unit">pts</span></div>
                  <div className="point-desc">
                    <strong>Exact Score Bonus</strong>
                    <span>You nailed the exact final scoreline.</span>
                  </div>
                </div>
              </div>

              <div className="rule-examples">
                <h3>Examples:</h3>
                <ul>
                  <li><strong>Match:</strong> Argentina 2 - 1 Brazil</li>
                  <li>If you predicted <em>Argentina 1 - 0 Brazil</em>: You get <strong>1 point</strong> (Correct outcome).</li>
                  <li>If you predicted <em>Argentina 2 - 1 Brazil</em>: You get <strong>3 points</strong> (Correct outcome + Exact score bonus).</li>
                  <li>If you predicted <em>Argentina 1 - 1 Brazil</em>: You get <strong>0 points</strong> (Incorrect outcome).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Privacy & Fair Play */}
          <section className="rule-section card-glass">
            <div className="rule-icon">🔒</div>
            <div className="rule-content">
              <h2>Privacy & Fair Play</h2>
              <p>
                To prevent participants from copying each other's predictions, a strict confidentiality rule is in place.
              </p>
              <ul className="rule-list">
                <li>You can click on any participant in the <strong>Leaderboard</strong> to view their past predictions.</li>
                <li>However, their predictions will remain <strong>completely hidden</strong> for any match that is still "Open".</li>
                <li>Predictions are only revealed to other players once the match is officially <strong>Closed</strong> (less than 1 hour to kickoff).</li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
