# Deploy to Render (Step-by-Step)

Your code is already on GitHub. Follow these steps to get your app publicly accessible.

## 📋 Prerequisites (Free Accounts)
- ✅ GitHub account (you have it)
- 🆕 **Render account** - Create at https://render.com (click "Sign up" → use GitHub login)

---

## 🚀 Step 1: Create Render Account (2 minutes)

1. Go to https://render.com
2. Click **"Sign up"**
3. Click **"Continue with GitHub"**
4. Authorize Render to access your GitHub repos
5. Verify email
6. You're done!

---

## 🚀 Step 2: Create PostgreSQL Database (3 minutes)

In Render dashboard:

1. Click **"New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name**: `ticketdb`
   - **Database**: `ticketdb`
   - **User**: `postgres`
   - **Region**: `Oregon` (or closest to you)
   - **PostgreSQL Version**: `15`
   - **Plan**: `Free` ← Important!
3. Click **"Create Database"**
4. ⏳ Wait 2-3 minutes for database to initialize
5. **Copy the database URL** from the connection string (you'll need it)

**Save these values:**
- **Internal URL**: `postgres://...` (for connecting within Render)
- **External URL**: `postgres://...` (for external connections, if needed)

---

## 🚀 Step 3: Create Web Service (3 minutes)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo:
   - Click **"Connect repository"**
   - Search for **`ticket-booking-system-backend-moderx`**
   - Click **"Connect"**

3. Fill in service details:
   - **Name**: `ticket-booking-api`
   - **Environment**: `Node`
   - **Region**: `Oregon` (same as DB)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. Click **"Create Web Service"**

---

## 🚀 Step 4: Configure Environment Variables (2 minutes)

In the Web Service settings:

1. Scroll to **"Environment"** section
2. Add these variables:
   - **Key**: `DATABASE_URL`
     **Value**: (Paste the **Internal URL** from Step 2)
   - **Key**: `NODE_ENV`
     **Value**: `production`
   - **Key**: `PORT`
     **Value**: `3000`

3. Click **"Save"**

Example DATABASE_URL format:
```
postgres://postgres:[password]@[host]:[port]/ticketdb
```

---

## 🚀 Step 5: Wait for Deployment (3-5 minutes)

1. Render will automatically start deploying
2. Watch the **"Logs"** tab for build progress
3. You'll see:
   ```
   ✓ Building...
   ✓ npm install
   ✓ Starting application
   ```

4. When complete, you'll see:
   ```
   Server listening on port 3000
   ```

---

## 🚀 Step 6: Run Database Migrations (2 minutes)

1. Go to your Web Service → **"Shell"** tab
2. Run the schema migration:
   ```bash
   psql $DATABASE_URL -f sql/schema.sql
   psql $DATABASE_URL -f sql/feature_flags.sql
   ```

3. If `psql` is not found, use Node:
   ```bash
   node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query(require('fs').readFileSync('sql/schema.sql', 'utf8')).then(() => console.log('Schema migrated')).catch(err => console.error(err))"
   ```

---

## ✅ Done! Your App is Live

Your **public URL** is shown at the top of the Web Service page:

```
https://ticket-booking-api.onrender.com
```

---

## 🧪 Test Your Live API

```powershell
$url = "https://ticket-booking-api.onrender.com"

# List shows (should return empty array)
curl "$url/shows"

# Create a show
$body = @{name='Live Test'; start_time='2025-12-13T19:00:00Z'; total_seats=50} | ConvertTo-Json
Invoke-WebRequest -Uri "$url/admin/shows" -Method POST -ContentType 'application/json' -Body $body

# Book seats
$body = @{user_name='Alice'; seats=3} | ConvertTo-Json
Invoke-WebRequest -Uri "$url/shows/1/book" -Method POST -ContentType 'application/json' -Body $body

# List shows again (should show reserved seats)
curl "$url/shows"
```

---

## 📊 Monitor Your App

In Render dashboard:

- **Logs**: See real-time logs
- **Metrics**: View CPU, memory, uptime
- **Deployments**: View deployment history
- **Environment**: Manage secrets and variables

---

## 🔄 Auto-Deploy on Git Push

Every time you push to `main`, Render auto-deploys:

```powershell
git add .
git commit -m "Your changes"
git push origin main

# Render automatically deploys within 1-2 minutes
```

---

## 🚨 Troubleshooting

### "502 Bad Gateway" or "Service is not responding"
1. Check **Logs** tab for errors
2. Verify environment variables are set correctly (especially `DATABASE_URL`)
3. Check database migrations ran successfully
4. Restart service: Click **"Restart"** in top menu

### "Connection refused" (database error)
1. Verify `DATABASE_URL` is correct
2. Check database is still running (check PostgreSQL service in Render)
3. Ensure migrations ran in Step 5

### App keeps crashing
1. Check logs for error messages
2. Verify `npm start` works locally
3. Ensure all dependencies are in `package.json`
4. Try: `npm install` and `git push` to re-deploy

---

## 📝 Share Your API

Your API is now publicly accessible! Share the URL:

```
API Base URL: https://ticket-booking-api.onrender.com

Example endpoints:
- GET https://ticket-booking-api.onrender.com/shows
- POST https://ticket-booking-api.onrender.com/admin/shows
- POST https://ticket-booking-api.onrender.com/shows/1/book
```

---

## 💰 Costs

**Free Tier (Default)**:
- Web Service: 750 hours/month (~31 days continuous)
- PostgreSQL: Small database, auto-pauses after 15 min inactivity
- **Total Cost: $0/month** ✅

**Upgrade (Optional)**:
- If you want uptime > 750 hours: Upgrade to paid plan ($7+/month)
- Premium PostgreSQL: More storage/performance ($15+/month)

---

## Next Steps

1. ✅ Create Render account
2. ✅ Create PostgreSQL database
3. ✅ Create Web Service (connect GitHub)
4. ✅ Set environment variables
5. ✅ Wait for deployment
6. ✅ Run migrations
7. ✅ Test live API
8. 🎉 Share your URL!

**Estimated total time: 15-20 minutes**

---

Need help? Check Render docs: https://render.com/docs
