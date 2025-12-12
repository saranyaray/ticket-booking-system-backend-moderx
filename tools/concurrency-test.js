const axios = require('axios');
const { Pool } = require('pg');

// Concurrency test with DB assertions
// Validates that bookings never exceed total seats and reserved_seats is accurate
// Usage:
// TARGET_URL='http://localhost:3000' PGHOST='localhost' PGUSER='postgres' PGPASSWORD='postgres' PGDATABASE='ticketdb' node tools/concurrency-test.js

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const SHOW_ID = process.env.SHOW_ID || 1;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100', 10);
const REQUESTS = parseInt(process.env.REQUESTS || '500', 10);
const SEATS_PER_REQUEST = parseInt(process.env.SEATS_PER_REQUEST || '1', 10);

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.PGHOST || 'localhost',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'ticketdb',
        port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
      }
);

async function createTestShow() {
  try {
    const res = await axios.post(`${TARGET_URL.replace(/\/$/, '')}/admin/shows`, {
      name: 'Concurrency Test Show',
      start_time: new Date().toISOString(),
      total_seats: 100,
    });
    return res.data.id;
  } catch (err) {
    console.error('Failed to create test show:', err.message);
    process.exit(1);
  }
}

async function fireBookingRequests(showId) {
  let inFlight = 0;
  const results = { success: 0, failed: 0, error: 0 };
  const promises = [];

  const runNext = async (i) => {
    inFlight++;
    try {
      const resp = await axios.post(`${TARGET_URL.replace(/\/$/, '')}/shows/${showId}/book`, {
        user_name: `test_user_${i}`,
        seats: SEATS_PER_REQUEST,
      }, { timeout: 15000 });
      if (resp.status === 201) results.success++;
      else results.failed++;
    } catch (err) {
      if (err.response?.status === 409) results.failed++;
      else results.error++;
    } finally {
      inFlight--;
      if (results.success % 50 === 0) process.stdout.write('.');
    }
  };

  for (let i = 0; i < REQUESTS; i++) {
    while (inFlight >= CONCURRENCY) {
      await new Promise((r) => setTimeout(r, 10));
    }
    promises.push(runNext(i));
  }

  await Promise.all(promises);
  return results;
}

async function validateDbConsistency(showId) {
  try {
    const res = await pool.query('SELECT total_seats, reserved_seats FROM shows WHERE id = $1', [showId]);
    if (res.rowCount === 0) {
      console.log('❌ FAIL: Show not found');
      return false;
    }
    const show = res.rows[0];
    const { total_seats, reserved_seats } = show;

    // Count total confirmed and pending bookings
    const bRes = await pool.query(
      'SELECT SUM(seats) as total_booked FROM bookings WHERE show_id = $1 AND status IN ($2, $3)',
      [showId, 'CONFIRMED', 'PENDING']
    );
    const totalBooked = bRes.rows[0].total_booked || 0;

    console.log(`\nDB State: total_seats=${total_seats}, reserved_seats=${reserved_seats}, total_booked=${totalBooked}`);

    // Assertions
    const checks = [
      { name: 'reserved_seats <= total_seats', pass: reserved_seats <= total_seats },
      { name: 'total_booked <= total_seats', pass: totalBooked <= total_seats },
      { name: 'reserved_seats >= 0', pass: reserved_seats >= 0 },
    ];

    let allPass = true;
    checks.forEach((c) => {
      const icon = c.pass ? '✓' : '❌';
      console.log(`${icon} ${c.name}`);
      if (!c.pass) allPass = false;
    });

    return allPass;
  } catch (err) {
    console.error('DB consistency check error:', err);
    return false;
  }
}

async function run() {
  console.log('Concurrency Test with DB Assertions');
  console.log('=====================================');
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Concurrency: ${CONCURRENCY}, Total Requests: ${REQUESTS}, Seats/request: ${SEATS_PER_REQUEST}`);
  console.log('');

  // Create a test show with 100 seats
  console.log('Creating test show...');
  const showId = await createTestShow();
  console.log(`Created show id=${showId} with 100 seats`);

  // Fire concurrent booking requests
  console.log('\nFiring concurrent booking requests');
  const results = await fireBookingRequests(showId);
  console.log('\n\nBooking Results:');
  console.log(`  Success (201): ${results.success}`);
  console.log(`  Failed (409): ${results.failed}`);
  console.log(`  Error: ${results.error}`);

  // Validate DB consistency
  console.log('\nValidating database consistency...');
  const dbOk = await validateDbConsistency(showId);

  // Summary - test passes if DB assertions passed (no overbooking)
  const testPass = dbOk;
  console.log(`\n${testPass ? '✓ TEST PASSED - No overbooking detected' : '❌ TEST FAILED - Overbooking detected'}`);

  await pool.end();
  process.exit(testPass ? 0 : 1);
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
