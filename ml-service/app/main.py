from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import numpy as np
from PIL import Image
import io
import os
import urllib.request

# ── Model Loading ───────────────────────────────────────────────────
model_session = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "efficientnet_b0_kisansarthi.onnx")
MODEL_URL = os.getenv("MODEL_URL", "")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ONNX model once at startup."""
    global model_session
    
    # Download model if it doesn't exist
    if not os.path.exists(MODEL_PATH):
        if MODEL_URL:
            print(f"Downloading model...")
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            print("Model downloaded!")
        else:
            print("MODEL_URL not set")

    try:
        import onnxruntime as ort
        if os.path.exists(MODEL_PATH):
            model_session = ort.InferenceSession(MODEL_PATH)
            print(f"✅ ONNX model loaded: {MODEL_PATH}")
        else:
            print(f"⚠️  Model not found at {MODEL_PATH} — /predict will return mock data")
    except Exception as e:
        print(f"⚠️  Failed to load ONNX model: {e}")
    yield
    model_session = None

# ── App ─────────────────────────────────────────────────────────────
app = FastAPI(title="KisanSaathi ML Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── PlantVillage Labels ────────────────────────────────────────────
LABELS = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry___Powdery_mildew", "Cherry___healthy",
    "Corn___Cercospora_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
    "Grape___Black_rot", "Grape___Esca", "Grape___Leaf_blight", "Grape___healthy",
    "Orange___Haunglongbing", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper___Bacterial_spot", "Pepper___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy",
    "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
]

# ── ImageNet normalization ──────────────────────────────────────────
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Resize to 224x224, normalize with ImageNet mean/std."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    arr = arr.transpose(2, 0, 1)  # HWC → CHW
    return np.expand_dims(arr, axis=0)  # Add batch dim

def softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()

# ── Routes ──────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": "efficientnet-b0" if model_session else "not_loaded",
        "classes": len(LABELS),
    }

@app.post("/predict")
async def predict(image: UploadFile = File(...), cropType: str = Form("Unknown")):
    """Run plant disease prediction on uploaded image."""
    image_bytes = await image.read()
    
    if model_session is None:
        # Mock response when model is not loaded
        import random
        mock_idx = random.randint(0, len(LABELS) - 1)
        mock_conf = round(random.uniform(0.5, 0.95), 3)
        top3 = [
            {"label": LABELS[mock_idx].replace("___", " - "), "confidence": mock_conf},
            {"label": LABELS[(mock_idx + 1) % len(LABELS)].replace("___", " - "), "confidence": round(mock_conf * 0.6, 3)},
            {"label": LABELS[(mock_idx + 2) % len(LABELS)].replace("___", " - "), "confidence": round(mock_conf * 0.3, 3)},
        ]
        return {
            "prediction": top3[0],
            "top3": top3,
            "lowConfidence": mock_conf < 0.70,
            "cropType": cropType,
            "mock": True,
        }
    
    try:
        input_tensor = preprocess_image(image_bytes)
        input_name = model_session.get_inputs()[0].name
        output = model_session.run(None, {input_name: input_tensor})
        probs = softmax(output[0][0])
        
        top3_indices = probs.argsort()[-3:][::-1]
        top3 = [
            {"label": LABELS[i].replace("___", " - "), "confidence": round(float(probs[i]), 4)}
            for i in top3_indices
        ]
        
        return {
            "prediction": top3[0],
            "top3": top3,
            "lowConfidence": top3[0]["confidence"] < 0.70,
            "cropType": cropType,
            "mock": False,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
