# Create Web Service on Render (Next Step)

Great! Your PostgreSQL database is ready. Now create the Web Service (your Node.js app).

## Your Database Details

**Internal URL** (use this):
```
postgresql://ticketdb_f6u0_user:nZ6T4jHEwUxALRHVwtFZgA7dFI9ks5UN@dpg-d4topl75r7bs73fgop6g-a/ticketdb_f6u0
```

**External URL** (for remote connections):
```
postgresql://ticketdb_f6u0_user:nZ6T4jHEwUxALRHVwtFZgA7dFI9ks5UN@dpg-d4topl75r7bs73fgop6g-a.oregon-postgres.render.com/ticketdb_f6u0
```

---

## 🚀 Step 1: Create Web Service

1. Go to Render Dashboard: https://dashboard.render.com
2. Click **"New +"** button (top right)
3. Select **"Web Service"**

---

## 🚀 Step 2: Connect Your GitHub Repository

1. Click **"Connect repository"**
2. Search for: **`ticket-booking-system-backend-moderx`**
3. Click **"Connect"** next to your repo

---

## 🚀 Step 3: Fill in Service Details

### Name
```
ticket-booking-api
```

### Environment
```
Node
```

### Region
```
Oregon (US West)
```
(Same as your database for best performance)

### Branch
```
main
```

### Build Command
```
npm install
```

### Start Command
```
npm start
```

### Instance Type / Plan
```
Free
```

---

## 🚀 Step 4: Set Environment Variables

Scroll down to **"Advanced"** → **"Environment Variables"**

Add these 3 variables:

### Variable 1: DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: (Paste your **Internal URL** from above)
```
postgresql://ticketdb_f6u0_user:nZ6T4jHEwUxALRHVwtFZgA7dFI9ks5UN@dpg-d4topl75r7bs73fgop6g-a/ticketdb_f6u0
```

### Variable 2: NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`

### Variable 3: PORT
- **Key**: `PORT`
- **Value**: `3000`

---

## 🚀 Step 5: Create Web Service

Click **"Create Web Service"** button at the bottom

---

## ⏳ Deployment (3-5 minutes)

1. Render will automatically start deploying
2. Watch the **"Logs"** tab for progress
3. You'll see:
   ```
   Building...
   npm install
   Starting application
   Server listening on port 3000
   ```

4. Once complete, you'll see a green checkmark and a URL like:
   ```
   https://ticket-booking-api.onrender.com
   ```

---

## 🚀 Step 6: Run Database Migrations

Once deployment is complete:

1. In Render Web Service → **"Shell"** tab
2. Run this command to initialize the database:
   ```bash
   psql $DATABASE_URL -f sql/schema.sql
   ```

3. Then run feature flags migration:
   ```bash
   psql $DATABASE_URL -f sql/feature_flags.sql
   ```

**If psql command fails**, use this alternative:
```bash
node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL});p.query(require('fs').readFileSync('sql/schema.sql','utf8')).then(()=>console.log('✓ Schema migrated')).catch(e=>console.error(e))"
```

---

## ✅ Test Your Live API

Once deployment completes, test with your public URL:

```powershell
$url = "https://ticket-booking-api.onrender.com"

# 1. List shows (should return empty array)
curl "$url/shows"

# 2. Create a show
$body = @{name='Live Test Show'; start_time='2025-12-13T19:00:00Z'; total_seats=50} | ConvertTo-Json
Invoke-WebRequest -Uri "$url/admin/shows" -Method POST -ContentType 'application/json' -Body $body

# 3. Book seats
$body = @{user_name='Alice'; seats=3} | ConvertTo-Json
Invoke-WebRequest -Uri "$url/shows/1/book" -Method POST -ContentType 'application/json' -Body $body

# 4. Check show status
curl "$url/shows"
```

---

## 🎉 Done!

Your API is now live and publicly accessible at:
```
https://ticket-booking-api.onrender.com
```

Share this URL with your evaluators! 🚀

---

## 📊 Monitor Your App

In Render dashboard:
- **Logs** tab: See real-time logs
- **Metrics** tab: CPU, memory, uptime
- **Deployments** tab: View deploy history

---

## 🔄 Auto-Deploy (Bonus)

Every time you push to GitHub, Render auto-deploys:
```powershell
git add .
git commit -m "Your changes"
git push origin main
# Render deploys within 1-2 minutes
```

---

## ✨ Your System is Now Live!

| Component | Status | Details |
|-----------|--------|---------|
| GitHub Repo | ✅ | https://github.com/saranyaray/ticket-booking-system-backend-moderx |
| Database | ✅ | PostgreSQL on Render |
| Web Service | 🔄 | Creating... |
| Public API | 🔄 | Will be live soon |

Once the Web Service finishes deploying, you'll have:
- ✅ Live API endpoint
- ✅ Working database
- ✅ Auto-deployments on git push
- ✅ Complete 24-hour project submitted

---

## Troubleshooting

### Deployment fails or shows error
1. Check **Logs** tab for error message
2. Verify `DATABASE_URL` is exactly as shown above
3. Check `npm start` works locally (`npm run dev`)

### Can't connect to database
1. Verify `DATABASE_URL` environment variable is set correctly
2. Check migrations ran successfully
3. Database should auto-start, but check in Render dashboard

### Still having issues?
Let me know and I'll help debug!
