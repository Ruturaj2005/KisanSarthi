# 🔬 Disease Detection Setup Guide

## What Was Fixed

✅ **Model file path** - Was looking for `plant_disease.onnx`, now uses correct `efficientnet_b0_kisansarthi.onnx`

✅ **Class labels** - Now loads accurate labels from `class_mapping.json` instead of hardcoded list

✅ **ONNX model** - Model exists at: `ml-service/app/model/efficientnet_b0_kisansarthi.onnx`

---

## How to Run Disease Detection

### 1. Start ML Service (New Terminal)
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Expected startup output:
```
✅ Loaded 38 classes from class_mapping.json
✅ ONNX model loaded: .../model/efficientnet_b0_kisansarthi.onnx
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2. Verify ML Service Health
Open in browser or curl:
```bash
curl http://localhost:8000/health
```

Response should be:
```json
{
  "status": "ok",
  "model": "efficientnet-b0",
  "classes": 38
}
```

### 3. Backend Must Be Running
```bash
npm run dev:backend
```

### 4. Frontend - Test Pest Detection
1. Go to http://localhost:3000
2. Login to farmer account
3. Navigate to **Pest Detection** section
4. Upload crop image (JPG/PNG)
5. Select crop type
6. Click "Detect Disease"

Expected results:
- ✅ Disease name (e.g., "Tomato - Early blight")
- ✅ Confidence score (0-1)
- ✅ Severity level (low/medium/high)
- ✅ Treatment options

---

## Supported Crops

The model can detect diseases in:

- **Apple** - Scab, Black rot, Cedar apple rust, Healthy
- **Blueberry** - Healthy
- **Cherry** - Powdery mildew, Healthy
- **Corn** - Cercospora leaf spot, Common rust, Northern Leaf Blight, Healthy
- **Grape** - Black rot, Esca, Leaf blight, Healthy
- **Orange** - Haunglongbing (Citrus greening)
- **Peach** - Bacterial spot, Healthy
- **Pepper** - Bacterial spot, Healthy
- **Potato** - Early blight, Late blight, Healthy
- **Raspberry** - Healthy
- **Soybean** - Healthy
- **Squash** - Powdery mildew
- **Strawberry** - Leaf scorch, Healthy
- **Tomato** - Bacterial spot, Early blight, Late blight, Leaf Mold, Septoria leaf spot, Spider mites, Target Spot, TYLCV, Mosaic virus, Healthy

Total: **38 plant disease classes**

---

## How It Works

```
User uploads image
       ↓
Cloudinary storage (optional)
       ↓
ML Service (ONNX model) → Prediction
       ↓
If confidence < 70% → Verify with Gemini AI
       ↓
Save detection result + treatment recommendations
       ↓
Return to frontend
```

---

## Troubleshooting

### ML Service Not Starting
```bash
python -m pip install --upgrade pip
pip install -r ml-service/requirements.txt
uvicorn ml-service.app.main:app --reload --port 8000
```

### Model Not Loading
```
⚠️  Model not found at .../model/efficientnet_b0_kisansarthi.onnx
```
- Verify file exists: `ml-service/app/model/efficientnet_b0_kisansarthi.onnx`
- If missing, you need to download/train the model

### "Connection refused" Error in Backend
- ML service not running on port 8000
- Check `ML_SERVICE_URL` in `backend/.env` (default: `http://localhost:8000`)

### Low Confidence Results
- Image quality matters (clear, well-lit photos work best)
- Gemini AI will verify if confidence < 70%
- Make sure `GEMINI_API_KEY` is set in `backend/.env`

---

## Files Modified

1. `ml-service/app/main.py`
   - Fixed model path to `efficientnet_b0_kisansarthi.onnx`
   - Load labels from `class_mapping.json` for accuracy

2. `ml-service/app/model/class_mapping.json`
   - 38 accurate plant disease classes
   - Used during prediction

3. Backend (`backend/src/controllers/pest.controller.js`)
   - Already correctly configured
   - Falls back to Gemini if ML service unavailable

---

## Next Steps

1. ✅ Start ML service on port 8000
2. ✅ Verify health endpoint works
3. ✅ Backend running with GEMINI_API_KEY set
4. ✅ Upload test crop image
5. ✅ Check detection results

All set! 🌾
