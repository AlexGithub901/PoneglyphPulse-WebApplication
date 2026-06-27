const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');

// Update user location
router.put('/update', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const user = await User.findById(req.userId);
    user.location.coordinates = [longitude, latitude];
    user.location.lastUpdated = new Date();
    await user.save();

    // Broadcast location update
    const io = req.app.get('io');
    io.emit('userLocationUpdate', {
      userId: user._id,
      username: user.username,
      coordinates: [longitude, latitude]
    });

    res.json({ success: true, location: user.location });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Error updating location' });
  }
});

// Get nearby users
router.get('/nearby', verifyToken, async (req, res) => {
  try {
    const { maxDistance = 5000 } = req.query; // Default 5km
    const user = await User.findById(req.userId);

    if (!user.location.coordinates[0] || !user.location.coordinates[1]) {
      return res.status(400).json({ error: 'Your location is not set' });
    }

    const nearbyUsers = await User.find({
      _id: { $ne: req.userId },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
    .select('username profilePic level location')
    .limit(50);

    res.json({ nearbyUsers });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ error: 'Error fetching nearby users' });
  }
});

// Get user location
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username profilePic location');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ location: user.location });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user location' });
  }
});

module.exports = router;
