// backend/routes/adminStats.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/stats', async (req, res) => {
  try {
    // Fetching counts for users, vehicles, and bookings
    const [users] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [vehicles] = await db.query('SELECT COUNT(*) AS totalVehicles FROM vehicles');
    const [bookings] = await db.query('SELECT COUNT(*) AS totalBookings FROM booking');

    // Create an object to send as response
    const stats = {
      totalUsers: users[0].totalUsers,
      totalVehicles: vehicles[0].totalVehicles,
      totalBookings: bookings[0].totalBookings,
    };

    // Sending stats as a response
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
