const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Goal = require('../models/Goal');
const User = require('../models/User');

const REWARD_MAP = {
  'Easy': { xp: 50, berries: 100, poneglyphs: 0 },
  'Medium': { xp: 100, berries: 200, poneglyphs: 10 },
  'Hard': { xp: 200, berries: 400, poneglyphs: 25 },
  'Extreme': { xp: 500, berries: 1000, poneglyphs: 50 }
};

// Create new goal
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { title, description, category, difficulty, targetValue, unit, frequency, deadline } = req.body;
    if (!title || !targetValue) {
      return res.status(400).json({ error: 'Title and target value are required' });
    }
    const goal = new Goal({
      userId: req.userId,
      title,
      description,
      category: category || 'Other',
      difficulty: difficulty || 'Medium',
      targetValue,
      unit: unit || 'times',
      frequency: frequency || 'Daily',
      deadline: deadline ? new Date(deadline) : null,
      rewards: REWARD_MAP[difficulty || 'Medium']
    });
    await goal.save();
    res.status(201).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ error: 'Error creating goal' });
  }
});

// Get user's goals
router.get('/my-goals', verifyToken, async (req, res) => {
  try {
    const { completed } = req.query;
    const filter = { userId: req.userId };
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching goals' });
  }
});

// Update goal progress
router.put('/update/:goalId', verifyToken, async (req, res) => {
  try {
    const { currentValue } = req.body;
    const goal = await Goal.findOne({ goalId: req.params.goalId, userId: req.userId });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    goal.currentValue = currentValue;

    if (currentValue >= goal.targetValue && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
      const user = await User.findById(req.userId);
      const levelUpResult = user.addXP(goal.rewards.xp);
      user.currency.berries += goal.rewards.berries;
      user.currency.poneglyphs += goal.rewards.poneglyphs;
      user.stats.totalGoalsCompleted += 1;
      const today = new Date().setHours(0, 0, 0, 0);
      const lastActive = new Date(user.streaks.lastActive).setHours(0, 0, 0, 0);
      const daysSinceLastActive = (today - lastActive) / (1000 * 60 * 60 * 24);

      if (daysSinceLastActive === 1) {
        user.streaks.current += 1;
        if (user.streaks.current > user.streaks.longest) {
          user.streaks.longest = user.streaks.current;
        }
      } else if (daysSinceLastActive > 1) {
        user.streaks.current = 1;
      }
      user.streaks.lastActive = new Date();
      await user.save();
      const io = req.app.get('io');
      io.emit('goalCompleted', {
        userId: user._id,
        username: user.username,
        goal: goal.title,
        rewards: goal.rewards,
        leveledUp: levelUpResult.leveledUp,
        newLevel: levelUpResult.newLevel
      });
      await goal.save();
      return res.json({
        success: true,
        goal,
        rewards: goal.rewards,
        leveledUp: levelUpResult.leveledUp,
        newLevel: levelUpResult.newLevel,
        user: {
          level: user.level,
          xp: user.xp,
          currency: user.currency
        }
      });
    }
    await goal.save();
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ error: 'Error updating goal' });
  }
});

// Delete goal
router.delete('/delete/:goalId', verifyToken, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      goalId: req.params.goalId,
      userId: req.userId
    });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting goal' });
  }
});

// Get goal statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const totalGoals = await Goal.countDocuments({ userId: req.userId });
    const completedGoals = await Goal.countDocuments({ userId: req.userId, completed: true });
    const activeGoals = await Goal.countDocuments({ userId: req.userId, completed: false });
    const user = await User.findById(req.userId);
    res.json({
      stats: {
        total: totalGoals,
        completed: completedGoals,
        active: activeGoals,
        completionRate: totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(1) : 0,
        currentStreak: user.streaks.current,
        longestStreak: user.streaks.longest
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

module.exports = router;
