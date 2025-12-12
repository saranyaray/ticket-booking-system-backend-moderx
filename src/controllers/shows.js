const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin: create a show
router.post('/admin/shows', async (req, res) => {
  const { name, start_time, total_seats } = req.body;
  if (!name || !start_time || typeof total_seats !== 'number') {
    return res.status(400).json({ error: 'name, start_time and total_seats required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO shows (name, start_time, total_seats) VALUES ($1, $2, $3) RETURNING *`,
      [name, start_time, total_seats]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// List shows with available seats
router.get('/shows', async (req, res) => {
  try {
    const result = await db.query(`SELECT id, name, start_time, total_seats, reserved_seats, (total_seats - reserved_seats) as available_seats FROM shows ORDER BY start_time`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
