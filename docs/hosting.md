# Hosting & Deployment Guide

This guide shows how to host your Ticket Booking System online and make it publicly accessible.

## 🚀 Quick Deployment to Render (Recommended - Free Tier)

**Render** is the easiest option for getting your app online quickly with a free tier.

### Prerequisites
- GitHub account (free at github.com)
- Render account (free at render.com)
- Git installed (download from git-scm.com/download/win)

### Step 1: Push Code to GitHub

```powershell
cd "C:\Users\Saranya Ray\ticket booking system(backend)"

# Initialize Git
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Commit
git commit -m "Ticket booking system: concurrency-safe, Docker-ready, production setup"

# Create new repo at https://github.com/new named 'ticket-booking-backend'
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/ticket-booking-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. **Go to Render**: https://render.com
2. **Sign up** (free) with GitHub
3. **Create new Web Service**:
   - Connect your `ticket-booking-backend` repository
   - Name: `ticket-booking-api`
   - Environment: `Node`
   - Build command: `npm install`
   - Start command: `npm start`
   - Plan: `Free`

4. **Add PostgreSQL Database** (in same Render project):
   - Create new PostgreSQL service
   - Name: `ticketdb`
   - PostgreSQL Version: 15
   - Plan: `Free`

5. **Connect Database to Web Service**:
   - In Web Service settings → Environment:
     - `PGHOST`: (Render auto-populates the DB internal host)
     - `PGUSER`: `postgres`
     - `PGPASSWORD`: (Render generates, keep it secret)
     - `PGDATABASE`: `ticketdb`
     - `PGPORT`: `5432`
     - `NODE_ENV`: `production`

6. **Deploy**:
   - Render auto-deploys on git push
   - Check deployment logs in Render dashboard
   - Get your public URL: `https://ticket-booking-api.onrender.com`

### Step 3: Initialize Database

Once deployed, run migrations on the hosted DB:

```bash
# Via Render dashboard terminal or using psql remotely
psql -h your-postgres-instance.onrender.com -U postgres -d ticketdb -f sql/schema.sql
psql -h your-postgres-instance.onrender.com -U postgres -d ticketdb -f sql/feature_flags.sql
```

### Step 4: Test Public API

```powershell
$url = "https://ticket-booking-api.onrender.com"

# List shows
curl "$url/shows"

# Create a show
$body = @{name='Hosted Test'; start_time='2025-12-13T19:00:00Z'; total_seats=50} | ConvertTo-Json
Invoke-WebRequest -Uri "$url/admin/shows" -Method POST -ContentType 'application/json' -Body $body
```

---

## 🔵 Alternative: Azure App Service (Professional)

For production workloads with more control and scalability.

### Prerequisites
- Azure account (free tier available)
- Azure CLI installed

### Quick Deploy Steps

```bash
# Login to Azure
az login

# Create resource group
az group create --name ticket-booking --location eastus

# Create App Service Plan
az appservice plan create --name ticket-booking-plan --resource-group ticket-booking --sku B1 --is-linux

# Create Web App
az webapp create --resource-group ticket-booking --plan ticket-booking-plan --name ticket-booking-api --runtime "node|18-lts"

# Create PostgreSQL Database
az postgres flexible-server create --name ticket-booking-db --resource-group ticket-booking --admin-user postgres --admin-password YOUR_PASSWORD --sku-name B1ms

# Deploy from GitHub
az webapp deployment source config-zip --resource-group ticket-booking --name ticket-booking-api --src deploy.zip

# Or use GitHub Actions for auto-deploy (see .github/workflows/ci-cd.yml)
```

Public URL: `https://ticket-booking-api.azurewebsites.net`

---

## 🟣 Alternative: Heroku (Simple, Paid)

Heroku is simpler than Azure but now requires a paid plan ($5+/month).

### Quick Steps

```bash
# Install Heroku CLI
# Then login
heroku login

# Create app
heroku create ticket-booking-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev -a ticket-booking-api

# Deploy from Git
git push heroku main

# Run migrations
heroku run "node -e \"require('pg').Pool({connectionString: process.env.DATABASE_URL}).query(require('fs').readFileSync('sql/schema.sql', 'utf8'))\""
```

Public URL: `https://ticket-booking-api.herokuapp.com`

---

## Post-Deployment Checklist

After deploying to any platform:

- [ ] Test API endpoints are accessible
- [ ] Database migrations ran successfully
- [ ] Create a show and test booking flow
- [ ] Run concurrency test against public URL
- [ ] Set up monitoring/alerting
- [ ] Configure custom domain (optional)
- [ ] Add SSL/TLS certificate (auto on most platforms)
- [ ] Set up CI/CD pipeline for auto-deploy on git push

---

## Environment Variables for Production

Make sure these are set in your hosting platform's environment:

```
PGHOST=<database-host>
PGUSER=postgres
PGPASSWORD=<secure-password>
PGDATABASE=ticketdb
PGPORT=5432
PORT=3000
NODE_ENV=production
```

**Never commit `PGPASSWORD` or secrets to Git!** Use platform secrets management.

---

## Monitoring

After deploying, monitor these metrics:

- **Uptime**: Should be 99.9%+
- **Response time**: < 200ms average
- **Database connections**: Monitor pool usage
- **Errors**: Alert on 5xx errors
- **Bookings per second**: Track throughput

Suggested tools:
- Render: Built-in logs + monitoring
- Azure: Application Insights
- Heroku: Logging + metrics dashboard

---

## Scaling (Future)

Once you have traffic:

1. **Render**: Upgrade to paid instance (automatic horizontal scaling)
2. **Azure**: Enable auto-scaling, add CDN for static content
3. **Heroku**: Upgrade dyno type, add read replicas to PostgreSQL

---

## Troubleshooting

### 502 Bad Gateway / App Crashing
- Check logs in platform dashboard
- Verify environment variables are set
- Ensure database is running and accessible
- Check startup command: `npm start`

### Database Connection Fails
- Verify `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` are correct
- Check database is in same region (optional: Render connects internally)
- Verify firewall rules allow connections

### Build Fails
- Check `npm install` succeeds locally
- Verify `package.json` has all dependencies
- Check `npm start` runs locally
- Review build logs in platform dashboard

---

## Next Steps

1. **Choose platform**: Render (easiest) or Azure (most powerful)
2. **Push to GitHub**: Initialize Git and push your repo
3. **Deploy**: Follow platform-specific steps above
4. **Test**: Hit your public URL and verify API works
5. **Share**: Get the URL and share with evaluators

Good luck! 🚀
