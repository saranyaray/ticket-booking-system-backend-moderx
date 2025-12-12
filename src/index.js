const express = require('express');
const showsRouter = require('./controllers/shows');
const bookingsRouter = require('./controllers/bookings');
const { startExpiryWorker } = require('./jobs/expiryJob');
const db = require('./db');

const app = express();
// Use Express built-in JSON parser (no need for body-parser)
app.use(express.json());

app.use('/', showsRouter);
app.use('/', bookingsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  
  // Check if database is ready before starting expiry worker
  try {
    const result = await db.query("SELECT 1");
    console.log('Database connection successful');
    // Start expiry worker with default values (30s poll, 2 minutes expiry)
    startExpiryWorker(30, 2);
  } catch (err) {
    console.warn('Database not ready yet, expiry worker will retry on next restart');
    console.warn('Please run migrations: psql $DATABASE_URL -f sql/schema.sql');
  }
});
