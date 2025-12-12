const express = require('express');
const bodyParser = require('body-parser');
const showsRouter = require('./controllers/shows');
const bookingsRouter = require('./controllers/bookings');
const { startExpiryWorker } = require('./jobs/expiryJob');

const app = express();
app.use(bodyParser.json());

app.use('/', showsRouter);
app.use('/', bookingsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  // Start expiry worker with default values (30s poll, 2 minutes expiry)
  startExpiryWorker(30, 2);
});
