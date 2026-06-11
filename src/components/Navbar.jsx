import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import logoImg from '../assets/FIFA-World-Cup-2026-Official-Match-Ball-PNG.png';

export default function Navbar() {
  const { user, isAdmin, signOutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <NavLink to="/fixtures" className="navbar-brand">
          <img src={logoImg} alt="Logo" className="navbar-logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span className="navbar-title">POSIBOLT FIFA WORLD CUP '26</span>
        </NavLink>

        <button
          className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          id="nav-toggle"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            <NavLink
              to="/fixtures"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={() => setMenuOpen(false)}
              id="nav-fixtures"
            >
              <span className="nav-link-icon">📋</span>
              Fixtures
            </NavLink>
            <NavLink
              to="/leaderboard"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={() => setMenuOpen(false)}
              id="nav-leaderboard"
            >
              <span className="nav-link-icon">🏆</span>
              Leaderboard
            </NavLink>
            <NavLink
              to="/rules"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={() => setMenuOpen(false)}
              id="nav-rules"
            >
              <span className="nav-link-icon">📖</span>
              Rules
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                onClick={() => setMenuOpen(false)}
                id="nav-admin"
              >
                <span className="nav-link-icon">⚙️</span>
                Manage
              </NavLink>
            )}
          </div>

          <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={toggleTheme} 
              style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="avatar avatar-sm" referrerPolicy="no-referrer" />
            )}
            <span className="navbar-username">{user?.displayName?.split(' ')[0]}</span>
            <button className="btn btn-sm btn-secondary" onClick={handleSignOut} id="btn-signout">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
