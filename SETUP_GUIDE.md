# 🚀 Quick Setup Guide for Developers

This guide will help you get the Herland Laundry System running on your local machine in under 10 minutes.

---

## ✅ Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop/))
- [ ] **Git** installed
- [ ] **Environment variables** from the project lead (Supabase keys, Google Maps API key)

---

## 📋 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone -b main --single-branch https://github.com/ilsu-vc/herland-laundry-system.git
cd herland-laundry-system-main
```

### Step 2: Create Environment Files

Run these commands in the **root folder** (`herland-laundry-system-main/`):

```bash
# Backend
cp herland-laundry-system-backend/.env.example herland-laundry-system-backend/.env

# Frontend
cp herland-laundry-system-frontend/client/.env.example herland-laundry-system-frontend/client/.env

# Root (for production builds)
cp .env.example .env
```

### Step 3: Fill in Environment Variables

**Ask the project lead for the actual values!** Then edit these files:

1. **`herland-laundry-system-backend/.env`**
   - Add your Supabase URL, keys, and service role key
   - Add Google Maps API key

2. **`herland-laundry-system-frontend/client/.env`**
   - Add your Supabase URL and anon key
   - Add Google Maps API key
   - Set `VITE_API_URL=http://localhost:5000` (no `/api/v1` at the end!)

3. **`.env`** (root folder)
   - Same as frontend, but for production Docker builds

### Step 4: Start the Application

Run this command in the **root folder**:

```bash
docker compose --profile dev up --build
```

### Step 5: Verify It's Working

**Wait for these messages in your terminal:**

✅ **Backend (should appear first):**
```
✅ Connection Successful! Database is talking to the Backend.
🚀 Herland Backend running on http://localhost:5000
```

✅ **Frontend (should appear after backend):**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 6: Open in Browser

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## 🛑 Common Issues & Solutions

### Issue 1: "Service rates not loading on landing page"

**Symptoms:** The service rates section shows a loading spinner forever.

**Solution:**
1. Check that backend is running (you should see "✅ Connection Successful!" in terminal)
2. Verify `herland-laundry-system-frontend/client/.env` has:
   ```
   VITE_API_URL=http://localhost:5000
   ```
   (No `/api/v1` at the end!)
3. Make sure your Supabase database has the `service_items` table populated (run `database_migration.sql`)

### Issue 2: "No terminal output / Can't see backend/frontend logs"

**Solution:**
```bash
# View backend logs
docker compose logs -f backend-dev

# View frontend logs
docker compose logs -f frontend-dev
```

### Issue 3: "Port already in use"

**Symptoms:** Error like "port 5000 is already allocated"

**Solution:**
```bash
# Stop all containers
docker compose --profile dev down

# Check what's using the port (Windows)
netstat -ano | findstr :5000

# Kill the process or change the port in docker-compose.yml
```

### Issue 4: "Environment variables not working"

**Solution:**
1. Make sure you created the `.env` files (not `.env.example`)
2. Restart Docker containers after changing `.env`:
   ```bash
   docker compose --profile dev down
   docker compose --profile dev up --build
   ```

### Issue 5: "Navbar scroll cuts off sections"

**Fixed in latest version!** Pull the latest code:
```bash
git pull origin main
```

---

## 🧹 Clean Up / Reset

If things are broken and you want to start fresh:

```bash
# Stop all containers
docker compose --profile dev down

# Remove all Docker images and containers
docker system prune -af

# Start again
docker compose --profile dev up --build
```

---

## 📞 Need Help?

If you're still stuck:
1. Check the main `README.md` for more detailed documentation
2. Ask in the team chat
3. Contact the project lead

---

## 🎉 Success!

If you see both the backend and frontend URLs in your terminal, you're all set! Open http://localhost:5173 in your browser and start developing.
