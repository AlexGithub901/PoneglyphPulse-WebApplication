const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Character = require('../models/Character');

// Gacha drop rates (must sum to 100%)
const GACHA_RATES = [
  { rarity: 'Common', rate: 40.0 },
  { rarity: 'Uncommon', rate: 30.0 },
  { rarity: 'Rare', rate: 20.0 },
  { rarity: 'Epic', rate: 7.0 },
  { rarity: 'Legendary', rate: 2.5 },
  { rarity: 'Mythic', rate: 0.4 },
  { rarity: 'Secret', rate: 0.1 }
];

const SINGLE_PULL_COST = 100;
const MULTI_PULL_COST = 900;
const PITY_THRESHOLD = 90;

function rollRarity(pityCounter) {
  if (pityCounter >= PITY_THRESHOLD) {
    return 'Legendary';
  }
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const tier of GACHA_RATES) {
    cumulative += tier.rate;
    if (roll <= cumulative) {
      return tier.rarity;
    }
  }
  return 'Common';
}

router.post('/pull/single', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.currency.poneglyphs < SINGLE_PULL_COST) {
      return res.status(400).json({ 
        error: 'Insufficient Poneglyphs',
        required: SINGLE_PULL_COST,
        current: user.currency.poneglyphs
      });
    }
    user.currency.poneglyphs -= SINGLE_PULL_COST;
    user.pityCounter += 1;
    user.stats.totalGachaPulls += 1;
    const selectedRarity = rollRarity(user.pityCounter);

    if (['Legendary', 'Mythic', 'Secret'].includes(selectedRarity)) {
      user.pityCounter = 0;
    }
    const characters = await Character.find({ rarity: selectedRarity });
    if (characters.length === 0) {
      return res.status(500).json({ error: 'No characters available for this rarity' });
    }
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    user.inventory.push({
      character: randomCharacter._id,
      acquiredAt: new Date()
    });
    await user.save();
    const io = req.app.get('io');
    io.emit('gachaPull', {
      userId: user._id,
      character: randomCharacter,
      rarity: selectedRarity
    });
    res.json({
      success: true,
      character: randomCharacter,
      pityCounter: user.pityCounter,
      currency: user.currency,
      isNew: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Error performing gacha pull' });
  }
});

router.post('/pull/multi', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.currency.poneglyphs < MULTI_PULL_COST) {
      return res.status(400).json({ 
        error: 'Insufficient Poneglyphs for multi-pull',
        required: MULTI_PULL_COST,
        current: user.currency.poneglyphs
      });
    }
    user.currency.poneglyphs -= MULTI_PULL_COST;
    const results = [];
    for (let i = 0; i < 10; i++) {
      user.pityCounter += 1;
      const selectedRarity = rollRarity(user.pityCounter);
      if (['Legendary', 'Mythic', 'Secret'].includes(selectedRarity)) {
        user.pityCounter = 0;
      }
      const characters = await Character.find({ rarity: selectedRarity });
      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
      user.inventory.push({
        character: randomCharacter._id,
        acquiredAt: new Date()
      });
      results.push(randomCharacter);
    }
    user.stats.totalGachaPulls += 10;
    await user.save();
    res.json({
      success: true,
      characters: results,
      pityCounter: user.pityCounter,
      currency: user.currency
    });
  } catch (error) {
    res.status(500).json({ error: 'Error performing multi-pull' });
  }
});

router.get('/inventory', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('inventory.character');
    res.json({ inventory: user.inventory });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory' });
  }
});

router.get('/rates', (req, res) => {
  res.json({ rates: GACHA_RATES, pityCost: SINGLE_PULL_COST, multiCost: MULTI_PULL_COST });
});

module.exports = router;
