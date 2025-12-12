const db = require('../db');

// Expires PENDING bookings older than expiryMinutes and releases reserved seats
async function expirePendingBookings(expiryMinutes = 2) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000).toISOString();
    // Select pending bookings older than cutoff
    const res = await client.query(`SELECT * FROM bookings WHERE status = 'PENDING' AND created_at < $1 FOR UPDATE`, [cutoff]);
    if (res.rowCount === 0) {
      await client.query('COMMIT');
      return 0;
    }

    let totalExpired = 0;
    for (const b of res.rows) {
      // Mark booking as FAILED
      await client.query("UPDATE bookings SET status = 'FAILED' WHERE id = $1", [b.id]);
      // Decrease reserved_seats on show
      await client.query('UPDATE shows SET reserved_seats = GREATEST(reserved_seats - $1, 0) WHERE id = $2', [b.seats, b.show_id]);
      totalExpired += 1;
    }

    await client.query('COMMIT');
    return totalExpired;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // Ignore rollback errors
    }
    // Check if it's a table not found error
    if (err.message && err.message.includes('does not exist')) {
      // Silently ignore - tables haven't been created yet
      return 0;
    }
    console.error('Error in expiry job', err);
    return 0;
  } finally {
    client.release();
  }
}

function startExpiryWorker(intervalSeconds = 30, expiryMinutes = 2) {
  setInterval(async () => {
    try {
      const n = await expirePendingBookings(expiryMinutes);
      if (n > 0) console.log(`Expired ${n} pending bookings`);
    } catch (err) {
      console.error('Expiry worker error', err);
    }
  }, intervalSeconds * 1000);
}

module.exports = { startExpiryWorker, expirePendingBookings };
