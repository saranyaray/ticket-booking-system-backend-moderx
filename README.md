# Ticket Booking System (Backend)

A production-ready Node.js + Express + Postgres backend demonstrating concurrency-safe seat booking for shows/trips/slots, similar to RedBus, BookMyShow, or Doctor appointment systems.

## Features
- ✅ Admin API: create shows/trips/slots with seat capacity
- ✅ User API: list shows and book seats atomically
- ✅ Concurrency-safe: Postgres transactions + row-level locking prevent overbooking
- ✅ Booking workflow: PENDING → CONFIRMED (or FAILED)
- ✅ Auto-expiry: PENDING bookings expire after 2 minutes, releasing seats
- ✅ Feature flags: model/config management for rollouts
- ✅ Load testing: built-in concurrency test with DB assertions
- ✅ Docker: containerized setup with Docker Compose
- ✅ CI/CD: GitHub Actions pipeline for automated testing and deployment
- ✅ Full documentation: API, design, deployment guides

## Quick Links
- [API Documentation](docs/api.md)
- [Design & Architecture](docs/design.md)
- [🌐 Deploy to Render - Step 1: PostgreSQL](docs/RENDER_POSTGRES_SETUP.md) ✅ **Done**
- [🌐 Deploy to Render - Step 2: Web Service](docs/RENDER_WEBSERVICE_SETUP.md) ← **Next**
- [Deployment Guide](docs/deployment.md)
- [Postman Collection](postman_collection.json)

---

## Quick Setup (Windows / PowerShell)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm

### 1. Configure Database Connection
```powershell
$env:PGHOST = 'localhost'
$env:PGUSER = 'postgres'
$env:PGPASSWORD = 'your_password'
$env:PGDATABASE = 'ticketdb'
$env:PGPORT = '5432'
```

### 2. Create Database & Run Migrations
```powershell
psql -h $env:PGHOST -U $env:PGUSER -c "CREATE DATABASE $env:PGDATABASE;"
psql -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -f .\sql\schema.sql
psql -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -f .\sql\feature_flags.sql
```

### 3. Install & Start
```powershell
npm install
npm start
```

Server runs on `http://localhost:3000`

---

## Docker Setup

### Quick Start with Docker Compose
```powershell
docker-compose up -d
docker-compose logs -f api    # watch logs
docker-compose down           # stop all
```

---

## Testing

### Concurrency Test (validates no overbooking)
```powershell
npm run test:concurrency
```

### Load Test
```powershell
npm run loadtest
```

---

## API Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/shows` | Create a show |
| GET | `/shows` | List shows |
| POST | `/shows/:id/book` | Book seats |
| GET | `/bookings/:id` | Get booking status |
| POST | `/bookings/:id/confirm` | Confirm booking |

See [docs/api.md](docs/api.md) for full endpoint documentation.

---

## Example Usage

```powershell
# Create a show
curl -X POST http://localhost:3000/admin/shows \
  -H "Content-Type: application/json" \
  -d '{"name":"Bus A","start_time":"2025-12-13T08:00:00Z","total_seats":40}'

# List shows
curl http://localhost:3000/shows

# Book 2 seats
curl -X POST http://localhost:3000/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{"user_name":"Alice","seats":2}'

# Confirm booking
curl -X POST http://localhost:3000/bookings/1/confirm
```

---

## Deployment

Guides for Docker, Kubernetes, cloud platforms, and more: See [docs/deployment.md](docs/deployment.md)

### Canary Rollout Example
```sql
-- 1% rollout
INSERT INTO feature_flags (key, value)
VALUES ('ai:model', '{"model":"claude-haiku-4.5","percent":1}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## Architecture

### Concurrency Control
- PostgreSQL transactions with SELECT ... FOR UPDATE
- Row-level locking prevents race conditions
- Bookings serialized per show
- Guarantee: total allocated seats ≤ total_seats

### Booking States
```
[PENDING] → [CONFIRMED] (after user confirmation)
[PENDING] → [FAILED]    (after 2 minute expiry or if no seats)
```

See [docs/design.md](docs/design.md) for detailed architecture and scaling strategies.

---

## Scripts

```powershell
npm start                # Start server
npm run dev              # Start with auto-reload
npm run loadtest         # Run load test
npm run test:concurrency # Run concurrency test with DB assertions
npm test                 # Run unit tests
```

---

## Project Structure

```
src/
  ├── index.js              (Express app)
  ├── db.js                 (DB connection)
  ├── config/model.js       (Feature flags)
  ├── controllers/
  │   ├── shows.js          (Admin/list)
  │   └── bookings.js       (Book/confirm)
  └── jobs/expiryJob.js     (Auto-expire bookings)

sql/
  ├── schema.sql            (Tables)
  └── feature_flags.sql     (Config table)

tools/
  ├── loadtest.js           (Load test)
  └── concurrency-test.js   (Concurrency test)

docs/
  ├── api.md                (API reference)
  ├── design.md             (Architecture)
  └── deployment.md         (Deploy guides)

.github/workflows/ci-cd.yml  (GitHub Actions)
docker-compose.yml
Dockerfile
```

---

## Environment Variables

```env
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=ticketdb
PGPORT=5432
PORT=3000
NODE_ENV=development
AI_MODEL=claude-4-mini
```

See `.env.example` for a template.

---

## Security Checklist

- [ ] Add input validation
- [ ] Add authentication (JWT/API key)
- [ ] Add rate limiting
- [ ] Enable HTTPS in production
- [ ] Store secrets in vault
- [ ] Regular dependency audits

---

## Support

For issues or questions, create an issue in the repository.

## License

MIT
