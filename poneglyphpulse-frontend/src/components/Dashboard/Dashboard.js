import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Dashboard.css';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentGoals, setRecentGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, goalsRes] = await Promise.all([
        api.get('/goals/stats'),
        api.get('/goals/my-goals?completed=false')
      ]);
      setStats(statsRes.data.stats);
      setRecentGoals(goalsRes.data.goals.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading your adventure...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}! 🏴‍☠️</h1>
        <p>Continue your journey to greatness</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <h3>{stats?.active || 0}</h3>
          <p>Active Goals</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <h3>{stats?.completed || 0}</h3>
          <p>Completed</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <h3>{stats?.currentStreak || 0}</h3>
          <p>Day Streak</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <h3>{stats?.completionRate || 0}%</h3>
          <p>Success Rate</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-goals">
          <h2>Active Goals</h2>
          {recentGoals.length > 0 ? (
            recentGoals.map(goal => (
              <div key={goal.goalId} className="goal-preview">
                <h3>{goal.title}</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(goal.currentValue / goal.targetValue) * 100}%` }}
                  />
                </div>
                <p>{goal.currentValue} / {goal.targetValue} {goal.unit}</p>
              </div>
            ))
          ) : (
            <p>No active goals. <Link to="/goals">Create one now!</Link></p>
          )}
          <Link to="/goals" className="view-all-btn">View All Goals →</Link>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <Link to="/gacha" className="action-card gacha-card">
            <div className="action-icon">🎲</div>
            <h3>Pull Gacha</h3>
            <p>Try your luck!</p>
          </Link>
          <Link to="/goals" className="action-card goals-card">
            <div className="action-icon">🎯</div>
            <h3>Set a Goal</h3>
            <p>Start improving</p>
          </Link>
          <Link to="/trade" className="action-card trade-card">
            <div className="action-icon">🤝</div>
            <h3>Trade</h3>
            <p>Exchange characters</p>
          </Link>
          <Link to="/map" className="action-card map-action">
            <div className="action-icon">🗺️</div>
            <h3>Map</h3>
            <p>Find your crew!</p>
           </Link>
        </div>
      </div>

      <div className="level-progress">
        <h2>Level Progress</h2>
        <div className="xp-bar">
          <div 
            className="xp-fill" 
            style={{ width: `${(user?.xp / (user?.level * 100)) * 100}%` }}
          />
        </div>
        <p>{user?.xp} / {user?.level * 100} XP to Level {(user?.level || 0) + 1}</p>
      </div>
    </div>
  );
}

export default Dashboard;
