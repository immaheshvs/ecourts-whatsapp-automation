# eCourts WhatsApp Automation - Complete Deployment Guide

Free automation solution for eCourts hearing date monitoring with WhatsApp notifications.

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Prerequisites & Accounts](#prerequisites--accounts)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Deploy to Render (Recommended)](#deploy-to-render-recommended)
5. [Deploy to Railway](#deploy-to-railway)
6. [API Usage](#api-usage)
7. [Troubleshooting](#troubleshooting)

---

## Quick Overview

**How it works:**
- Your app runs 24/7 on a free cloud server
- Every 24 hours (or 6 hours), it checks your eCourts cases
- If a hearing is scheduled for tomorrow, you get a WhatsApp alert
- You manage cases via REST API (add/remove cases anytime)

**Cost: FREE** ✅
- Render/Railway: Free tier (750 compute hours/month = enough for 24/7)
- MongoDB Atlas: 512MB free
- Twilio WhatsApp: $15 free trial (covers ~100+ messages)
- eCourts API: Free

---

## Prerequisites & Accounts

### 1. Create a Twilio Account (WhatsApp)
**Time: 5 minutes | Cost: Free $15 credit**

1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your email and phone number
4. Go to **Console** (top-left after login)
5. You'll see:
   - **Account SID** (save this)
   - **Auth Token** (save this)
6. On the left sidebar, go to **Messaging → WhatsApp**
7. Click **Try WhatsApp**
8. You'll get a **Sandbox WhatsApp Number** (like `+1234567890`) - save this
9. Add your phone number to the sandbox (Twilio will guide you)

**Save these:**
```
TWILIO_ACCOUNT_SID: ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN: your_token_here
TWILIO_WHATSAPP_NUMBER: +1234567890 (from Sandbox)
USER_PHONE: +919876543210 (your WhatsApp number)
```

### 2. Get eCourts API Key
**Time: 10 minutes | Cost: Free**

1. Go to https://ecourtsindia.com/api/docs
2. Register/Login
3. Generate an API key from your dashboard
4. Save as `ECOURTS_API_KEY`

### 3. Create MongoDB Atlas Database
**Time: 10 minutes | Cost: Free 512MB**

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up with email
3. Create a free cluster (M0 tier)
4. Create a database user:
   - Database Access → Add Database User
   - Username: `ecourts_user`
   - Password: Generate a strong one (save it)
5. Get connection string:
   - Cluster → Connect → Connect your application
   - Copy the connection string:
     ```
     mongodb+srv://ecourts_user:PASSWORD@cluster0.xxxxx.mongodb.net/ecourts-db?retryWrites=true&w=majority
     ```
   - Replace `PASSWORD` with your actual password
   - Replace `ecourts-db` with desired database name
6. Whitelist your IP:
   - Network Access → Add IP Address → Allow from Anywhere (for now)

---

## Step-by-Step Setup

### Step 1: Clone/Download the Repository

```bash
# If you have git
git clone https://github.com/yourusername/ecourts-whatsapp-automation.git
cd ecourts-whatsapp-automation

# Or just create the files manually:
mkdir ecourts-whatsapp-automation
cd ecourts-whatsapp-automation
# Copy server.js, package.json, and .env.example into this folder
```

### Step 2: Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
nano .env
# or use your favorite editor (VS Code, etc.)
```

Fill in all values:
```env
ECOURTS_API_KEY=your_key_from_step_2
MONGO_URI=your_mongodb_connection_string
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+1234567890
USER_PHONE=+919876543210
```

### Step 3: Test Locally (Optional but Recommended)

```bash
# Install Node.js if you don't have it
# From https://nodejs.org/ (download 18.x LTS)

# Install dependencies
npm install

# Start the server
npm start

# You should see:
# ✅ Connected to MongoDB
# 🚀 eCourts WhatsApp Automation running on port 3000

# Test the API
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}

# Stop the server (Ctrl + C)
```

---

## Deploy to Render (Recommended)

**Why Render?** Free tier, simple UI, built-in cron jobs, no credit card needed.

### Step 1: Push Code to GitHub

```bash
# If you don't have git set up
git init
git add .
git commit -m "Initial commit: eCourts WhatsApp automation"

# Create a GitHub repo (https://github.com/new)
# Then push:
git remote add origin https://github.com/yourusername/ecourts-whatsapp-automation.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click **New → Web Service**
4. Select your GitHub repo
5. Fill in settings:
   - **Name:** `ecourts-whatsapp-automation`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

6. Click **Advanced**
7. Add Environment Variables:
   - Click **Add Environment Variable** for each:
     - `ECOURTS_API_KEY` = your key
     - `MONGO_URI` = your MongoDB connection string
     - `TWILIO_ACCOUNT_SID` = your SID
     - `TWILIO_AUTH_TOKEN` = your token
     - `TWILIO_WHATSAPP_NUMBER` = +1234567890
     - `USER_PHONE` = +919876543210

8. Click **Create Web Service**
9. Wait 5-10 minutes for deployment
10. You'll get a URL like: `https://ecourts-whatsapp-automation.onrender.com`

### Step 3: Set Up Cron Job (for monitoring)

Render runs cron jobs automatically, but if it doesn't:

1. Go to your Render service dashboard
2. Go to **Settings → Cron Jobs**
3. Create a new cron job:
   - **Schedule:** `0 8 * * *` (daily at 8 AM)
   - **Command:** `curl https://your-app.onrender.com/api/monitor`

Or just rely on the Node-cron jobs in `server.js` (they run automatically).

**Test your deployment:**
```bash
curl https://ecourts-whatsapp-automation.onrender.com/health
# Should return: {"status":"ok"...}
```

---

## Deploy to Railway

**Alternative:** Similar to Render, equally free.

1. Go to https://railway.app
2. Click **Create a new project**
3. Select **GitHub repo** (or paste code)
4. Add the repo
5. Set environment variables in the dashboard
6. Deploy automatically
7. Railway generates a public URL

---

## API Usage

Once deployed, you can manage your cases:

### Add a Case to Monitor

```bash
curl -X POST https://your-app.onrender.com/api/cases \
  -H "Content-Type: application/json" \
  -d '{"caseNumber": "ABC123456"}'

# Response:
# {
#   "message": "Case added successfully",
#   "case": {
#     "_id": "...",
#     "caseNumber": "ABC123456",
#     "caseTitle": "...",
#     "nextHearingDate": "2024-01-15T00:00:00.000Z",
#     "status": "active"
#   }
# }
```

### Get All Cases

```bash
curl https://your-app.onrender.com/api/cases

# Response: Array of all monitored cases
```

### Get a Specific Case

```bash
curl https://your-app.onrender.com/api/cases/ABC123456
```

### Remove a Case

```bash
curl -X DELETE https://your-app.onrender.com/api/cases/ABC123456
```

### Manually Trigger Monitoring (for testing)

```bash
curl -X POST https://your-app.onrender.com/api/monitor

# Response: {"message":"Monitoring triggered successfully"}
```

---

## Automation Workflows

### Workflow 1: Add Case via Website Form

Create a simple HTML form on your own domain:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Add eCourts Case</title>
</head>
<body>
  <h1>Monitor eCourts Hearing</h1>
  <input type="text" id="caseNumber" placeholder="Enter case number">
  <button onclick="addCase()">Add Case</button>
  <div id="result"></div>

  <script>
    async function addCase() {
      const caseNumber = document.getElementById('caseNumber').value;
      const response = await fetch('https://your-app.onrender.com/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseNumber })
      });
      const result = await response.json();
      document.getElementById('result').innerHTML = 
        response.ok ? 'Case added!' : 'Error: ' + result.error;
    }
  </script>
</body>
</html>
```

### Workflow 2: Batch Import Cases

Create a CSV, then import via script:

```bash
# cases.csv
ABC123456
XYZ789012
PQR345678

# Import script
while IFS= read -r caseNumber; do
  curl -X POST https://your-app.onrender.com/api/cases \
    -H "Content-Type: application/json" \
    -d "{\"caseNumber\": \"$caseNumber\"}"
done < cases.csv
```

### Workflow 3: Daily Digest

Modify server.js to batch WhatsApp messages (instead of individual alerts):

```javascript
// Send one digest message daily with all hearings tomorrow
const hearingsToday = cases.filter(c => isTomorrow(c.nextHearingDate));
if (hearingsToday.length > 0) {
  const list = hearingsToday.map(c => `• ${c.caseNumber}: ${c.caseTitle}`).join('\n');
  await sendWhatsAppAlert(`📋 Daily Hearing Digest:\n${list}`);
}
```

---

## Troubleshooting

### "Cannot connect to MongoDB"
- **Fix:** Check your `MONGO_URI` in `.env`
  - Make sure it's the full connection string
  - Verify MongoDB cluster is running
  - Check IP whitelist in MongoDB Atlas

### "Twilio API Error: Invalid From Parameter"
- **Fix:** Ensure `TWILIO_WHATSAPP_NUMBER` is correct format
  - Should be `+1234567890` (with country code)
  - Verify in Twilio Console → Messaging → WhatsApp

### "eCourts case not found"
- **Fix:** Verify case number format
  - Try case number directly on https://ecourtsindia.com
  - Check if API key has correct permissions

### "Cron jobs not running"
- **Fix:** For Render, cron is built into Node-cron (in server.js)
  - Monitor logs in Render dashboard
  - Manually trigger with `/api/monitor` to test

### "WhatsApp message not received"
- **Fix:**
  1. Verify phone number with Twilio (check Twilio log)
  2. Confirm Twilio sandbox is set up correctly
  3. Test manually: `curl -X POST /api/monitor`
  4. Check Render logs for errors

### View Logs

**Render:**
- Dashboard → Your Service → Logs

**Railway:**
- Project → Logs tab

---

## Security Notes

⚠️ **Important:**

1. **Never commit `.env`** - add to `.gitignore`
2. **Rotate Twilio tokens** periodically
3. **Use strong MongoDB password**
4. **Enable MongoDB IP whitelist** (not "anywhere")
5. **Review Render logs** for errors

---

## Next Steps

✅ **You're done!**

Your automation is now live. Here's what happens:

- **Every 24 hours:** App checks all your monitored cases
- **When hearing is tomorrow:** You get a WhatsApp alert 🔔
- **Any time:** You can add/remove cases via API

### Optional Enhancements

- Add a web dashboard to manage cases
- Send daily digest instead of individual alerts
- Integrate with Google Calendar
- Set up SMS fallback (Twilio SMS)
- Add email notifications

---

## Support

- **Twilio Docs:** https://www.twilio.com/docs/whatsapp
- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **eCourts API:** https://ecourtsindia.com/api/docs

---

**Happy monitoring!** 🚀
