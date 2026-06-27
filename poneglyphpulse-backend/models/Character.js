const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  characterId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    default: ''
  },
  rarity: {
    type: String,
    enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret'],
    required: true
  },
  stats: {
    strength: { type: Number, default: 10, min: 1, max: 100 },
    speed: { type: Number, default: 10, min: 1, max: 100 },
    durability: { type: Number, default: 10, min: 1, max: 100 },
    haki: { type: Number, default: 0, min: 0, max: 100 }
  },
  devilFruit: {
    name: { type: String, default: '' },
    type: { type: String, enum: ['Paramecia', 'Zoan', 'Logia', 'None'], default: 'None' }
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  marketValue: {
    type: Number,
    required: true,
    min: 0
  },
  dropRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  series: {
    type: String,
    default: 'One Piece'
  },
  bounty: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

characterSchema.index({ rarity: 1, name: 1 });

module.exports = mongoose.model('Character', characterSchema);
