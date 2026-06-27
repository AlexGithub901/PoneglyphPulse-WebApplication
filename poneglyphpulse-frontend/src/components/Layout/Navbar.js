import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🏴‍☠️ PoneglyphPulse</Link>
      </div>
      <div>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/gacha" className="nav-link">Gacha</Link>
        <Link to="/goals" className="nav-link">Goals</Link>
        <Link to="/map" className="nav-link">Map</Link> {/* ← ADD THIS */}
      </div>
      <ul className="navbar-links">
        <li className={isActive('/')}>
          <Link to="/">Dashboard</Link>
        </li>
        <li className={isActive('/gacha')}>
          <Link to="/gacha">Gacha</Link>
        </li>
        <li className={isActive('/goals')}>
          <Link to="/goals">Goals</Link>
        </li>
        <li className={isActive('/trade')}>
          <Link to="/trade">Trade</Link>
        </li>
        <li className={isActive('/chat')}>
          <Link to="/chat">Chat</Link>
        </li>
        <li className={isActive('/map')}>
          <Link to="/map">Map</Link>
        </li>
      </ul>
      <div className="navbar-user">
        {user && (
          <>
            <div className="user-info">
              <span className="level-badge">Lv {user.level}</span>
              <span className="username">{user.username}</span>
              <div className="currency">
                <span>🪙 {user.currency?.berries || 0}</span>
                <span>📜 {user.currency?.poneglyphs || 0}</span>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
