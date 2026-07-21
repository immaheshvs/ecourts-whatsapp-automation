# eCourts WhatsApp Automation 🔔

Automated WhatsApp notifications for eCourts India hearing date reminders. Get instant alerts when your court hearings are scheduled for the next day.

## Features

✅ **Completely Free**
- Free hosting (Render/Railway)
- Free WhatsApp integration (Twilio)
- Free database (MongoDB Atlas)
- Free eCourts API access

✅ **Automatic Monitoring**
- Checks cases every 24 hours (configurable)
- Automatically detects hearings for tomorrow
- Sends WhatsApp alerts instantly

✅ **Easy Management**
- Add/remove cases via REST API
- Track case status
- View monitoring history
- Manual monitoring trigger

✅ **Production Ready**
- MongoDB for persistent data
- Error handling & logging
- Scheduled cron jobs
- Health check endpoint

## Quick Start

### 1. Setup (5 minutes)

```bash
# Clone/download this repository
git clone <repo-url>
cd ecourts-whatsapp-automation

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (see DEPLOYMENT_GUIDE.md)
nano .env
```

### 2. Get Credentials

Follow **DEPLOYMENT_GUIDE.md** to get:
- Twilio API credentials (free $15 credit)
- eCourts API key (free)
- MongoDB connection string (free tier)

### 3. Deploy

Choose one:

**Option A: Render** (Recommended)
```bash
git push origin main
# Go to https://render.com, connect GitHub, deploy
```

**Option B: Railway**
```bash
# Go to https://railway.app, connect GitHub, deploy
```

See **DEPLOYMENT_GUIDE.md** for detailed steps.

### 4. Start Monitoring

```bash
# Add a case
curl -X POST https://your-app.onrender.com/api/cases \
  -H "Content-Type: application/json" \
  -d '{"caseNumber": "ABC123456"}'

# Check status
curl https://your-app.onrender.com/api/cases
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/cases` | Add a case to monitor |
| GET | `/api/cases` | Get all monitored cases |
| GET | `/api/cases/:caseNumber` | Get specific case details |
| DELETE | `/api/cases/:caseNumber` | Remove a case |
| POST | `/api/monitor` | Manually trigger monitoring |
| GET | `/health` | Health check |

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                   eCourts Automation Flow                │
└─────────────────────────────────────────────────────────┘

1. You add case number via API
   ↓
2. App fetches case details from eCourts API
   ↓
3. Case data stored in MongoDB
   ↓
4. Cron job runs every 24 hours (8 AM)
   ↓
5. App checks each case's hearing date
   ↓
6. If hearing is tomorrow → Send WhatsApp alert via Twilio
   ↓
7. Alert marked as sent (no duplicates)
```

## Example WhatsApp Alert

```
🔔 Case Hearing Reminder

Case: ABC123456
Title: State v. John Doe
Hearing Date: Friday, January 15, 2024
Court: District Court, New Delhi

⚠️ Hearing is tomorrow!
```

## Configuration

### Adjust Monitoring Frequency

Edit `server.js` and change cron expressions:

```javascript
// Daily at 8 AM
cron.schedule('0 8 * * *', () => monitorCases());

// Or every 6 hours
cron.schedule('0 */6 * * *', () => monitorCases());

// Or every 2 hours
cron.schedule('0 */2 * * *', () => monitorCases());
```

[Cron format](https://crontab.guru/) → second, minute, hour, day, month, weekday

### Customize Alert Message

Edit the message template in `server.js`:

```javascript
const message = `🔔 *Case Hearing Reminder*\n\n` +
  `Case: ${caseNumber}\n` +
  // ... customize here
```

## Costs

| Service | Free Tier | Cost If Exceeded |
|---------|-----------|-----------------|
| Render | 750 hrs/month (enough for 24/7) | $7-10/month |
| MongoDB Atlas | 512 MB free | $0.10/GB/month |
| Twilio WhatsApp | $15 free credit (~150 msgs) | $0.0627/msg |
| eCourts API | Free | Free |
| **Total** | **$0** | <$1/month |

## Troubleshooting

### WhatsApp messages not arriving?
1. Check Twilio sandbox is set up
2. Verify phone number format: `+91XXXXXXXXXX`
3. Check Render logs for errors
4. Test with `/api/monitor` endpoint

### MongoDB connection failed?
1. Verify connection string in `.env`
2. Check MongoDB whitelist IP
3. Confirm database user credentials

### eCourts API errors?
1. Verify API key is correct
2. Check case number format
3. Ensure case exists on eCourts website

See **DEPLOYMENT_GUIDE.md** for more troubleshooting.

## Project Structure

```
ecourts-whatsapp-automation/
├── server.js                 # Main application
├── package.json              # Dependencies
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── DEPLOYMENT_GUIDE.md       # Complete setup guide
└── README.md                 # This file
```

## Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB Atlas (free tier)
- **WhatsApp:** Twilio
- **API:** eCourts India
- **Scheduling:** node-cron
- **Hosting:** Render / Railway (free tier)

## Security

⚠️ Important:
- Never commit `.env` file
- Keep API credentials secret
- Use strong MongoDB passwords
- Enable IP whitelist in MongoDB
- Rotate tokens periodically

## Future Enhancements

- [ ] Web dashboard for case management
- [ ] Email notifications
- [ ] SMS backup via Twilio
- [ ] Calendar integration (Google Calendar)
- [ ] Multiple user accounts
- [ ] Case history & analytics
- [ ] Recurring hearing patterns
- [ ] Export reports

## Support & Resources

- **eCourts API Docs:** https://ecourtsindia.com/api/docs
- **Twilio WhatsApp:** https://www.twilio.com/docs/whatsapp
- **Render Documentation:** https://render.com/docs
- **Railway Docs:** https://railway.app/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/

## Contributing

Feel free to fork, modify, and improve!

## License

MIT License - feel free to use for personal or commercial projects.

## Disclaimer

This tool is for informational purposes. Always verify official eCourts website for accurate case information. Not responsible for missed hearings due to system failures.

---

**Built with ❤️ for the Indian legal system** 🇮🇳
