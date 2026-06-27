const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Trade = require('../models/Trade');
const User = require('../models/User');

// Create trade offer
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { recipientId, initiatorOffer, recipientOffer, message } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const trade = new Trade({
      initiator: req.userId,
      recipient: recipientId,
      initiatorOffer: initiatorOffer || [],
      recipientOffer: recipientOffer || [],
      message: message || '',
      status: 'pending'
    });

    await trade.save();

    // Notify recipient via socket
    const io = req.app.get('io');
    io.emit('newTradeOffer', {
      tradeId: trade.tradeId,
      from: req.user.username,
      to: recipient.username
    });

    res.status(201).json({ success: true, trade });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Error creating trade' });
  }
});

// Get user's trades
router.get('/my-trades', verifyToken, async (req, res) => {
  try {
    const trades = await Trade.find({
      $or: [{ initiator: req.userId }, { recipient: req.userId }]
    })
    .populate('initiator', 'username profilePic')
    .populate('recipient', 'username profilePic')
    .populate('initiatorOffer.character')
    .populate('recipientOffer.character')
    .sort({ createdAt: -1 });

    res.json({ trades });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching trades' });
  }
});

// Accept trade
router.put('/accept/:tradeId', verifyToken, async (req, res) => {
  try {
    const trade = await Trade.findOne({ tradeId: req.params.tradeId })
      .populate('initiatorOffer.character')
      .populate('recipientOffer.character');

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.recipient.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only recipient can accept trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Trade is no longer pending' });
    }

    // Exchange items
    const initiator = await User.findById(trade.initiator);
    const recipient = await User.findById(trade.recipient);

    // Transfer characters from initiator to recipient
    for (const offer of trade.initiatorOffer) {
      if (offer.character) {
        const itemIndex = initiator.inventory.findIndex(
          item => item.character.toString() === offer.character._id.toString()
        );
        if (itemIndex > -1) {
          initiator.inventory.splice(itemIndex, 1);
          recipient.inventory.push({ character: offer.character._id });
        }
      }
    }

    // Transfer characters from recipient to initiator
    for (const offer of trade.recipientOffer) {
      if (offer.character) {
        const itemIndex = recipient.inventory.findIndex(
          item => item.character.toString() === offer.character._id.toString()
        );
        if (itemIndex > -1) {
          recipient.inventory.splice(itemIndex, 1);
          initiator.inventory.push({ character: offer.character._id });
        }
      }
    }

    // Update stats
    initiator.stats.totalTradesCompleted += 1;
    recipient.stats.totalTradesCompleted += 1;

    await initiator.save();
    await recipient.save();

    trade.status = 'completed';
    await trade.save();

    res.json({ success: true, message: 'Trade completed successfully', trade });
  } catch (error) {
    console.error('Accept trade error:', error);
    res.status(500).json({ error: 'Error accepting trade' });
  }
});

// Reject trade
router.put('/reject/:tradeId', verifyToken, async (req, res) => {
  try {
    const trade = await Trade.findOne({ tradeId: req.params.tradeId });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.recipient.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only recipient can reject trade' });
    }

    trade.status = 'rejected';
    await trade.save();

    res.json({ success: true, message: 'Trade rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Error rejecting trade' });
  }
});

// Cancel trade
router.delete('/cancel/:tradeId', verifyToken, async (req, res) => {
  try {
    const trade = await Trade.findOne({ tradeId: req.params.tradeId });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.initiator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only initiator can cancel trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot cancel non-pending trade' });
    }

    trade.status = 'cancelled';
    await trade.save();

    res.json({ success: true, message: 'Trade cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Error cancelling trade' });
  }
});

module.exports = router;
