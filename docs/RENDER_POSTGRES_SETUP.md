# Render PostgreSQL Setup Guide

## Field-by-Field Instructions

Based on your screenshot, here's exactly what to fill in:

### 1. **Name** (Required)
```
ticketdb
```
This is the unique identifier for your database instance. Keep it simple and memorable.

---

### 2. **Database** (Optional)
```
ticketdb
```
This is the actual PostgreSQL database name that will be created. Use the same name as above for consistency.

---

### 3. **User** (Optional)
```
postgres
```
This is the default PostgreSQL username. Leave it as `postgres` (standard).

---

### 4. **Region** (Required)
**Already selected**: `Oregon (US West)` ✅

This is perfect. If you're in Asia/Europe, choose the closest region:
- `Oregon (US West)` ← Current selection (good for US)
- `Frankfurt (EU Central)` ← If in Europe
- `Tokyo (Asia)` ← If in Asia

---

### 5. **PostgreSQL Version** (Required)
**You see**: Version 18 in dropdown

Select: **`15`** (or latest stable)
- `15` is stable and well-tested ✅
- `16` or `17` also work fine
- Avoid the very latest for stability

---

### 6. **Datadog API Key** (Optional)
```
[Leave empty]
```
Skip this. It's for advanced monitoring. You don't need it now.

---

### 7. **Datadog Region** (Optional)
```
[Leave as USI (default)]
```
Skip this. Not needed.

---

## ✅ Summary - What to Fill:

| Field | Value |
|-------|-------|
| **Name** | `ticketdb` |
| **Database** | `ticketdb` |
| **User** | `postgres` |
| **Region** | `Oregon (US West)` |
| **PostgreSQL Version** | `15` |
| **Datadog API Key** | (leave empty) |
| **Datadog Region** | (leave empty) |

---

## 🎬 Next Steps After Creating Database

1. Click **"Create Database"** (button at bottom)
2. ⏳ Wait 2-3 minutes for database to initialize
3. You'll see a page with your database credentials including:
   - **Internal URL**: `postgres://postgres:[password]@[host]:[port]/ticketdb`
   - **External URL**: Similar format

4. **Copy the Internal URL** - you'll need it for the Web Service

---

## 📝 After Database is Created

You'll need these details for the next step (creating the Web Service):

```
DATABASE_URL = postgres://postgres:[PASSWORD]@[HOST]:[PORT]/ticketdb
```

Save this somewhere safe! You'll use it in the next step.

---

## Ready?

Once you've filled in those fields with the values above, click the **"Create Database"** button at the bottom of the form.

It will take 2-3 minutes to initialize. In the meantime, keep the Render dashboard open to copy the connection details once it's ready.

Let me know once the database is created and you have the URL!
