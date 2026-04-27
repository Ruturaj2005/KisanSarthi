# 🌾 KisanSaathi - Farmer's Companion

> AI-powered precision agriculture platform for India's 120M+ small and marginal farmers.

![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Express%20%7C%20MongoDB%20%7C%20Ollama%20%7C%20FastAPI-2D6A4F)

## Features

- 🤖 **AI Advisory Chat** — Ollama-powered local crop advice in 6 Indian languages with voice input/output
- 📸 **Pest Detection** — Upload crop images for disease identification (ONNX + Ollama fallback)
- 🌱 **Soil Health Analysis** — NPK scoring, ICAR fertilizer recommendations, pH correction
- 📊 **Market Intelligence** — Mandi prices, MSP comparison, price trend charts, alerts
- 🌤️ **Weather Alerts** — Real-time weather with farming-specific action alerts
- 👤 **Farmer Profiles** — Location, crops, soil type, irrigation, language preference
- ⚙️ **Admin Dashboard** — Stats, charts, farmer management, feedback logs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS v4, Zustand, TanStack Query, Recharts |
| Backend | Express.js, Mongoose, JWT (access + refresh), Nodemailer (OAuth2), Zod |
| AI | Ollama (`kimi-k2-thinking:cloud` model), ONNX Runtime |
| Database | MongoDB Atlas |
| ML Service | FastAPI, ONNX, Pillow |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Ollama (installed locally with `kimi-k2-thinking:cloud` model pulled)
- Python 3.9+ (for ML service, optional)

### 1. Clone & Install

```bash
git clone https://github.com/Ruturaj2005/KisanSarthi.git
cd KisanSarthi

# Install all dependencies
npm install           # root (concurrently)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Backend
cp .env.example backend/.env
# Edit backend/.env with your credentials:
#   - MONGODB_URI
#   - CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, EMAIL_USER (Google OAuth2)
#   - OWM_API_KEY
#   - CLOUDINARY credentials
```

### 3. Seed Database

```bash
cd backend && npm run seed
# Creates: admin@kisansaathi.in / admin123
#          farmer1@test.com / farmer123
```

### 4. Run Development

```bash
npm run dev   # Starts both backend (port 5000) and frontend (port 3000)
```

### 5. ML Service (Optional)

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

## Project Structure

```
kisansaathi/
├── frontend/          # Next.js 14 App Router
├── backend/           # Express API
├── ml-service/        # FastAPI + ONNX
├── docker-compose.yml
└── .env.example
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kisansaathi.in | admin123 |
| Farmer | farmer1@test.com | farmer123 |

## API Endpoints

| Group | Endpoints |
|-------|----------|
| Auth | POST /api/auth/register · /verify-otp · /login · /resend-otp · /refresh · /logout · /complete-profile |
| Farmer | GET/PUT /api/farmer/profile · CRUD /api/farmer/crop-history |
| Advisory | POST /api/advisory/chat · GET /history · POST /feedback |
| Pest | POST /api/pest/detect · GET /history · /detection/:id |
| Soil | POST /api/soil/test · GET /tests · /recommendation |
| Weather | GET /api/weather/current · /forecast · /alerts |
| Market | GET /api/market/prices · /trend · POST/DELETE /alerts |
| Admin | GET /api/admin/stats · /farmers · /feedback · /pest-log |

---

Built with ❤️ for Indian farmers 🌾
