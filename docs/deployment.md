# Deployment Guide

This document covers deploying the Ticket Booking System to various environments.

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Setup Steps

1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
3. Create Postgres database and user:
   ```sql
   CREATE DATABASE ticketdb;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE ticketdb TO postgres;
   ```
4. Run migrations:
   ```bash
   psql -h localhost -U postgres -d ticketdb -f sql/schema.sql
   psql -h localhost -U postgres -d ticketdb -f sql/feature_flags.sql
   ```
5. Install dependencies:
   ```bash
   npm install
   ```
6. Start development server:
   ```bash
   npm run dev
   ```
7. Server will be available at `http://localhost:3000`

## Docker / Docker Compose

### Quick Start

1. Ensure Docker and Docker Compose are installed
2. From project root:
   ```bash
   docker-compose up -d
   ```
3. Services will start:
   - PostgreSQL: localhost:5432
   - API: localhost:3000
4. Check logs:
   ```bash
   docker-compose logs -f api
   ```
5. Stop services:
   ```bash
   docker-compose down
   ```

### Production Docker Build

```bash
docker build -t ticket-booking-backend:1.0 .
docker tag ticket-booking-backend:1.0 your-registry.azurecr.io/ticket-booking-backend:1.0
docker push your-registry.azurecr.io/ticket-booking-backend:1.0
```

## Kubernetes Deployment

### Prerequisites
- kubectl configured for your cluster
- Docker image pushed to registry
- PostgreSQL instance (managed or in-cluster)

### Example Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ticket-booking-api
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ticket-booking-api
  template:
    metadata:
      labels:
        app: ticket-booking-api
    spec:
      containers:
      - name: api
        image: your-registry.azurecr.io/ticket-booking-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: PGHOST
          valueFrom:
            configMapKeyRef:
              name: db-config
              key: host
        - name: PGUSER
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: PGDATABASE
          valueFrom:
            configMapKeyRef:
              name: db-config
              key: database
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /shows
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /shows
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: ticket-booking-api
spec:
  selector:
    app: ticket-booking-api
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

Apply the deployment:
```bash
kubectl apply -f k8s/deployment.yaml
```

### Canary Deployment (Model Rollout)

1. Create a canary deployment with new model:
   ```bash
   kubectl set env deployment/ticket-booking-api AI_MODEL=claude-haiku-4.5
   ```

2. Route small traffic percentage to canary:
   ```bash
   kubectl patch service ticket-booking-api -p '{"spec":{"selector":{"version":"canary"}}}'
   ```

3. Monitor metrics for 5-10 minutes

4. Promote to full rollout if healthy

## CI/CD with GitHub Actions

The `.github/workflows/ci-cd.yml` pipeline runs on push to `main` and `develop`:

1. **Lint and Test**: Runs linting, unit tests, and concurrency tests
2. **Build Docker**: Builds and caches Docker image
3. **Deploy Staging**: Auto-deploys from `develop` branch
4. **Deploy Production**: Auto-deploys from `main` branch after tests pass

To enable deployments, add secrets to GitHub:
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub token
- `KUBE_CONFIG`: Base64-encoded kubeconfig (for K8s deployments)
- `DEPLOY_SSH_KEY`: SSH key for server deployments

## Environment-Specific Configuration

### Development
- No scaling required
- Single Postgres instance sufficient
- Feature flags can be tested via table updates

### Staging
- Similar to production but smaller scale
- All feature flag changes tested here first
- Smoke tests automated

### Production
- Multi-instance API (3+ replicas)
- Managed Postgres with read replicas
- Feature flags used for canary deployments
- Monitoring and alerting active
- All deployments trigger comprehensive tests

## Scaling Considerations

As traffic grows:

1. **Database**:
   - Enable read replicas for GET /shows
   - Consider connection pooling (PgBouncer)
   - Add indexes as needed
   - Monitor query performance

2. **Application**:
   - Use horizontal scaling (K8s replicas)
   - Enable request caching (Redis for show lists)
   - Monitor response times and latency

3. **Concurrency**:
   - Monitor lock contention
   - Consider queue-based seat allocation if bookings >> availability
   - Add circuit breakers and rate limiting

## Monitoring and Logging

Add monitoring tools (Prometheus, DataDog, New Relic):

```yaml
# Example: Prometheus metrics
- bookings_total (counter)
- booking_duration_seconds (histogram)
- show_available_seats (gauge)
- lock_wait_time_seconds (histogram)
```

## Rollback Procedures

**Quick Rollback (Environment Variable)**:
```bash
kubectl set env deployment/ticket-booking-api AI_MODEL=claude-4-mini
```

**Docker Rollback**:
```bash
docker-compose down
# Update .env or image tag, then:
docker-compose up -d
```

**Git Rollback**:
```bash
git revert <commit-hash>
git push origin main
# CI/CD will auto-deploy previous version
```

## Security Checklist

- [ ] Secrets stored in secure vault (not in .env)
- [ ] HTTPS enabled in production
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] DB connection encrypted
- [ ] Logs do not contain sensitive data
- [ ] Regular dependency updates (npm audit)

