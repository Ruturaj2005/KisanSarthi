# 📋 WhatsApp Agriculture Scheme Feature - Implementation Plan

## Overview
Add feature to send WhatsApp notifications about new agriculture schemes to farmers based on their preferences and location.

---

## Phase 1: Database Updates

### 1. Update Farmer Model
Add WhatsApp contact field:
```javascript
whatsappNumber: {
  type: String,
  default: null,
  match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'],
}
```

### 2. Create Scheme Model
New file: `backend/src/models/Scheme.model.js`
```
- schemeId
- name
- description
- category (loan, subsidy, insurance, tech, input)
- eligibility (crop type, landSize, state, soilType)
- benefits (text)
- applicationUrl
- deadline
- state (applicable to)
- createdAt
- updatedAt
```

### 3. Create SchemeNotification Model
Track which farmers were notified about which schemes:
```
- farmerId
- schemeId
- status (pending, sent, failed)
- sentAt
- createdAt
```

---

## Phase 2: Backend - API Endpoints

### 1. Farmer Profile Update
**POST** `/api/farmer/profile`
- Add/update `whatsappNumber`
- Validate phone format
- Response includes WhatsApp consent

### 2. Scheme Management (Admin)
**POST** `/api/admin/schemes` (admin only)
- Create new scheme
- Auto-match eligible farmers
- Trigger notifications

**GET** `/api/admin/schemes`
- List all schemes
- Filter by category, state, status

**PUT** `/api/admin/schemes/:id`
- Update scheme details

### 3. Farmer View Schemes
**GET** `/api/farmer/schemes`
- Get relevant schemes for farmer
- Based on: location, crops, landSize
- Show notification status

---

## Phase 3: WhatsApp Integration

### Setup Twilio (Recommended)

1. **Sign up**: https://www.twilio.com/whatsapp
2. **Get credentials**: Account SID, Auth Token
3. **Configure WhatsApp Sandbox**

### Add to `backend/.env`
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+14155238886  (Twilio sandbox)
TWILIO_WEBHOOK_URL=http://your-domain/webhook/whatsapp
```

### Create WhatsApp Service
File: `backend/src/services/whatsapp.service.js`
```javascript
const sendSchemeNotification = async (farmerPhone, schemeName, url) => {
  // Send WhatsApp message via Twilio
  // Message format: "नमस्ते! नई कृषि योजना: {schemeName}"
}
```

### Message Template
```
📢 नई कृषि योजना / New Agriculture Scheme

योजना: {scheme_name}
लाभ: {benefit_summary}
आवेदन: {link}

यह योजना आपके क्षेत्र के लिए उपलब्ध है।
```

---

## Phase 4: Matching Logic

### Match Farmers to Schemes
```javascript
Eligible if:
- Location matches (state)
- Crop matches (primary crops)
- Land size in range (if applicable)
- Soil type matches (if applicable)
- WhatsApp number provided
```

---

## Phase 5: Frontend Updates

### 1. Profile Page
Add WhatsApp input:
```jsx
<input 
  type="tel" 
  placeholder="+91 XXXXX XXXXX"
  name="whatsappNumber"
/>
```

### 2. Schemes Section
New page: `/schemes`
- Display eligible schemes
- Show scheme details
- Link to apply
- Mark as "Notified via WhatsApp"

---

## Implementation Steps

### Step 1: Update Database Schema
```bash
# 1. Update Farmer model
# 2. Create Scheme model
# 3. Create SchemeNotification model
# 4. Run seed script if needed
```

### Step 2: Create Backend Endpoints
```bash
# 1. PATCH /api/farmer/profile (WhatsApp update)
# 2. POST /api/admin/schemes (Create scheme)
# 3. GET /api/farmer/schemes (List schemes)
```

### Step 3: Setup Twilio
```bash
# 1. Create Twilio account
# 2. Add WhatsApp business number
# 3. Add credentials to .env
```

### Step 4: WhatsApp Service
```bash
# 1. Create whatsapp.service.js
# 2. Implement sendSchemeNotification()
# 3. Add retry logic
```

### Step 5: Admin Job/Cron
```bash
# 1. Daily cron: Check for new schemes
# 2. Match farmers automatically
# 3. Send notifications
```

### Step 6: Frontend Components
```bash
# 1. Update profile form (WhatsApp)
# 2. Create schemes list page
# 3. Add scheme details modal
```

---

## API Examples

### Update Profile with WhatsApp
```bash
PATCH /api/farmer/profile
{
  "whatsappNumber": "+919876543210"
}
```

### Create New Scheme (Admin)
```bash
POST /api/admin/schemes
{
  "name": "PM Kisan Samman Nidhi",
  "description": "Direct income support to farmers",
  "category": "subsidy",
  "benefits": "₹6000 per year",
  "state": ["Maharashtra", "Karnataka"],
  "eligibility": {
    "minLandSize": 0,
    "maxLandSize": 100,
    "crops": ["wheat", "rice"],
    "soilTypes": ["all"]
  },
  "applicationUrl": "https://pm-kisan.gov.in",
  "deadline": "2025-12-31"
}
```

### Get Farmer's Schemes
```bash
GET /api/farmer/schemes

Response:
[
  {
    "schemeId": "...",
    "name": "PM Kisan",
    "category": "subsidy",
    "benefits": "₹6000/year",
    "notified": true,
    "sentAt": "2024-04-18"
  }
]
```

---

## Message Flow

```
1. Admin adds new scheme
   ↓
2. Backend matches eligible farmers
   ↓
3. For each farmer:
   - Create SchemeNotification record
   - Send WhatsApp message via Twilio
   - Mark as sent/failed
   ↓
4. Farmer receives WhatsApp
   - Clicks link
   - Opens application
   ↓
5. Farmer can see notification in app
```

---

## Key Features

✅ Automatic farmer matching
✅ WhatsApp notifications (Twilio)
✅ Admin scheme management
✅ Farmer view eligible schemes
✅ Profile WhatsApp number
✅ Notification tracking
✅ Multilingual support
✅ Error handling & retry

---

## Files to Create/Update

### Create:
- `backend/src/models/Scheme.model.js`
- `backend/src/models/SchemeNotification.model.js`
- `backend/src/services/whatsapp.service.js`
- `backend/src/controllers/scheme.controller.js`
- `backend/src/routes/scheme.routes.js`

### Update:
- `backend/src/models/Farmer.model.js` (add whatsappNumber)
- `backend/src/controllers/farmer.controller.js` (update profile)
- `backend/src/services/cron.service.js` (add daily job)

### Frontend:
- `frontend/src/pages/schemes/index.js`
- `frontend/src/components/SchemeCard.js`
- Update profile form

---

## Timeline

- **Database**: 1 day
- **Backend APIs**: 2 days
- **Twilio Setup**: 1 day
- **Frontend**: 2 days
- **Testing**: 1 day
- **Total**: ~1 week

---

## Next Steps

1. ✅ Confirm approach with team
2. ⏭️ Start with database schema updates
3. ⏭️ Create models
4. ⏭️ Setup Twilio account
5. ⏭️ Build APIs
6. ⏭️ Build frontend

Ready to start? 🚀
