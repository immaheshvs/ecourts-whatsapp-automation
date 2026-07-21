# eCourts WhatsApp Automation - API Quick Reference

Use these commands to manage your monitored cases.

---

## Setup Your URL

Replace `https://your-app.onrender.com` with your actual Render/Railway URL.

Example: `https://ecourts-whatsapp-automation.onrender.com`

---

## 1. Add a Case to Monitor

```bash
curl -X POST https://your-app.onrender.com/api/cases \
  -H "Content-Type: application/json" \
  -d '{"caseNumber": "ABC123456"}'
```

**Response (Success):**
```json
{
  "message": "Case added successfully",
  "case": {
    "_id": "507f1f77bcf86cd799439011",
    "caseNumber": "ABC123456",
    "caseTitle": "State v. John Doe",
    "nextHearingDate": "2024-01-15T00:00:00.000Z",
    "lastChecked": "2024-01-08T10:30:00.000Z",
    "alertSent": false,
    "status": "active",
    "createdAt": "2024-01-08T10:30:00.000Z"
  }
}
```

---

## 2. View All Cases

```bash
curl https://your-app.onrender.com/api/cases
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "caseNumber": "ABC123456",
    "caseTitle": "State v. John Doe",
    "nextHearingDate": "2024-01-15T00:00:00.000Z",
    "lastChecked": "2024-01-08T10:30:00.000Z",
    "alertSent": false,
    "status": "active",
    "createdAt": "2024-01-08T10:30:00.000Z"
  },
  {
    "caseNumber": "XYZ789012",
    "caseTitle": "Civil case ABC",
    "nextHearingDate": "2024-01-20T00:00:00.000Z",
    "alertSent": true,
    "alertSentAt": "2024-01-09T08:15:00.000Z",
    "status": "active"
  }
]
```

---

## 3. Get Specific Case Details

```bash
curl https://your-app.onrender.com/api/cases/ABC123456
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "caseNumber": "ABC123456",
  "caseTitle": "State v. John Doe",
  "nextHearingDate": "2024-01-15T00:00:00.000Z",
  "lastChecked": "2024-01-08T10:30:00.000Z",
  "alertSent": false,
  "status": "active",
  "createdAt": "2024-01-08T10:30:00.000Z"
}
```

---

## 4. Remove a Case

```bash
curl -X DELETE https://your-app.onrender.com/api/cases/ABC123456
```

**Response (Success):**
```json
{
  "message": "Case removed from monitoring"
}
```

**Response (Case not found):**
```json
{
  "error": "Case not found"
}
```

---

## 5. Manually Trigger Monitoring

(Use this for testing - don't normally need to call this)

```bash
curl -X POST https://your-app.onrender.com/api/monitor
```

**Response:**
```json
{
  "message": "Monitoring triggered successfully"
}
```

**What this does:**
- Checks all active cases
- Fetches fresh data from eCourts API
- If hearing is tomorrow and alert not sent → sends WhatsApp message
- Updates database with latest status

---

## 6. Health Check

(Check if service is running)

```bash
curl https://your-app.onrender.com/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-08T10:30:00.000Z"
}
```

---

## Using in Scripts

### Bash Script - Add Multiple Cases

```bash
#!/bin/bash

# cases.txt
ABC123456
XYZ789012
PQR345678

API_URL="https://your-app.onrender.com"

while IFS= read -r caseNumber; do
  echo "Adding case: $caseNumber"
  curl -X POST "$API_URL/api/cases" \
    -H "Content-Type: application/json" \
    -d "{\"caseNumber\": \"$caseNumber\"}"
  echo ""
done < cases.txt
```

Run:
```bash
chmod +x add_cases.sh
./add_cases.sh
```

### Python Script - Monitor Cases

```python
import requests
import json

API_URL = "https://your-app.onrender.com"

def add_case(case_number):
    response = requests.post(
        f"{API_URL}/api/cases",
        json={"caseNumber": case_number}
    )
    return response.json()

def get_all_cases():
    response = requests.get(f"{API_URL}/api/cases")
    return response.json()

def get_case(case_number):
    response = requests.get(f"{API_URL}/api/cases/{case_number}")
    return response.json()

def remove_case(case_number):
    response = requests.delete(f"{API_URL}/api/cases/{case_number}")
    return response.json()

def trigger_monitoring():
    response = requests.post(f"{API_URL}/api/monitor")
    return response.json()

# Example usage
if __name__ == "__main__":
    # Add a case
    result = add_case("ABC123456")
    print(f"Added: {result}")
    
    # Get all cases
    cases = get_all_cases()
    print(f"Total cases: {len(cases)}")
    
    # Trigger monitoring
    result = trigger_monitoring()
    print(f"Monitoring: {result}")
```

Run:
```bash
pip install requests
python script.py
```

### Node.js Script - Bulk Operations

```javascript
const axios = require('axios');

const API_URL = 'https://your-app.onrender.com';

async function addCase(caseNumber) {
  try {
    const response = await axios.post(`${API_URL}/api/cases`, {
      caseNumber
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

async function getAllCases() {
  const response = await axios.get(`${API_URL}/api/cases`);
  return response.data;
}

async function removeCase(caseNumber) {
  const response = await axios.delete(`${API_URL}/api/cases/${caseNumber}`);
  return response.data;
}

async function main() {
  // Add multiple cases
  const casesToAdd = ['ABC123456', 'XYZ789012', 'PQR345678'];
  
  for (const caseNum of casesToAdd) {
    console.log(`Adding ${caseNum}...`);
    const result = await addCase(caseNum);
    console.log(result.message);
  }
  
  // View all
  const allCases = await getAllCases();
  console.log(`\nTotal cases: ${allCases.length}`);
  allCases.forEach(c => {
    console.log(`- ${c.caseNumber}: ${c.caseTitle}`);
  });
}

main();
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "error": "caseNumber is required"
}
```

### 404 - Not Found
```json
{
  "error": "Case not found on eCourts"
}
```

### 500 - Server Error
```json
{
  "error": "error message here"
}
```

---

## Rate Limiting

- Add case: 1 per 5 seconds recommended
- Get cases: No limit
- Monitor: Can run manually anytime (auto-runs on schedule)

---

## Testing Your Setup

### Step 1: Verify API is working
```bash
curl https://your-app.onrender.com/health
```

Should return: `{"status":"ok",...}`

### Step 2: Add a test case
```bash
curl -X POST https://your-app.onrender.com/api/cases \
  -H "Content-Type: application/json" \
  -d '{"caseNumber": "ABC123456"}'
```

Should return success response.

### Step 3: Trigger monitoring
```bash
curl -X POST https://your-app.onrender.com/api/monitor
```

Check your WhatsApp in 10-15 seconds!

### Step 4: Check case status
```bash
curl https://your-app.onrender.com/api/cases/ABC123456
```

Should show alert status if triggered.

---

## Useful cURL Options

```bash
# Pretty print JSON
curl ... | json_pp
# or
curl ... | python -m json.tool

# Save response to file
curl ... > response.json

# Show headers
curl -i ...

# Verbose output (debugging)
curl -v ...

# Set custom headers
curl -H "X-Custom-Header: value" ...

# Add timeout (seconds)
curl --max-time 10 ...
```

---

## Tips

✅ **Best Practices:**
- Store API URL in environment variable
- Don't hardcode credentials
- Check health endpoint before batch operations
- Use case number format from eCourts exactly
- Monitor logs in Render/Railway dashboard

❌ **Don't:**
- Call `/api/monitor` more than once per minute
- Add same case number twice (use unique identifiers)
- Share your app URL with security-sensitive info
- Store passwords in request bodies

---

**Need help?** Check the main README.md or DEPLOYMENT_GUIDE.md
