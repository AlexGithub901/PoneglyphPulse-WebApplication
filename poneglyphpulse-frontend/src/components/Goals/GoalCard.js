import React, { useState } from 'react';
import './Goals.css';

function GoalCard({ goal, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [newValue, setNewValue] = useState(goal.currentValue);

  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Easy': '#4caf50',
      'Medium': '#2196f3',
      'Hard': '#ff9800',
      'Extreme': '#f44336'
    };
    return colors[difficulty];
  };

  const handleUpdate = () => {
    onUpdate(goal.goalId, newValue);
    setEditing(false);
  };

  return (
    <div className={`goal-card ${goal.completed ? 'completed' : ''}`}>
      <div className="goal-header">
        <h3>{goal.title}</h3>
        <span 
          className="difficulty-badge" 
          style={{ background: getDifficultyColor(goal.difficulty) }}
        >
          {goal.difficulty}
        </span>
      </div>

      {goal.description && <p className="goal-description">{goal.description}</p>}

      <div className="goal-meta">
        <span className="category">{goal.category}</span>
        <span className="frequency">{goal.frequency}</span>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="progress-text">
          {goal.currentValue} / {goal.targetValue} {goal.unit} ({progress.toFixed(0)}%)
        </p>
      </div>

      {!goal.completed && (
        <div className="goal-actions">
          {editing ? (
            <div className="edit-mode">
              <input
                type="number"
                value={newValue}
                onChange={e => setNewValue(parseInt(e.target.value))}
                min="0"
                max={goal.targetValue}
              />
              <button onClick={handleUpdate} className="save-btn">✓</button>
              <button onClick={() => setEditing(false)} className="cancel-btn">✕</button>
            </div>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="update-btn">
                Update Progress
              </button>
              <button onClick={() => onDelete(goal.goalId)} className="delete-btn">
                🗑️
              </button>
            </>
          )}
        </div>
      )}

      {goal.completed && (
        <div className="completed-badge">
          ✅ Completed!
        </div>
      )}

      <div className="goal-rewards">
        <span>🎖️ {goal.rewards.xp} XP</span>
        <span>🪙 {goal.rewards.berries} Berries</span>
        {goal.rewards.poneglyphs > 0 && (
          <span>📜 {goal.rewards.poneglyphs} Poneglyphs</span>
        )}
      </div>
    </div>
  );
}

export default GoalCard;
