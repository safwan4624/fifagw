import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import logoImg from '../assets/FIFA-World-Cup-2026-Official-Match-Ball-PNG.png';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/fixtures', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/fixtures');
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  if (loading) {
    return (
      <div className="login-page">
        <LoadingSpinner text="" />
      </div>
    );
  }

  return (
    <div className="login-page" id="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1"></div>
        <div className="login-bg-orb login-bg-orb-2"></div>
        <div className="login-bg-orb login-bg-orb-3"></div>
        <div className="login-grid"></div>
      </div>

      <div className="login-content">
        <div className="login-card card-glass">
          <div className="login-header">
            <div className="login-logo">
              <img src={logoImg} alt="Official Match Ball" style={{ display: 'block', margin: '0 auto', width: '100px', height: '100px', objectFit: 'contain', animation: 'float 3s ease-in-out infinite' }} />
            </div>
            <h1 className="login-title">
              <span style={{ display: 'block' }}>GRAPHWHITE</span>
              <span style={{ display: 'block', fontSize: '0.65em', marginTop: '4px' }}>FIFA WORLD CUP '26</span>
            </h1>
            <p className="login-tagline">Prediction Contest</p>
          </div>

          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">📊</span>
              <span>Predict match scores</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">🏆</span>
              <span>Compete on the leaderboard</span>
            </div>
          </div>

          <button className="btn-google" onClick={handleSignIn} id="btn-google-signin">
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
