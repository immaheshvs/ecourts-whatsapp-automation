const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
const mongoose = require('mongoose');
const cron = require('node-cron');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// ==================== Configuration ====================
const ECOURTS_API_BASE = 'https://ecourtsindia.com/api';
const ECOURTS_API_KEY = process.env.ECOURTS_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const MONGO_URI = process.env.MONGO_URI;
const USER_PHONE = process.env.USER_PHONE; // Your WhatsApp number in format +91XXXXXXXXXX

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ==================== MongoDB Schema ====================
const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, unique: true, required: true },
  caseTitle: String,
  nextHearingDate: Date,
  lastChecked: { type: Date, default: Date.now },
  alertSent: { type: Boolean, default: false },
  alertSentAt: Date,
  status: { type: String, default: 'active' }, // active, closed, archived
  createdAt: { type: Date, default: Date.now },
});

const Case = mongoose.model('Case', caseSchema);

// ==================== Utility Functions ====================

/**
 * Parse date string from eCourts API (handles various formats)
 */
function parseDate(dateString) {
  if (!dateString) return null;
  
  // Try DD/MM/YYYY format
  const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    return new Date(match[3], match[2] - 1, match[1]);
  }
  
  // Try ISO format
  const date = new Date(dateString);
  return isNaN(date) ? null : date;
}

/**
 * Check if date is tomorrow
 */
function isTomorrow(date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return date.toDateString() === tomorrow.toDateString();
}

/**
 * Fetch case details from eCourts API
 */
async function fetchCaseFromEcourts(caseNumber) {
  try {
    const response = await axios.get(`${ECOURTS_API_BASE}/case/${caseNumber}`, {
      headers: {
        'Authorization': `Bearer ${ECOURTS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const caseData = response.data;
    
    return {
      caseNumber: caseData.case_number || caseNumber,
      caseTitle: caseData.case_title || 'Unknown Case',
      nextHearingDate: parseDate(caseData.next_hearing_date),
      court: caseData.court_name || 'Unknown Court'
    };
  } catch (error) {
    console.error(`Error fetching case ${caseNumber}:`, error.message);
    return null;
  }
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppAlert(caseNumber, caseTitle, hearingDate, court) {
  try {
    const formattedDate = hearingDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const message = `🔔 *Case Hearing Reminder*\n\n` +
      `Case: ${caseNumber}\n` +
      `Title: ${caseTitle}\n` +
      `Hearing Date: ${formattedDate}\n` +
      `Court: ${court}\n\n` +
      `⚠️ Hearing is tomorrow!`;

    const result = await twilioClient.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${USER_PHONE}`,
      body: message
    });

    console.log(`✅ WhatsApp alert sent for case ${caseNumber}. SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp alert for ${caseNumber}:`, error.message);
    return false;
  }
}

// ==================== Main Monitoring Logic ====================

/**
 * Check all cases and send alerts if hearing is tomorrow
 */
async function monitorCases() {
  try {
    console.log(`\n🔍 Starting case monitoring at ${new Date().toISOString()}`);

    // Get all active cases from database
    const activeCases = await Case.find({ status: 'active' });
    
    if (activeCases.length === 0) {
      console.log('ℹ️  No active cases to monitor');
      return;
    }

    console.log(`📋 Found ${activeCases.length} active cases to check`);

    for (const storedCase of activeCases) {
      try {
        // Fetch fresh data from eCourts API
        const freshData = await fetchCaseFromEcourts(storedCase.caseNumber);
        
        if (!freshData) {
          console.log(`⚠️  Could not fetch data for ${storedCase.caseNumber}`);
          continue;
        }

        // Update case data
        storedCase.caseTitle = freshData.caseTitle;
        storedCase.nextHearingDate = freshData.nextHearingDate;
        storedCase.lastChecked = new Date();

        // Check if hearing is tomorrow and alert not yet sent
        if (freshData.nextHearingDate && isTomorrow(freshData.nextHearingDate) && !storedCase.alertSent) {
          console.log(`🎯 Hearing tomorrow for case ${storedCase.caseNumber}! Sending alert...`);
          
          const sent = await sendWhatsAppAlert(
            storedCase.caseNumber,
            freshData.caseTitle,
            freshData.nextHearingDate,
            freshData.court
          );

          if (sent) {
            storedCase.alertSent = true;
            storedCase.alertSentAt = new Date();
          }
        }

        // Save updated case
        await storedCase.save();

      } catch (error) {
        console.error(`Error processing case ${storedCase.caseNumber}:`, error.message);
      }
    }

    console.log('✅ Case monitoring completed\n');

  } catch (error) {
    console.error('❌ Error in monitorCases:', error.message);
  }
}

// ==================== Routes ====================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Add a new case to monitor
 * POST /api/cases
 * Body: { caseNumber: "ABC123456", userPhone: "+91XXXXXXXXXX" }
 */
app.post('/api/cases', async (req, res) => {
  try {
    const { caseNumber } = req.body;

    if (!caseNumber) {
      return res.status(400).json({ error: 'caseNumber is required' });
    }

    // Check if case already exists
    const existing = await Case.findOne({ caseNumber });
    if (existing) {
      return res.status(400).json({ error: 'Case already being monitored' });
    }

    // Fetch case details from eCourts
    const caseData = await fetchCaseFromEcourts(caseNumber);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found on eCourts' });
    }

    // Create and save case
    const newCase = new Case({
      caseNumber,
      caseTitle: caseData.caseTitle,
      nextHearingDate: caseData.nextHearingDate,
    });

    await newCase.save();

    res.status(201).json({
      message: 'Case added successfully',
      case: newCase
    });

  } catch (error) {
    console.error('Error adding case:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all monitored cases
 * GET /api/cases
 */
app.get('/api/cases', async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific case
 * GET /api/cases/:caseNumber
 */
app.get('/api/cases/:caseNumber', async (req, res) => {
  try {
    const caseData = await Case.findOne({ caseNumber: req.params.caseNumber });
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a case from monitoring
 * DELETE /api/cases/:caseNumber
 */
app.delete('/api/cases/:caseNumber', async (req, res) => {
  try {
    const result = await Case.findOneAndDelete({ caseNumber: req.params.caseNumber });
    if (!result) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json({ message: 'Case removed from monitoring' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manually trigger monitoring (for testing)
 * POST /api/monitor
 */
app.post('/api/monitor', async (req, res) => {
  try {
    await monitorCases();
    res.json({ message: 'Monitoring triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Database Connection ====================

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// ==================== Cron Job Scheduling ====================

// Run monitoring every 24 hours at 8 AM
// You can adjust the cron expression based on your timezone
// Format: second minute hour day-of-month month day-of-week
cron.schedule('0 8 * * *', () => {
  console.log('⏰ Scheduled monitoring job triggered');
  monitorCases();
});

// Optional: Also run every 6 hours for more frequent checks
cron.schedule('0 */6 * * *', () => {
  console.log('⏰ 6-hourly monitoring job triggered');
  monitorCases();
});

// ==================== Server Start ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 eCourts WhatsApp Automation running on port ${PORT}`);
  console.log(`📍 Base URL will be your Render/Railway domain`);
  console.log(`🔗 Health check: /health`);
  console.log(`📝 Monitoring will run automatically via cron jobs`);
});

module.exports = app;
