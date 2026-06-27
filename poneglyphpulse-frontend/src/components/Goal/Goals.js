import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import GoalCard from './GoalCard';
import './Goals.css';

function Goals({ user, setUser }) {
  const [goals, setGoals] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'Other',
    difficulty: 'Medium',
    targetValue: 1,
    unit: 'times',
    frequency: 'Daily',
    deadline: ''
  });

  useEffect(() => {
    fetchGoals();
  }, [filter]);

  const fetchGoals = async () => {
    try {
      const completed = filter === 'completed' ? 'true' : filter === 'active' ? 'false' : undefined;
      const params = completed !== undefined ? { completed } : {};
      const response = await api.get('/goals/my-goals', { params });
      setGoals(response.data.goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/goals/create', newGoal);
      setGoals([response.data.goal, ...goals]);
      setShowCreateForm(false);
      setNewGoal({
        title: '',
        description: '',
        category: 'Other',
        difficulty: 'Medium',
        targetValue: 1,
        unit: 'times',
        frequency: 'Daily',
        deadline: ''
      });
    } catch (error) {
      alert(error.response?.data?.error || 'Error creating goal');
    }
  };

  const handleUpdateGoal = async (goalId, currentValue) => {
    try {
      const response = await api.put(`/goals/update/${goalId}`, { currentValue });
      
      if (response.data.leveledUp) {
        alert(`🎉 Level Up! You reached Level ${response.data.newLevel}!`);
      }
      
      if (response.data.goal.completed) {
        alert(`✅ Goal Completed! +${response.data.rewards.xp} XP, +${response.data.rewards.berries} Berries!`);
      }

      // Update user data
      if (response.data.user) {
        setUser(prev => ({
          ...prev,
          level: response.data.user.level,
          xp: response.data.user.xp,
          currency: response.data.user.currency
        }));
      }

      fetchGoals();
    } catch (error) {
      alert('Error updating goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await api.delete(`/goals/delete/${goalId}`);
      setGoals(goals.filter(g => g.goalId !== goalId));
    } catch (error) {
      alert('Error deleting goal');
    }
  };

  return (
    <div className="goals-page">
      <div className="goals-header">
        <h1>🎯 My Goals</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="create-btn">
          {showCreateForm ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-goal-form">
          <h2>Create New Goal</h2>
          <form onSubmit={handleCreateGoal}>
            <input
              type="text"
              placeholder="Goal Title"
              value={newGoal.title}
              onChange={e => setNewGoal({...newGoal, title: e.target.value})}
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={newGoal.description}
              onChange={e => setNewGoal({...newGoal, description: e.target.value})}
            />
            <div className="form-row">
              <select
                value={newGoal.category}
                onChange={e => setNewGoal({...newGoal, category: e.target.value})}
              >
                <option value="Health">Health</option>
                <option value="Study">Study</option>
                <option value="Fitness">Fitness</option>
                <option value="Productivity">Productivity</option>
                <option value="Personal">Personal</option>
                <option value="Creative">Creative</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={newGoal.difficulty}
                onChange={e => setNewGoal({...newGoal, difficulty: e.target.value})}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Extreme">Extreme</option>
              </select>
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Target"
                value={newGoal.targetValue}
                onChange={e => setNewGoal({...newGoal, targetValue: parseInt(e.target.value)})}
                min="1"
                required
              />
              <input
                type="text"
                placeholder="Unit (e.g., times, hours)"
                value={newGoal.unit}
                onChange={e => setNewGoal({...newGoal, unit: e.target.value})}
              />
            </div>
            <div className="form-row">
              <select
                value={newGoal.frequency}
                onChange={e => setNewGoal({...newGoal, frequency: e.target.value})}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="One-time">One-time</option>
              </select>
              <input
                type="date"
                value={newGoal.deadline}
                onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
              />
            </div>
            <button type="submit" className="submit-btn">Create Goal</button>
          </form>
        </div>
      )}

      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className="goals-grid">
        {goals.length > 0 ? (
          goals.map(goal => (
            <GoalCard
              key={goal.goalId}
              goal={goal}
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
            />
          ))
        ) : (
          <div className="empty-state">
            <p>No goals yet. Create one to start your journey!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Goals;
