---

# KISANSAATHI — ENHANCED MASTER PROMPT FOR CLAUDE OPUS

---

## ROLE & COGNITIVE FRAME

You are a **senior full-stack architect and product engineer** with deep expertise in:
- **Distributed systems** design for low-bandwidth, mobile-first emerging markets
- **Multilingual NLP** and i18n for Indic scripts with RTL/LTR considerations
- **AgriTech domain knowledge**: ICAR guidelines, Agmarknet data structures, Indian farming seasons (Kharif/Rabi/Zaid), MSP pricing, soil classification systems used in India
- **AI/ML integration**: Prompt engineering for structured JSON outputs, ONNX inference pipelines, confidence calibration
- **Production hardening**: Rate limiting, graceful degradation, offline-first PWA strategies

You **think before you code**. For every file you generate, you first output a 3-line architectural rationale explaining *why* this design was chosen over alternatives. Then you produce the complete, production-grade implementation.

**Non-negotiable quality bar**: Every file you produce must be deployable as-is. No TODOs, no placeholder comments, no stub functions. If a dependency is needed, declare it.

---

## PROJECT IDENTITY

| Attribute | Value |
|-----------|-------|
| **Name** | KisanSaathi ("Farmer's Companion") |
| **Mission** | Democratize precision agriculture for India's 120M+ small and marginal farmers |
| **Core Insight** | 68% of target users have <8th grade literacy. The UX must communicate through icons, color, voice, and spoken numbers — not walls of text. |
| **Stack** | Next.js 14 (App Router) · Express · MongoDB Atlas · Gemini 1.5 Flash · FastAPI + ONNX |
| **Languages** | Hindi · Marathi · Punjabi · Telugu · Tamil · English |
| **Deployment** | Vercel + Railway + HuggingFace Spaces |
| **Design System** | Organic-earthy: forest greens, harvest amber, soil browns — evokes land and growth |

---

## ARCHITECTURAL PRINCIPLES (Claude must internalize these)

### 1. Graceful Degradation Ladder
Every feature must work across this degradation chain:
```
Full experience (4G + GPS + camera)
  → Partial (2G: disable images, use text summaries)
    → Minimal (offline: serve last cached advisory from IndexedDB)
```
Implement Service Worker caching strategy in `next.config.js`.

### 2. AI Prompt Contract
All Gemini calls must follow this contract — **no exceptions**:
```js
// gemini.service.js — STRICT PATTERN
const SYSTEM_PREFIX = `You are KisanSaathi. RULES:
1. Always reply in valid JSON only — no markdown, no prose outside JSON.
2. Language: {lang}. Use vocabulary a 7th-grade farmer understands.
3. If uncertain, say so in the 'confidence' field (0-1).
4. Never invent chemical names, doses, or scientific claims. Use ICAR data only.
5. JSON schema: { advice, steps[], urgency, confidence, sources[], warnings[] }`;
```
Parse defensively: strip ` ```json ``` ` fences → `JSON.parse` → validate shape with Zod on the server before returning to client.

### 3. Farmer-Centric Error Messages
Never show raw error strings. Map every `error.code` to a translated, farmer-friendly message:
```js
// Example: instead of "JWT_EXPIRED" → "आपका सत्र समाप्त हो गया। कृपया पुनः लॉग इन करें।"
```
Define the full error→message map in `utils/farmerMessages.js`.

### 4. Data Sovereignty
Farmer's location coordinates must **never** be logged in plaintext. Hash with SHA-256 before any logging or analytics storage.

### 5. Idempotency Keys
All POST routes that trigger external calls (OTP email, market fetch, Gemini) must accept an `X-Idempotency-Key` header and deduplicate within a 30-second window using an in-memory TTL cache (`lru-cache`).

---

## MONOREPO STRUCTURE

```
kisansaathi/
├── frontend/                     # Next.js 14 App Router
│   ├── public/
│   │   ├── locales/              # 6 language JSON files
│   │   ├── icons/                # SVG crop & pest icons
│   │   └── manifest.json         # PWA manifest (offline support)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/           # login · register (OTP wizard)
│   │   │   ├── (farmer)/         # dashboard · chat · scan · market · soil · profile
│   │   │   ├── (admin)/          # stats · farmer-list · feedback · pest-log
│   │   │   ├── api/              # Next.js Route Handlers (BFF proxy layer)
│   │   │   ├── layout.jsx        # Root layout: font loading, i18n Provider, QueryClient
│   │   │   └── page.jsx          # Landing → authenticated redirect
│   │   ├── components/
│   │   │   ├── ui/               # Button · Input · Card · Badge · Modal · Spinner · Toast
│   │   │   ├── layout/           # Navbar · BottomNav · Sidebar · LanguageSwitcher
│   │   │   ├── dashboard/        # WeatherWidget · SoilScoreWidget · AiTipCard · QuickActions
│   │   │   ├── chat/             # ChatWindow · MessageBubble · VoiceInput · QuickPromptChips
│   │   │   ├── scan/             # ImageUploader · ScanResult · ConfidenceBar · ScanHistory
│   │   │   ├── market/           # PriceTable · PriceTrendChart · PriceAlertForm · MSPBadge
│   │   │   └── soil/             # SoilForm · SoilGauge · FertilizerTable · RotationSuggest
│   │   ├── hooks/                # useAuth · useWeather · useChat · useMarket · useOffline
│   │   ├── lib/
│   │   │   ├── api.js            # Axios + JWT interceptor + retry logic
│   │   │   ├── auth.js           # Token storage (memory + refresh in httpOnly cookie)
│   │   │   ├── i18n.js           # next-intl config
│   │   │   ├── cache.js          # IndexedDB wrapper for offline caching
│   │   │   └── analytics.js      # Privacy-safe usage events (hashed IDs only)
│   │   ├── store/
│   │   │   └── authStore.js      # Zustand: { farmer, accessToken, isLoading }
│   │   └── styles/globals.css
│   ├── next.config.js            # i18n routes, SW registration, image domains
│   ├── tailwind.config.js        # Custom theme + Indian font stack
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/               # db.js · env.js (Zod-validated) · mailer.js
│   │   ├── models/               # 10 Mongoose models (see schemas below)
│   │   ├── routes/               # 8 route files — only routing, zero logic
│   │   ├── controllers/          # Input extraction → service call → response formatting
│   │   ├── middleware/           # auth · validate · upload · error · rateLimiter · idempotency
│   │   ├── services/             # All business logic lives here
│   │   │   ├── gemini.service.js
│   │   │   ├── weather.service.js
│   │   │   ├── market.service.js
│   │   │   ├── soil.service.js
│   │   │   ├── mailer.service.js
│   │   │   ├── cloudinary.service.js
│   │   │   └── cron.service.js
│   │   ├── utils/                # generateOtp · hashToken · apiResponse · logger · farmerMessages
│   │   ├── validators/           # express-validator chains per route
│   │   └── app.js
│   ├── server.js
│   └── package.json
│
├── ml-service/                   # FastAPI + ONNX
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, lifespan (load model once)
│   │   ├── model/plant_disease.onnx
│   │   ├── routes/predict.py
│   │   └── utils/
│   │       ├── preprocess.py     # 224×224 resize + ImageNet normalization
│   │       └── labels.py         # 38 PlantVillage class labels
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ENVIRONMENT VARIABLES

```bash
# ── Backend ──────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/kisansaathi
JWT_SECRET=                        # min 64 chars, random
JWT_REFRESH_SECRET=                # separate secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=                         # Gmail App Password
SMTP_FROM="KisanSaathi <noreply@kisansaathi.in>"

GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash      # locked — never upgrade without testing
GEMINI_RATE_LIMIT_RPM=60           # free tier guard

OWM_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ML_SERVICE_URL=http://localhost:8000

IDEMPOTENCY_TTL_MS=30000           # 30-second dedup window

# ── Frontend ──────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=KisanSaathi
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_DEFAULT_LANG=hi
```

---

## MONGOOSE SCHEMAS (Complete — with all indexes)

### Farmer.model.js
```js
// Rationale: Denormalized profile reduces joins on every advisory. 
// refreshToken hashed in DB — plain token only in HTTP response.
{
  name:          { type: String, required: true, trim: true },
  email:         { type: String, unique: true, required: true, lowercase: true },
  passwordHash:  { type: String, default: null },
  role:          { type: String, enum: ['farmer','admin'], default: 'farmer' },
  isVerified:    { type: Boolean, default: false },
  otp:           { type: String, default: null },   // bcrypt hashed
  otpExpiresAt:  { type: Date, default: null },
  location: {
    state:       String,
    district:    String,
    lat:         Number,   // never logged plaintext — hashed in analytics
    lng:         Number
  },
  landSize:      Number,  // acres
  soilType:      { type: String, enum: ['loamy','sandy','clay','silt','alluvial'] },
  irrigationSrc: { type: String, enum: ['rain','canal','borewell','drip','none'] },
  primaryCrops:  { type: [String], validate: v => v.length <= 10 },
  preferredLang: { type: String, enum: ['en','hi','mr','pa','te','ta'], default: 'hi' },
  refreshToken:  { type: String, default: null },  // hashed
  // Indexes: email (unique), role
}
```

### Advisory.model.js
```js
{
  farmerId:        { type: ObjectId, ref: 'Farmer', required: true, index: true },
  type:            { type: String, enum: ['crop','pest','weather','soil','market','general'] },
  queryText:       String,
  contextSnapshot: Object,  // { soilType, crop, season, weather } at query time
  aiResponse:      String,
  steps:           [String],
  urgency:         { type: String, enum: ['low','medium','high'] },
  confidence:      Number,  // 0–1 from Gemini
  language:        String,
  rating:          { type: Number, min: 1, max: 5, default: null },
  feedbackComment: String,
  // Compound index: farmerId + createdAt DESC for history queries
}
```

### SoilTest.model.js
```js
{
  farmerId:      { type: ObjectId, ref: 'Farmer', index: true },
  soilType:      String,
  ph:            { type: Number, min: 4.0, max: 9.0 },
  nitrogen:      { type: String, enum: ['low','medium','high'] },
  phosphorus:    { type: String, enum: ['low','medium','high'] },
  potassium:     { type: String, enum: ['low','medium','high'] },
  moisture:      { type: String, enum: ['low','medium','high'] },
  healthScore:   { type: Number, min: 0, max: 100 },  // computed server-side
  crop:          String,
  aiExplanation: String,
  // Index: farmerId
}
```

### MarketPrice.model.js
```js
{
  commodity:   String,
  state:       String,
  district:    String,
  mandi:       String,
  minPrice:    Number,   // Rs/quintal
  maxPrice:    Number,
  modalPrice:  Number,
  msp:         Number,   // current MSP for this commodity (null if N/A)
  date:        { type: Date, index: true },
  source:      { type: String, default: 'agmarknet' },
  // Unique compound index: { commodity, mandi, date }
  // TTL index: date expires after 90 days
}
```

### PestDetection.model.js
```js
{
  farmerId:    { type: ObjectId, ref: 'Farmer', index: true },
  cropType:    String,
  imageUrl:    String,   // Cloudinary secure URL
  publicId:    String,   // Cloudinary public_id for deletion
  disease:     String,
  confidence:  Number,
  severity:    { type: String, enum: ['low','medium','high','critical'] },
  treatment:   [String],
  organic:     [String],
  chemical:    [String],
  geminiVerified: Boolean,  // true if Gemini was used to verify low-confidence results
}
```

> All remaining models (CropHistory, PriceAlert, WeatherAlert, Feedback, UsageEvent) follow the same pattern: required fields, enums, indexes on farmerId and date. UsageEvent has TTL of 180 days.

---

## AUTHENTICATION FLOW (Precise Implementation)

### Registration — 3-Step OTP Flow

```
Step 1: POST /api/auth/register
  Body: { name, email, password? }
  → Validate email uniqueness
  → Generate 6-digit OTP via crypto.randomInt(100000, 999999)
  → Hash OTP with bcrypt (rounds: 10)
  → Store: farmer.otp = hash, farmer.otpExpiresAt = Date.now() + 600_000
  → Send HTML email via Nodemailer (template below)
  → Respond: { message: "OTP_SENT" }  ← never confirm email existence (anti-enumeration)

Step 2: POST /api/auth/verify-otp
  Body: { email, otp }
  → Find farmer; check isVerified === false
  → bcrypt.compare(otp, farmer.otp)
  → Check otpExpiresAt > Date.now()
  → Set isVerified = true, clear otp, otpExpiresAt
  → Sign: accessToken (JWT, 15m), refreshToken (JWT, 7d)
  → Hash refreshToken → store in farmer.refreshToken
  → Respond: { accessToken, farmer: { ...sanitized } }
  → Set refreshToken in HttpOnly cookie (Secure, SameSite=Strict)

Step 3: POST /api/auth/complete-profile  (after OTP verification)
  Body: { landSize, soilType, irrigationSrc, primaryCrops, location }
  Middleware: verifyToken
  → Update farmer profile fields
```

### OTP Email Template (HTML)
```html
<!-- Forest green header, white body, large OTP number in amber box,
     10-minute validity notice, do-not-reply footer in 3 languages -->
Subject: "आपका KisanSaathi OTP: {otp} | Your OTP: {otp}"
```

### Token Strategy
```
Access Token : JWT · 15 min · Authorization: Bearer {token}
Refresh Token: JWT · 7 days · HttpOnly cookie · hashed copy in DB
POST /api/auth/refresh → verify cookie token → hash → compare DB → new access token
POST /api/auth/logout  → clear cookie + null farmer.refreshToken
```

---

## GEMINI AI SERVICE (Complete Contract)

```js
// gemini.service.js
// ALL six advisory types funnel through one buildPrompt() factory

const PERSONA = `You are KisanSaathi, India's trusted farm advisor.
Your advice is grounded in ICAR recommendations and local mandi intelligence.
NEVER invent chemical names, dosages, or statistical claims.
Respond ONLY in valid JSON. Language: {lang}.`;

// Advisory prompt — context injection
function buildAdvisoryPrompt(ctx, query) {
  return `
Farmer context:
- Location: ${ctx.district}, ${ctx.state}
- Soil: ${ctx.soilType}, pH ${ctx.ph}
- Current crop: ${ctx.crop} (${ctx.daysGrown} days grown → stage: ${estimateStage(ctx)})
- Season: ${ctx.season} (Kharif/Rabi/Zaid based on month)
- Weather: ${ctx.weather.condition}, ${ctx.weather.temp}°C, ${ctx.weather.humidity}% humidity
- Recent crops: ${ctx.lastTwoSeasons.join(' → ')}

Farmer's question: "${query}"

Reply in JSON only:
{
  "advice": "<2-3 simple sentences in ${ctx.lang}>",
  "steps": ["<step 1>", "<step 2>", ...],
  "urgency": "low|medium|high",
  "confidence": 0.0-1.0,
  "sources": ["ICAR 2023", ...],
  "warnings": ["<any safety warnings>"]
}`;
}

// Growth stage estimator (no AI needed — pure logic)
function estimateStage(ctx) {
  const d = ctx.daysGrown;
  if (d < 20) return 'germination';
  if (d < 45) return 'vegetative';
  if (d < 75) return 'flowering';
  if (d < 100) return 'fruiting';
  return 'maturity';
}

// Defensive JSON parser — used after EVERY Gemini call
function parseGeminiJSON(raw) {
  const stripped = raw.replace(/```json|```/gi, '').trim();
  const parsed = JSON.parse(stripped);
  // Zod validate shape before returning
  return advisorySchema.parse(parsed);
}
```

**Gemini features map:**

| Feature | Prompt Type | Max Tokens |
|---------|-------------|------------|
| Crop advisory chat | `buildAdvisoryPrompt()` | 800 |
| Soil explanation | `soilExplainPrompt()` | 400 |
| Weather action | `weatherAdvisoryPrompt()` | 200 |
| Low-confidence pest | `pestVerifyPrompt(labels[])` | 300 |
| Fertilizer dosage | `fertilizerPrompt()` | 400 |

---

## SOIL HEALTH SCORING ENGINE

```js
// soil.service.js — deterministic, testable, no AI needed

const WEIGHTS = { ph: 0.20, nitrogen: 0.25, phosphorus: 0.20, potassium: 0.20, moisture: 0.15 };

function scorePH(ph) {
  if (ph >= 6.0 && ph <= 7.5) return 100;
  if ((ph >= 5.5 && ph < 6.0) || (ph > 7.5 && ph <= 8.0)) return 70;
  if ((ph >= 5.0 && ph < 5.5) || (ph > 8.0 && ph <= 8.5)) return 40;
  return 15;
}
const scoreNutrient = v => ({ high: 100, medium: 60, low: 20 }[v]);

function computeHealthScore(data) {
  return Math.round(
    scorePH(data.ph)             * WEIGHTS.ph +
    scoreNutrient(data.nitrogen) * WEIGHTS.nitrogen +
    scoreNutrient(data.phosphorus)* WEIGHTS.phosphorus +
    scoreNutrient(data.potassium) * WEIGHTS.potassium +
    scoreNutrient(data.moisture)  * WEIGHTS.moisture
  );
}

// ICAR fertilizer table (kg/acre) — 14 major crops
const FERTILIZER_BASE = {
  Rice:      { N: 60, P: 30, K: 30 },
  Wheat:     { N: 60, P: 30, K: 15 },
  Maize:     { N: 60, P: 30, K: 20 },
  Cotton:    { N: 80, P: 40, K: 40 },
  Soybean:   { N: 25, P: 60, K: 40 },
  Tomato:    { N: 70, P: 50, K: 50 },
  Onion:     { N: 60, P: 40, K: 40 },
  Potato:    { N: 80, P: 60, K: 100 },
  Mustard:   { N: 60, P: 30, K: 20 },
  Chickpea:  { N: 20, P: 40, K: 20 },
  Groundnut: { N: 25, P: 50, K: 75 },
  Sugarcane: { N: 150, P: 60, K: 60 },
  Bajra:     { N: 40, P: 20, K: 20 },
  Jowar:     { N: 40, P: 20, K: 20 },
};

// Nutrient adjustments: 'high' → −30%, 'low' → +30%
function adjustForSoil(base, soilNutrients) { ... }

// pH correction recommendations
function phCorrection(ph) {
  if (ph > 7.5) return { material: 'Gypsum', qty: '100 kg/acre', alt: 'Sulfur 20 kg/acre' };
  if (ph < 6.0) return { material: 'Agricultural Lime', qty: '150 kg/acre' };
  return null;
}
```

---

## WEATHER INTELLIGENCE

```js
// weather.service.js
// Alerts engine — evaluated on every fetch, stored deduplicated

const ALERT_RULES = [
  { condition: w => w.rainfall > 30,   type: 'heavy_rain',   action: 'Delay pesticide spraying by 2 days' },
  { condition: w => w.temp > 42,        type: 'heat_wave',    action: 'Irrigate crops immediately' },
  { condition: w => w.temp < 4,         type: 'frost_risk',   action: 'Cover nursery seedlings tonight' },
  { condition: w => w.windSpeed > 40,   type: 'high_wind',    action: 'Do not spray — wind too strong' },
  { condition: w => w.humidity > 85,    type: 'fungal_risk',  action: 'Monitor crops for fungal disease' },
];

// Normalize OWM response to standard shape before storage
function normalizeWeather(owmData) { ... }

// Deduplication: don't re-alert same district+type within 24 hours
async function upsertAlerts(district, alerts) { ... }
```

---

## MARKET DATA PIPELINE

```js
// cron.service.js — runs 06:00 IST daily
// market.service.js — fetch, normalize, upsert

const COMMODITIES = ['Rice','Wheat','Maize','Cotton','Soybean','Onion',
                     'Tomato','Potato','Mustard','Chickpea','Groundnut'];
const STATES = ['Maharashtra','Punjab','UP','MP','Rajasthan','AP','Karnataka','Gujarat'];

// Agmarknet normalization — commodity names vary across records
const COMMODITY_ALIASES = {
  'PADDY': 'Rice', 'DHAN': 'Rice',
  'GEHUN': 'Wheat', 'MAKKA': 'Maize',
  // ... full alias map
};

// After price upsert → scan PriceAlert collection
// If modalPrice crosses targetPrice in correct direction → trigger alert + UsageEvent
async function checkPriceAlerts(commodity, mandi, modalPrice) { ... }
```

---

## COMPLETE API ROUTES

```
AUTH          POST /api/auth/register · /verify-otp · /login · /resend-otp
                   /refresh · /logout · /complete-profile

FARMER        GET/PUT /api/farmer/profile
              CRUD    /api/farmer/crop-history · /crop-history/:id

ADVISORY      POST /api/advisory/chat
              GET  /api/advisory/history
              POST /api/advisory/feedback

PEST          POST /api/pest/detect
              GET  /api/pest/history · /detection/:id

SOIL          POST /api/soil/test
              GET  /api/soil/tests · /recommendation

WEATHER       GET /api/weather/current · /forecast · /alerts

MARKET        GET  /api/market/prices · /trend
              POST /api/market/alerts
              DELETE /api/market/alerts/:id

ADMIN         GET /api/admin/stats · /farmers · /feedback · /pest-log
```

---

## FRONTEND DESIGN SYSTEM

### Tailwind Theme
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      forest:  { DEFAULT: '#2D6A4F', light: '#40916C', dark: '#1B4332' },
      leaf:    { DEFAULT: '#52B788', light: '#74C69D' },
      amber:   { DEFAULT: '#F4A261', dark: '#E76F51' },
      soil:    { DEFAULT: '#8B5E3C', light: '#A67C5B' },
      cream:   '#F8FAF9',
      ink:     '#1B1F1E',
      danger:  '#E63946',
      caution: '#FFB703',
    },
    fontFamily: {
      heading: ['Noto Sans', 'sans-serif'],    // All 6 Indian scripts
      body:    ['DM Sans', 'sans-serif'],
      mono:    ['JetBrains Mono', 'monospace'],
    },
    borderRadius: { card: '1rem', chip: '9999px' },
    boxShadow:    { card: '0 4px 20px rgba(45,106,79,0.10)' },
  }
}
```

### Component Contracts

**Button.jsx** — variants: `primary | secondary | ghost | danger | icon`
Touch target: min 48×48px. Always includes `aria-label` when icon-only.

**SoilGauge.jsx** — SVG arc gauge, color zones:
- 0–30: `danger` red · 31–60: `caution` amber · 61–80: `leaf` green · 81–100: `forest` dark green
- Animated fill on mount (CSS stroke-dashoffset transition 1.2s ease-out)

**PriceTrendChart.jsx** — Recharts `LineChart`
- Show modal price line + MSP reference line (dashed amber)
- Tooltip shows price in Rs/quintal + % above/below MSP

**VoiceInput.jsx** — Web Speech API
```js
// Language map for Indian voice recognition
const VOICE_LOCALE = { hi: 'hi-IN', mr: 'mr-IN', pa: 'pa-IN',
                        te: 'te-IN', ta: 'ta-IN', en: 'en-IN' };
// 400ms silence → auto-submit
// Show waveform animation while recording (CSS keyframes)
// Graceful fallback: hide button if !('SpeechRecognition' in window)
```

**MessageBubble.jsx** — TTS on AI responses
```js
// "Play" icon button on each AI message
// Uses SpeechSynthesis API, matches farmer's preferredLang voice
// Shows animated speaker icon while playing
```

---

## PAGE SPECIFICATIONS

### /dashboard
```
Top: Weather widget (temp + icon + 3-day strip + active alerts banner)
Mid: Row of 3 stat cards → Soil Score (gauge mini) | Active Crop | AI Tip
Bottom: Quick Actions → [Chat] [Scan Crop] [Check Prices] [Soil Test]
Sticky bottom nav (mobile): Home · Chat · Scan · Market · Profile
```

### /chat
```
Full-height layout. Messages scroll. Input pinned to bottom.
Language switcher (flag chips) in header.
QuickPromptChips: ["Best crop this season?", "Pest help", "When to irrigate?", ...]
Each AI response: advice text + numbered steps + urgency badge + TTS button
Image inline upload: camera icon → Cloudinary → auto-suggests pest scan redirect
```

### /scan
```
Step 1: Camera/gallery image picker + crop type selector (30 crops, searchable)
Step 2: Loading — animated plant scan UI (don't show boring spinner)
Step 3: Result card:
  - Disease name (translated) + confidence bar
  - Severity badge (color-coded)
  - Tabs: [Treatment Steps] [Organic] [Chemical]
  - "Ask KisanSaathi" CTA → opens chat with context pre-filled
Scan history: card grid with thumbnail + disease + date
```

### /market
```
Filters: State → District → Commodity (cascading dropdowns)
Price table: mandi, modal price, min/max, MSP badge (green if above MSP, red if below)
Trend chart: 7/14/30 day toggle, MSP reference line
Price Alert form: commodity + mandi + target price + direction (above/below)
```

### /soil
```
Form: soil type, pH slider (4–9 with color zones), N/P/K/moisture (Low/Med/High radio)
Crop selector: which crop is this test for?
Result:
  - Animated gauge (0–100)
  - Deficiency flags (color-coded chips for each nutrient)
  - Fertilizer table (ICAR doses, adjusted for soil)
  - pH correction recommendation
  - Crop rotation tip
  - AI explanation (plain language in farmer's language, with TTS)
```

### /admin (role-guarded)
```
Stats row: DAU · Total Farmers · Advisories Today · Scans Today
Charts:
  - Language distribution (Recharts Pie)
  - Top queried crops (Recharts Bar)
  - Advisory type split (Recharts Pie)
Tables:
  - Farmer list: name, location, crops, joined date, language (paginated + search)
  - Feedback log: rating distribution + comments
  - Pest detection log: crop, disease, confidence, severity
```

---

## ML SERVICE (FastAPI + ONNX)

```python
# main.py — model loaded ONCE at startup via lifespan context
# POST /predict:
#   Input: multipart { image: file, cropType: str }
#   Preprocess: resize 224×224, normalize ImageNet mean/std
#   ONNX inference → softmax → top-1 confidence
#   If confidence < 0.70 → return top-3 + lowConfidence: true
#   Backend then calls Gemini pestVerifyPrompt with top-3 labels for interpretation
#
# GET /health → { status: "ok", model: "efficientnet-b0", classes: 38 }

# 38 PlantVillage class labels in labels.py (Apple_scab through Tomato_Leaf_Mold)
```

---

## STANDARD API RESPONSE

```js
// utils/apiResponse.js
const ok  = (res, data, message='', status=200) =>
  res.status(status).json({ success: true, data, message });

const err = (res, message, code='INTERNAL_ERROR', status=500) =>
  res.status(status).json({ success: false, error: message, code });

// Error code → farmer-friendly message map in farmerMessages.js
const ERROR_CODES = {
  INVALID_OTP: { hi: 'गलत OTP', en: 'Incorrect OTP', ...},
  OTP_EXPIRED: { hi: 'OTP की समय सीमा समाप्त', en: 'OTP expired', ...},
  // ... all 10 codes × 6 languages
};
```

---

## CODE QUALITY STANDARDS

### Backend Rules
- `async/await` everywhere — no raw Promises, no callbacks
- Controllers: extract input → call service → format response. Zero business logic
- Services: all logic, all external calls
- Mongoose: `.lean()` on read queries that don't need document methods
- `config/env.js`: Zod-parse all env vars at startup; crash if invalid
- Winston structured logging: `{ timestamp, level, service, message, meta }`
- Rate limiter: `express-rate-limit` on auth routes (5 req/15min per IP)
- Helmet + cors configured for production domains

### Frontend Rules
- No inline styles — Tailwind utility classes only
- TanStack Query for all server state — no `useEffect` for data fetching
- React Hook Form + Zod for all forms
- All strings via `useTranslations()` — zero hardcoded UI text
- Every async operation has `isLoading`, `isError`, and empty states
- `aria-label` on all icon-only buttons; full keyboard navigation

---

## BUILD ORDER (Phase-Gated)

### Phase 1 — Foundation (build first, test before moving on)
1. Monorepo scaffold + all `package.json` files
2. `backend/src/config/` — env.js (Zod), db.js, mailer.js
3. All 10 Mongoose models with indexes
4. Auth routes + OTP email + JWT flow (fully working)
5. `auth.middleware.js` — verifyToken + isAdmin
6. Next.js + Tailwind + next-intl + Zustand + Axios setup
7. `/register` (3-step wizard) + `/login` — end-to-end OTP working

### Phase 2 — Core Features
8. Farmer profile CRUD + `/profile` page
9. Gemini service + advisory chat + `/chat` with voice input
10. Weather service + dashboard weather widget
11. Soil scoring engine + `/soil` page with animated gauge

### Phase 3 — Advanced Features
12. Market pipeline + cron + `/market` with trend chart
13. Pest detection (Cloudinary + ML + Gemini fallback) + `/scan`
14. Admin API + `/admin` dashboard

### Phase 4 — Production Hardening
15. Seed script (50 farmers, 200 market records, 100 advisories)
16. Docker Compose (all 4 services)
17. Service Worker + offline caching (IndexedDB)
18. Rate limiting, idempotency, helmet, cors
19. All 6 translation JSON files (complete, no missing keys)
20. README.md with setup, env vars, and demo credentials

---

## OPUS-SPECIFIC INSTRUCTIONS

1. **Think in phases, not files.** Before generating any code, state which phase you're in, what this file's responsibility is, and what it explicitly does NOT do (boundaries matter).

2. **Cite tradeoffs.** If you choose one approach over another (e.g. JWT over sessions, Zod over Joi), say why in one sentence.

3. **Test-first mindset.** For every service function, include a JSDoc `@example` with sample input and expected output. This doubles as documentation and implicit test specification.

4. **Fail loudly in dev, fail gracefully in prod.** All environment validation happens at startup with clear console errors. User-facing errors are always translated and never expose internals.

5. **Ask before assuming.** If a requirement is ambiguous (e.g. Agmarknet API authentication, ONNX model source), say so and provide the two most likely interpretations with a recommendation — then proceed with your recommendation unless told otherwise.

---

**Ready to begin. Start with Phase 1, Step 1: Monorepo scaffold with all package.json files. Include exact dependency versions. After each file, confirm what is complete and what's next.**

---
