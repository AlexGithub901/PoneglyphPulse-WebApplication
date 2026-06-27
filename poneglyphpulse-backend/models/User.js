const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profilePic: {
    type: String,
    default: 'https://i.imgur.com/6VBx3io.png'
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  avatarStyle: {
    type: String,
    default: 'luffy',
    enum: ['luffy', 'zoro', 'nami', 'sanji', 'chopper', 'robin', 'franky', 'brook', 'jinbe']
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  inventory: [{
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character'
    },
    acquiredAt: {
      type: Date,
      default: Date.now
    },
    favorite: {
      type: Boolean,
      default: false
    }
  }],
  currency: {
    berries: { 
      type: Number, 
      default: 1000,
      min: 0
    },
    poneglyphs: { 
      type: Number, 
      default: 100,
      min: 0
    }
  },
  premium: {
    type: Boolean,
    default: false
  },
  pityCounter: {
    type: Number,
    default: 0,
    min: 0
  },
  streaks: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  stats: {
    totalGoalsCompleted: { type: Number, default: 0 },
    totalGachaPulls: { type: Number, default: 0 },
    totalTradesCompleted: { type: Number, default: 0 }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.index({ location: '2dsphere' });
userSchema.index({ username: 1, email: 1 });

userSchema.methods.xpToNextLevel = function() {
  return this.level * 100;
};

userSchema.methods.addXP = function(amount) {
  this.xp += amount;
  const xpRequired = this.xpToNextLevel();
  
  if (this.xp >= xpRequired) {
    this.level += 1;
    this.xp -= xpRequired;
    return { leveledUp: true, newLevel: this.level };
  }
  return { leveledUp: false };
};

module.exports = mongoose.model('User', userSchema);
