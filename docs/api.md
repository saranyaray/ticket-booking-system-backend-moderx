# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Currently, no authentication is required. In production, add JWT or API key authentication.

---

## Admin Endpoints

### Create Show

**Endpoint**: `POST /admin/shows`

**Description**: Create a new show/trip/slot (admin only)

**Request Body**:
```json
{
  "name": "Evening Concert",
  "start_time": "2025-12-12T19:00:00Z",
  "total_seats": 100
}
```

**Parameters**:
- `name` (string, required): Name of the show/trip/doctor
- `start_time` (ISO 8601 string, required): Show start time
- `total_seats` (integer, required): Total number of available seats

**Response** (201 Created):
```json
{
  "id": 1,
  "name": "Evening Concert",
  "start_time": "2025-12-12T19:00:00.000Z",
  "total_seats": 100,
  "reserved_seats": 0
}
```

**Error Responses**:
- `400 Bad Request`: Missing or invalid parameters
- `500 Internal Server Error`: Database error

**Example**:
```bash
curl -X POST http://localhost:3000/admin/shows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Bus",
    "start_time": "2025-12-13T08:00:00Z",
    "total_seats": 40
  }'
```

---

## User Endpoints

### List Shows

**Endpoint**: `GET /shows`

**Description**: Get all available shows with seat availability

**Query Parameters**: None

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Evening Concert",
    "start_time": "2025-12-12T19:00:00.000Z",
    "total_seats": 100,
    "reserved_seats": 25,
    "available_seats": 75
  },
  {
    "id": 2,
    "name": "Morning Bus",
    "start_time": "2025-12-13T08:00:00.000Z",
    "total_seats": 40,
    "reserved_seats": 15,
    "available_seats": 25
  }
]
```

**Example**:
```bash
curl http://localhost:3000/shows
```

---

### Book Seats

**Endpoint**: `POST /shows/:id/book`

**Description**: Attempt to book seats for a show (concurrency-safe)

**URL Parameters**:
- `id` (integer): Show ID

**Request Body**:
```json
{
  "user_name": "Alice",
  "seats": 2
}
```

**Parameters**:
- `user_name` (string, required): Name of the user booking
- `seats` (integer, required): Number of seats to book (must be > 0)

**Response** (201 Created):
```json
{
  "id": 5,
  "show_id": 1,
  "user_name": "Alice",
  "seats": 2,
  "status": "PENDING",
  "created_at": "2025-12-12T15:30:00.000Z"
}
```

**Response on failure** (409 Conflict - not enough seats):
```json
{
  "error": "Not enough seats available",
  "booking": {
    "id": 6,
    "show_id": 1,
    "user_name": "Bob",
    "seats": 5,
    "status": "FAILED",
    "created_at": "2025-12-12T15:31:00.000Z"
  }
}
```

**Booking Statuses**:
- `PENDING`: Booking created, waiting for confirmation
- `CONFIRMED`: User confirmed the booking (simulating payment)
- `FAILED`: Not enough seats available or booking expired

**Error Responses**:
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Show not found
- `409 Conflict`: Not enough available seats
- `500 Internal Server Error`: Database error

**Notes**:
- Bookings are created in `PENDING` status
- If no seats available, a `FAILED` booking is created automatically
- PENDING bookings expire after 2 minutes and are automatically converted to FAILED
- This endpoint uses database-level row locking (SELECT ... FOR UPDATE) to prevent race conditions

**Example**:
```bash
curl -X POST http://localhost:3000/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Alice",
    "seats": 2
  }'
```

---

## Booking Endpoints

### Get Booking Status

**Endpoint**: `GET /bookings/:id`

**Description**: Get the status of a booking

**URL Parameters**:
- `id` (integer): Booking ID

**Response** (200 OK):
```json
{
  "id": 5,
  "show_id": 1,
  "user_name": "Alice",
  "seats": 2,
  "status": "PENDING",
  "created_at": "2025-12-12T15:30:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Database error

**Example**:
```bash
curl http://localhost:3000/bookings/5
```

---

### Confirm Booking

**Endpoint**: `POST /bookings/:id/confirm`

**Description**: Confirm a PENDING booking (simulates payment completion)

**URL Parameters**:
- `id` (integer): Booking ID

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "id": 5,
  "show_id": 1,
  "user_name": "Alice",
  "seats": 2,
  "status": "CONFIRMED",
  "created_at": "2025-12-12T15:30:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Booking is not in PENDING status
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Database error

**Notes**:
- Only PENDING bookings can be confirmed
- Once confirmed, booking status is final
- Reserved seats remain allocated after confirmation

**Example**:
```bash
curl -X POST http://localhost:3000/bookings/5/confirm
```

---

## Concurrency Guarantees

This API prevents overbooking using PostgreSQL row-level locking:

1. **Atomic Booking Operation**:
   - BEGIN transaction
   - SELECT show FOR UPDATE (acquires exclusive lock)
   - Check available seats
   - UPDATE reserved_seats if seats available
   - INSERT booking record
   - COMMIT

2. **Race Condition Prevention**:
   - Multiple concurrent requests for the same show are serialized at the database level
   - Total allocated seats can never exceed total_seats

3. **Example Scenario**:
   - Show has 40 total seats, 38 reserved, 2 available
   - User A requests 2 seats at same time as User B requests 3 seats
   - Transaction 1 (A): locks show, sees 2 available, reserves 2, commits
   - Transaction 2 (B): waits for lock, now sees 0 available, booking fails
   - Result: A confirmed, B failed (correct)

---

## Rate Limiting (Future)

Currently no rate limiting. In production, add:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1702440000
```

---

## Error Handling

All error responses follow this format:
```json
{
  "error": "Human-readable error message"
}
```

Common HTTP Status Codes:
- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or parameters
- `404 Not Found`: Resource not found
- `409 Conflict`: Cannot complete request (e.g., not enough seats)
- `500 Internal Server Error`: Unexpected server error

---

## Testing with Postman

1. Import `postman_collection.json` into Postman
2. Update the `base_url` variable to your server URL
3. Run requests in order:
   - Create Show
   - List Shows
   - Book Seats
   - Get Booking Status
   - Confirm Booking

---

## Testing Concurrency

Run the concurrency test to validate no overbooking:

```bash
npm run test:concurrency
```

This will:
1. Create a test show with 100 seats
2. Fire 500 concurrent booking requests
3. Validate that total confirmed + pending never exceeds 100
4. Display results summary

