const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  tradeId: {
    type: String,
    unique: true,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatorOffer: [{
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character'
    },
    currency: {
      berries: { type: Number, default: 0 },
      poneglyphs: { type: Number, default: 0 }
    }
  }],
  recipientOffer: [{
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character'
    },
    currency: {
      berries: { type: Number, default: 0 },
      poneglyphs: { type: Number, default: 0 }
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

tradeSchema.index({ initiator: 1, recipient: 1, status: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
