# Design Notes: Ticket Booking System

This document outlines high-level design choices, scaling considerations, and concurrency mechanisms used in the sample ticket booking backend.

1. High-level architecture
- Express.js API layer: receives requests from clients (web, mobile)
- Postgres DB: single source of truth for shows and bookings
- Background worker (in-process) to expire PENDING bookings older than 2 minutes

For production, you would split the API servers behind a load balancer, and run background workers independently (e.g., in separate worker processes or use a queue).

2. Database design
- shows(id, name, start_time, total_seats, reserved_seats)
  - reserved_seats stores the number of seats currently allocated (PENDING+CONFIRMED)
- bookings(id, show_id, user_name, seats, status, created_at)
  - status: PENDING, CONFIRMED, FAILED

Scaling with Postgres:
- Vertical scale for a while (bigger machines)
- Read replicas for read-heavy endpoints (GET /shows) and cache list via Redis
- Partitioning / sharding by show_id for very large scale
- Use connection pooling (pg pool) and tune max connections

3. Concurrency control
- We rely on Postgres transactions with SELECT ... FOR UPDATE to obtain a row-level lock on the show row being modified.
- Booking flow:
  1. BEGIN transaction
  2. SELECT show FOR UPDATE
  3. Check available seats (total_seats - reserved_seats)
  4. If available, UPDATE shows SET reserved_seats = reserved_seats + N
  5. INSERT booking with status PENDING
  6. COMMIT

This ensures multiple concurrent booking requests serialize at the row-level, preventing overbooking.

For other approaches:
- Use optimistic locking (version column) and retry on conflicts. Good if contention is low.
- Use an external distributed lock or Redis with Lua script (in extreme scale).
- Move seat allocation to a dedicated service/queue to serialize allocation.

4. Caching
- Cache show list (metadata) in Redis, invalidate when seat counts change or use short TTL.
- Use read replicas for reporting endpoints.

5. Message queue
- Use a queue (e.g., RabbitMQ, Kafka) to decouple confirmation and notifications. Example: when payment completes, publish a confirm event consumed by the booking service.

6. Booking expiry and reliability
- The sample includes an in-process expiry worker that marks PENDING bookings older than 2 minutes as FAILED and releases reserved seats.
- In production, run expiry as a separate worker, or use a job scheduler or time-ordered queue (e.g., delayed messages).

7. Observability and monitoring
- Track metrics for bookings/sec, failed/expired bookings, DB contention (lock waits), latency.
- Add logging, distributed tracing, and alerts for high lock wait times

8. Security and validation
- Validate inputs and limit max seats per booking
- Authentication and authorization for admin endpoints
- Rate-limit booking endpoints to prevent abuse

9. Next improvements
- Add payment integration and asynchronous confirmation
- Add seat-level allocation (e.g., seat numbers) with per-seat locking
- Introduce domain-specific events and CQRS for heavy-read scenarios

