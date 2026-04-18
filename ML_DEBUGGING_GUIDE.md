# 🔧 ML Disease Detection Debugging Guide

## Issue: Disease scanning not working properly

### Step 1: Run Diagnostics
```bash
cd ml-service
python diagnose.py
```

Expected output:
```
✅ Python Version: 3.x.x
✅ fastapi
✅ uvicorn
✅ onnxruntime
✅ pillow
✅ numpy
✅ Model found: .../efficientnet_b0_kisansarthi.onnx
   Size: 85.23 MB
✅ Class mapping loaded: 38 classes
✅ ONNX model loaded successfully
```

If any dependency is missing:
```bash
pip install -r requirements.txt
```

---

## Step 2: Start ML Service with Verbose Logging
```bash
cd ml-service
python -m uvicorn app.main:app --reload --port 8000 --log-level debug
```

Watch for:
```
✅ Loaded 38 classes from class_mapping.json
✅ ONNX model loaded: .../model/efficientnet_b0_kisansarthi.onnx
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## Step 3: Test ML Service Directly

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

Expected:
```json
{
  "status": "ok",
  "model": "efficientnet-b0",
  "classes": 38
}
```

If returns `"model": "not_loaded"` → ONNX model failed to load

---

### Test 2: Test Prediction with Sample Image
```bash
curl -X POST http://localhost:8000/predict \
  -F "image=@test_image.jpg" \
  -F "cropType=Tomato"
```

Expected:
```json
{
  "prediction": {
    "label": "Tomato - Early blight",
    "confidence": 0.89
  },
  "top3": [...],
  "lowConfidence": false,
  "cropType": "Tomato",
  "mock": false
}
```

If `"mock": true` → Model didn't load, returning random results

---

## Step 4: Check Backend Connection

Ensure `backend/.env` has:
```env
ML_SERVICE_URL=http://localhost:8000
```

Restart backend:
```bash
cd backend
npm run dev:backend
```

Look for backend logs when uploading image:
```
[pest] ML service call...
[pest] ML response: {...}
```

---

## Common Issues & Fixes

### Issue 1: "Model not found"
```
⚠️  Model not found at .../efficientnet_b0_kisansarthi.onnx
```
**Fix:**
- Verify file exists: `ml-service/app/model/efficientnet_b0_kisansarthi.onnx`
- Check file size > 80MB
- If missing, need to download/train model

---

### Issue 2: "ONNX model failed to load"
```
⚠️  Failed to load ONNX model: [error details]
```
**Possible causes:**
1. onnxruntime not installed
   ```bash
   pip install onnxruntime
   ```

2. Model file corrupted
   - Download fresh model file
   - Or re-train the model

3. Python 32-bit vs 64-bit mismatch
   - Use Python 64-bit for ONNX

---

### Issue 3: "ML service unavailable / Connection refused"
Backend error:
```
[pest] ML service unavailable
```
**Fixes:**
1. Is ML service running on port 8000?
   ```bash
   curl http://localhost:8000/health
   ```

2. Wrong port in `backend/.env`?
   ```env
   ML_SERVICE_URL=http://localhost:8000
   ```

3. Firewall blocking?
   - Check Windows Firewall settings

---

### Issue 4: "Returning mock predictions"
Response has `"mock": true` → Model not loaded

**Steps:**
1. Run `python diagnose.py`
2. Check for ONNX errors
3. Verify model file exists and is readable
4. Try standalone ONNX test:
   ```python
   import onnxruntime as ort
   sess = ort.InferenceSession("app/model/efficientnet_b0_kisansarthi.onnx")
   print("✅ Model loaded!")
   ```

---

## Step 5: Test Full Flow

1. **Frontend** → http://localhost:3000
2. **Upload crop image** to disease detection
3. **Check backend logs** for:
   ```
   ✅ ML service response received
   ```
4. **Check ML service logs** for:
   ```
   POST /predict
   ```

---

## Model Information

- **Type**: EfficientNet-B0 (ONNX format)
- **Input**: 224x224 RGB images
- **Output**: 38 plant disease classes
- **Size**: ~85 MB
- **Accuracy**: ~98% on test set

---

## Performance Notes

- **First prediction**: ~2-3 seconds (model loading)
- **Subsequent predictions**: ~0.5-1 second
- **Memory**: ~300-500 MB while running

If slow, check:
- Disk I/O (model loading from disk)
- CPU usage
- RAM availability

---

## Files to Check

```
ml-service/
├── app/
│   ├── main.py (FastAPI app)
│   └── model/
│       ├── efficientnet_b0_kisansarthi.onnx (model)
│       └── class_mapping.json (38 classes)
├── requirements.txt (dependencies)
└── diagnose.py (diagnostic tool)
```

---

## Still Not Working?

1. Run `python diagnose.py` and share output
2. Check ML service startup logs
3. Try direct API test with `curl`
4. Verify backend can reach ML service
5. Check firewall/antivirus blocking connections

Good luck! 🌾
