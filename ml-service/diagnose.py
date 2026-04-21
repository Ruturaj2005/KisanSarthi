#!/usr/bin/env python3
"""
Diagnostic script to check ML service setup
"""
import sys
import os

print("=" * 60)
print("🔍 KisanSaathi ML Service Diagnostics")
print("=" * 60)

# 1. Check Python version
print(f"\n✅ Python Version: {sys.version}")

# 2. Check if required packages are installed
print("\n📦 Checking dependencies...")
packages = ['fastapi', 'uvicorn', 'onnxruntime', 'pillow', 'numpy']
for pkg in packages:
    try:
        __import__(pkg)
        print(f"  ✅ {pkg}")
    except ImportError:
        print(f"  ❌ {pkg} - NOT INSTALLED")

# 3. Check model file
print("\n🏗️  Checking model file...")
model_path = os.path.join(os.path.dirname(__file__), "app", "model", "efficientnet_b0_kisansarthi.onnx")
if os.path.exists(model_path):
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"  ✅ Model found: {model_path}")
    print(f"     Size: {size_mb:.2f} MB")
else:
    print(f"  ❌ Model NOT found at: {model_path}")

# 4. Check class mapping
print("\n📋 Checking class mapping...")
import json
class_mapping_path = os.path.join(os.path.dirname(__file__), "app", "model", "class_mapping.json")
try:
    with open(class_mapping_path, 'r') as f:
        mapping = json.load(f)
    print(f"  ✅ Class mapping loaded: {len(mapping)} classes")
except Exception as e:
    print(f"  ❌ Failed to load class mapping: {e}")

# 5. Try loading ONNX model
print("\n🧠 Testing ONNX model load...")
try:
    import onnxruntime as ort
    session = ort.InferenceSession(model_path)
    print(f"  ✅ ONNX model loaded successfully")
    
    # Get model info
    inputs = session.get_inputs()
    outputs = session.get_outputs()
    print(f"     Inputs: {len(inputs)}")
    for inp in inputs:
        print(f"       - {inp.name}: {inp.shape}")
    print(f"     Outputs: {len(outputs)}")
    for out in outputs:
        print(f"       - {out.name}: {out.shape}")
except Exception as e:
    print(f"  ❌ Failed to load ONNX model: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("✅ Diagnostics complete!")
print("=" * 60)
