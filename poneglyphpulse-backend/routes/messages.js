const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// Send message
router.post('/send', verifyToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create room ID (consistent for both users)
    const roomId = [req.userId, recipientId].sort().join('_');

    const message = new Message({
      sender: req.userId,
      recipient: recipientId,
      content,
      roomId
    });

    await message.save();

    // Emit via socket
    const io = req.app.get('io');
    io.to(roomId).emit('receiveMessage', {
      messageId: message.messageId,
      sender: req.user.username,
      content: message.content,
      timestamp: message.createdAt
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
});

// Get conversation with a user
router.get('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const roomId = [req.userId, otherUserId].sort().join('_');

    const messages = await Message.find({ roomId })
      .populate('sender', 'username profilePic')
      .populate('recipient', 'username profilePic')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching conversation' });
  }
});

// Get all conversations
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.userId }, { recipient: req.userId }]
    })
    .populate('sender', 'username profilePic')
    .populate('recipient', 'username profilePic')
    .sort({ createdAt: -1 });

    // Group by conversation
    const conversations = {};
    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === req.userId 
        ? msg.recipient 
        : msg.sender;
      
      const key = otherUser._id.toString();
      if (!conversations[key]) {
        conversations[key] = {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0
        };
      }
    });

    res.json({ conversations: Object.values(conversations) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching conversations' });
  }
});

// Mark message as read
router.put('/read/:messageId', verifyToken, async (req, res) => {
  try {
    const message = await Message.findOne({ messageId: req.params.messageId });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.recipient.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error marking message as read' });
  }
});

module.exports = router;
