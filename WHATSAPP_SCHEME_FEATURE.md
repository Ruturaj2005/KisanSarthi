# 📱 Aapla Sarkar WhatsApp Scheme Notifications

## Overview
Automatically fetch ALL government schemes from Aapla Sarkar portal (https://aaplesarkar.mahaonline.gov.in) and send WhatsApp notifications to farmers who register their WhatsApp number. No admin matching needed - ALL schemes notify ALL farmers.

---

## Phase 1: Database Schema

### 1. Update Farmer Model
Add WhatsApp fields:
```javascript
whatsappNumber: {
  type: String,
  default: null,
  match: [/^[6-9]\d{9}$/, 'Valid Indian phone number (10 digits)'],
},
whatsappVerified: {
  type: Boolean,
  default: false,
},
notificationsEnabled: {
  type: Boolean,
  default: true,
}
```

### 2. Create Scheme Model
File: `backend/src/models/Scheme.model.js`
```javascript
{
  externalId: String,        // ID from Aapla Sarkar
  title: String,             // Scheme name
  description: String,       // Full description
  benefits: String,          // What farmer gets
  eligibility: String,       // Eligibility criteria
  applicationUrl: String,    // Direct link to apply
  portal: String,            // "aapla_sarkar"
  category: String,          // loan, subsidy, insurance, etc.
  state: String,             // Maharashtra (default)
  scrappedAt: Date,          // When we fetched it
  createdAt: Date,
  updatedAt: Date,
}
```

### 3. Create SchemeNotification Model
File: `backend/src/models/SchemeNotification.model.js`
```javascript
{
  farmerId: ObjectId,
  schemeId: ObjectId,
  whatsappNumber: String,
  status: String,            // pending, sent, failed
  messageId: String,         // Twilio message ID
  sentAt: Date,
  createdAt: Date,
}
```

---

## Phase 2: Backend Services

### 1. Aapla Sarkar Scraper
File: `backend/src/services/aaplaSarkar.service.js`
```javascript
// Fetch schemes from https://aaplesarkar.mahaonline.gov.in
const fetchNewSchemes = async () => {
  // Option 1: Use Cheerio for web scraping
  // Option 2: Check if Aapla Sarkar has public API
  // Return array of new schemes not in DB
}
```

### 2. WhatsApp Service
File: `backend/src/services/whatsapp.service.js`
```javascript
const sendSchemeNotification = async (farmers, scheme) => {
  for (const farmer of farmers) {
    if (!farmer.whatsappNumber) continue;
    
    const message = `
📢 नई सरकारी योजना

🎯 ${scheme.title}
लाभ: ${scheme.benefits}

🔗 आवेदन: ${scheme.applicationUrl}

Aapla Sarkar पोर्टल से
KisanSaathi द्वारा
    `;
    
    await twilioClient.messages.create({
      from: `whatsapp:${TWILIO_PHONE}`,
      to: `whatsapp:+91${farmer.whatsappNumber}`,
      body: message,
    });
  }
}
```

### 3. Cron Job
Update `backend/src/services/cron.service.js`
```javascript
// Run daily at 8 AM
schedule.scheduleJob('0 8 * * *', async () => {
  const newSchemes = await fetchNewSchemes();
  
  if (newSchemes.length === 0) return;
  
  const farmers = await Farmer.find({
    whatsappNumber: { $exists: true, $ne: null },
    notificationsEnabled: true,
  });
  
  for (const scheme of newSchemes) {
    await sendSchemeNotification(farmers, scheme);
  }
});
```

---

## Phase 3: API Endpoints

### 1. Update Profile - Add WhatsApp
```bash
PATCH /api/farmer/profile

Request:
{
  "whatsappNumber": "9876543210"
}

Response: { farmer: {...} }
```

### 2. Get All Schemes
```bash
GET /api/farmer/schemes

Response:
[
  {
    "title": "PM Kisan",
    "benefits": "₹6000/year",
    "applicationUrl": "...",
    "notifiedAt": "2024-04-18"
  }
]
```

### 3. Toggle Notifications
```bash
PATCH /api/farmer/preferences

Request:
{
  "notificationsEnabled": true
}
```

### 4. Manual Sync (Admin)
```bash
POST /api/admin/schemes/sync

Manually trigger Aapla Sarkar fetch + notifications
```

---

## Phase 4: Frontend Components

### 1. Profile Page - WhatsApp Field
```jsx
<input 
  type="tel"
  placeholder="10-digit number"
  name="whatsappNumber"
  maxLength="10"
  onChange={handleWhatsApp}
/>
```

### 2. Dashboard - Schemes Section
```jsx
<section className="schemes">
  <h3>📢 सरकारी योजनाएं</h3>
  {schemes.map(scheme => (
    <div className="scheme-card">
      <h4>{scheme.title}</h4>
      <p>{scheme.benefits}</p>
      <a href={scheme.applicationUrl}>आवेदन करें</a>
    </div>
  ))}
</section>
```

### 3. Notification Settings
Allow user to enable/disable WhatsApp notifications

---

## Setup Instructions

### Step 1: Update Farmer Model
```bash
# Edit: backend/src/models/Farmer.model.js
# Add: whatsappNumber, whatsappVerified, notificationsEnabled
```

### Step 2: Create Models
```bash
# Create: backend/src/models/Scheme.model.js
# Create: backend/src/models/SchemeNotification.model.js
```

### Step 3: Setup Twilio
```bash
# 1. Go to: https://www.twilio.com/console/whatsapp
# 2. Setup WhatsApp Business Account
# 3. Get: Account SID, Auth Token, Phone Number
```

### Step 4: Add to .env
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=+14155238886
WHATSAPP_ENABLED=true
```

### Step 5: Create Services
```bash
# Create: backend/src/services/aaplaSarkar.service.js
# Create: backend/src/services/whatsapp.service.js
```

### Step 6: Add API Endpoints
```bash
# Create: backend/src/routes/scheme.routes.js
# Create: backend/src/controllers/scheme.controller.js
```

### Step 7: Add Cron Job
```bash
# Update: backend/src/services/cron.service.js
# Add daily 8 AM sync
```

### Step 8: Update Frontend
```bash
# Update: Profile form (add WhatsApp input)
# Update: Dashboard (add schemes section)
# Create: Notification settings
```

---

## Workflow

```
1. Farmer registers WhatsApp number in profile
   ↓
2. Every day at 8 AM, cron job runs:
   - Fetch new schemes from Aapla Sarkar
   - Compare with DB (find new ones)
   - Send to ALL farmers with WhatsApp
   ↓
3. Farmer receives WhatsApp message
   ↓
4. Farmer can click link to apply
   ↓
5. Farmer also sees scheme in dashboard
```

---

## Key Points

✅ Fetches from official Aapla Sarkar portal
✅ ALL schemes to ALL farmers (no filtering)
✅ WhatsApp via Twilio
✅ Runs daily automatically
✅ Farmer can disable notifications
✅ Track which farmers received which scheme
✅ Bilingual messages (Hindi + English)
✅ Retry failed deliveries

---

## Timeline

- Database models: **1 day**
- Services (scraper + WhatsApp): **2 days**
- API endpoints: **1 day**
- Frontend: **1 day**
- Testing: **1 day**
- **Total: ~1 week**

---

## Ready to Implement?

Should I start with:
1. **Backend models first** - Get database ready
2. **Full backend** - Models + services + APIs
3. **Everything** - Backend + frontend together

Which would you prefer? 🚀
