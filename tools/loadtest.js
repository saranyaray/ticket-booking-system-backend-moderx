const axios = require('axios');

// Simple load test to simulate concurrent booking attempts
// Usage environment variables:
// TARGET_URL - base URL, e.g. http://localhost:3000
// SHOW_ID - id of the show to book (default 1)
// CONCURRENCY - number of parallel requests to fire at once (default 50)
// REQUESTS - total number of requests to send (default 200)
// SEATS - seats per request (default 1)
// USER_BASE - base username prefix

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const SHOW_ID = process.env.SHOW_ID || '1';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const REQUESTS = parseInt(process.env.REQUESTS || '200', 10);
const SEATS = parseInt(process.env.SEATS || '1', 10);
const USER_BASE = process.env.USER_BASE || 'loadtest_user_';

async function singleRequest(i) {
  try {
    const payload = { user_name: USER_BASE + i, seats: SEATS };
    const url = `${TARGET_URL.replace(/\/$/, '')}/shows/${SHOW_ID}/book`;
    const resp = await axios.post(url, payload, { timeout: 15000 });
    return { status: resp.status, data: resp.data };
  } catch (err) {
    if (err.response) return { status: err.response.status, data: err.response.data };
    return { status: 'ERR', error: err.message };
  }
}

async function run() {
  console.log(`Loadtest starting -> target=${TARGET_URL} show=${SHOW_ID} requests=${REQUESTS} concurrency=${CONCURRENCY} seats=${SEATS}`);
  let inFlight = 0;
  let sent = 0;
  let results = [];

  const runNext = async (i) => {
    inFlight++;
    const r = await singleRequest(i);
    results.push(r);
    inFlight--;
    // progress
    if (results.length % 10 === 0) process.stdout.write('.');
  };

  const promises = [];
  for (let i = 0; i < REQUESTS; i++) {
    // throttle concurrency
    while (inFlight >= CONCURRENCY) {
      // small sleep
      await new Promise((r) => setTimeout(r, 10));
    }
    promises.push(runNext(i));
    sent++;
  }

  await Promise.all(promises);
  console.log('\nLoadtest finished.');

  const summary = results.reduce((acc, r) => {
    const key = String(r.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log('Summary:', summary);
}

if (require.main === module) run().catch((e) => { console.error(e); process.exit(1); });
