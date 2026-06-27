const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  goalId: {
    type: String,
    unique: true,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['Health', 'Study', 'Fitness', 'Productivity', 'Personal', 'Creative', 'Social', 'Other'],
    default: 'Other'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Extreme'],
    default: 'Medium'
  },
  targetValue: {
    type: Number,
    required: true,
    min: 1
  },
  currentValue: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    default: 'times'
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'One-time'],
    default: 'Daily'
  },
  deadline: {
    type: Date
  },
  rewards: {
    xp: { type: Number, default: 50, min: 0 },
    berries: { type: Number, default: 100, min: 0 },
    poneglyphs: { type: Number, default: 0, min: 0 }
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  reminder: {
    enabled: { type: Boolean, default: false },
    time: { type: String }
  }
}, {
  timestamps: true
});

goalSchema.index({ userId: 1, completed: 1 });

goalSchema.methods.getProgress = function() {
  return Math.min((this.currentValue / this.targetValue) * 100, 100);
};

module.exports = mongoose.model('Goal', goalSchema);
