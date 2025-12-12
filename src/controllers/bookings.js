const express = require('express');
const router = express.Router();
const db = require('../db');

// Book seats for a show - concurrency safe using transaction + SELECT FOR UPDATE
router.post('/shows/:id/book', async (req, res) => {
  const showId = parseInt(req.params.id, 10);
  const { user_name, seats } = req.body;
  if (!user_name || typeof seats !== 'number' || seats <= 0) {
    return res.status(400).json({ error: 'user_name and seats (>0) required' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Lock the show row
    const showRes = await client.query('SELECT * FROM shows WHERE id = $1 FOR UPDATE', [showId]);
    if (showRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Show not found' });
    }
    const show = showRes.rows[0];
    const available = show.total_seats - show.reserved_seats;

    if (available < seats) {
      // Not enough seats -> create a FAILED booking record (optional) or simply return failure
      const failRes = await client.query(
        `INSERT INTO bookings (show_id, user_name, seats, status) VALUES ($1, $2, $3, 'FAILED') RETURNING *`,
        [showId, user_name, seats]
      );
      await client.query('COMMIT');
      return res.status(409).json({ error: 'Not enough seats available', booking: failRes.rows[0] });
    }

    // Reserve seats by incrementing reserved_seats and insert a PENDING booking
    const newReserved = show.reserved_seats + seats;
    await client.query('UPDATE shows SET reserved_seats = $1 WHERE id = $2', [newReserved, showId]);
    const bookingRes = await client.query(
      `INSERT INTO bookings (show_id, user_name, seats, status) VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
      [showId, user_name, seats]
    );

    await client.query('COMMIT');
    res.status(201).json(bookingRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  } finally {
    client.release();
  }
});

// Confirm a PENDING booking (e.g., after payment)
router.post('/bookings/:id/confirm', async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const bRes = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [bookingId]);
    if (bRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bRes.rows[0];
    if (booking.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Booking is not PENDING (current: ${booking.status})` });
    }

    // Mark as CONFIRMED
    const upd = await client.query("UPDATE bookings SET status = 'CONFIRMED' WHERE id = $1 RETURNING *", [bookingId]);
    await client.query('COMMIT');
    res.json(upd.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  } finally {
    client.release();
  }
});

// Get booking status
router.get('/bookings/:id', async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  try {
    const result = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
