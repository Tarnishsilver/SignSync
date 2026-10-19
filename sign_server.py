#!/usr/bin/env python
"""
FastAPI WebSocket server for real-time hand sign detection.
Wraps the existing MediaPipe + TFLite keypoint classifier to serve
predictions to the browser meeting UI.

Usage:
    pip install fastapi uvicorn websockets
    python sign_server.py
"""
import os
import sys
import json
import copy
import base64
import asyncio
import itertools
from contextlib import asynccontextmanager
from collections import deque, Counter

import cv2 as cv
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HAND_LANDMARKER_PATH = os.path.join(SCRIPT_DIR, "hand_landmarker.task")
KP_MODEL_PATH = os.path.join(SCRIPT_DIR, "model", "keypoint_classifier", "keypoint_classifier.tflite")
KP_LABEL_PATH = os.path.join(SCRIPT_DIR, "model", "keypoint_classifier", "keypoint_classifier_label.csv")
PH_MODEL_PATH = os.path.join(SCRIPT_DIR, "model", "point_history_classifier", "point_history_classifier.tflite")
PH_LABEL_PATH = os.path.join(SCRIPT_DIR, "model", "point_history_classifier", "point_history_classifier_label.csv")

# ---------------------------------------------------------------------------
# Global model state (populated during startup)
# ---------------------------------------------------------------------------
sys.path.insert(0, SCRIPT_DIR)
from label_utils import load_labels

keypoint_labels: list = []
point_history_labels: list = []
kp_interpreter = None
kp_input_details = None
kp_output_details = None
ph_interpreter = None
ph_input_details = None
ph_output_details = None
hand_detector = None
models_ready = False


def load_all_models():
    """Load all ML models. Called once at startup."""
    global keypoint_labels, point_history_labels
    global kp_interpreter, kp_input_details, kp_output_details
    global ph_interpreter, ph_input_details, ph_output_details
    global hand_detector, models_ready

    print("[sign_server] Loading labels...")
    keypoint_labels = load_labels(KP_LABEL_PATH)
    point_history_labels = load_labels(PH_LABEL_PATH)
    print(f"[sign_server] Keypoint labels: {keypoint_labels}")
    print(f"[sign_server] Point history labels: {point_history_labels}")

    print("[sign_server] Loading TFLite models...")
    import tensorflow as tf
    kp_interpreter = tf.lite.Interpreter(model_path=KP_MODEL_PATH, num_threads=2)
    kp_interpreter.allocate_tensors()
    kp_input_details = kp_interpreter.get_input_details()
    kp_output_details = kp_interpreter.get_output_details()

    ph_interpreter = tf.lite.Interpreter(model_path=PH_MODEL_PATH, num_threads=2)
    ph_interpreter.allocate_tensors()
    ph_input_details = ph_interpreter.get_input_details()
    ph_output_details = ph_interpreter.get_output_details()

    print("[sign_server] Loading MediaPipe hand landmarker...")
    base_options = mp_python.BaseOptions(model_asset_path=HAND_LANDMARKER_PATH)
    hand_options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.7,
        min_hand_presence_confidence=0.7,
        min_tracking_confidence=0.5,
    )
    hand_detector = vision.HandLandmarker.create_from_options(hand_options)

    models_ready = True
    print("[sign_server] All models loaded successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models in a thread so the server starts accepting requests immediately
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, load_all_models)
    yield
    print("[sign_server] Shutting down.")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(title="SignSync Detection Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    # Returns 200 immediately — even before models finish loading
    return {
        "status": "ok" if models_ready else "loading",
        "models_ready": models_ready,
        "keypoint_classes": len(keypoint_labels),
        "gesture_classes": len(point_history_labels),
    }


@app.get("/labels")
def get_labels():
    if not models_ready:
        return JSONResponse({"error": "Models still loading, try again in a moment"}, status_code=503)
    return JSONResponse({
        "keypoint": keypoint_labels,
        "point_history": point_history_labels,
    })


# ---------------------------------------------------------------------------
# Preprocessing (same logic as app.py)
# ---------------------------------------------------------------------------

def calc_landmark_list(image_width, image_height, landmarks):
    landmark_point = []
    for lm in landmarks:
        lx = min(int(lm.x * image_width), image_width - 1)
        ly = min(int(lm.y * image_height), image_height - 1)
        landmark_point.append([lx, ly])
    return landmark_point


def pre_process_landmark(landmark_list):
    temp = copy.deepcopy(landmark_list)
    base_x, base_y = 0, 0
    for idx, pt in enumerate(temp):
        if idx == 0:
            base_x, base_y = pt[0], pt[1]
        temp[idx][0] -= base_x
        temp[idx][1] -= base_y
    temp = list(itertools.chain.from_iterable(temp))
    max_val = max(list(map(abs, temp)))
    if max_val == 0:
        max_val = 1
    temp = [n / max_val for n in temp]
    return temp


def pre_process_point_history(image_width, image_height, point_history):
    temp = copy.deepcopy(list(point_history))
    base_x, base_y = 0, 0
    for idx, pt in enumerate(temp):
        if idx == 0:
            base_x, base_y = pt[0], pt[1]
        temp[idx][0] = (temp[idx][0] - base_x) / image_width if image_width else 0
        temp[idx][1] = (temp[idx][1] - base_y) / image_height if image_height else 0
    temp = list(itertools.chain.from_iterable(temp))
    return temp


def classify_keypoint(landmark_list):
    """Run keypoint classifier and return (class_id, confidence)."""
    kp_interpreter.set_tensor(
        kp_input_details[0]["index"],
        np.array([landmark_list], dtype=np.float32),
    )
    kp_interpreter.invoke()
    result = kp_interpreter.get_tensor(kp_output_details[0]["index"])
    squeezed = np.squeeze(result)
    class_id = int(np.argmax(squeezed))
    confidence = float(squeezed[class_id])
    return class_id, confidence


def classify_point_history(point_history_list):
    """Run point history classifier and return (class_id, confidence)."""
    ph_interpreter.set_tensor(
        ph_input_details[0]["index"],
        np.array([point_history_list], dtype=np.float32),
    )
    ph_interpreter.invoke()
    result = ph_interpreter.get_tensor(ph_output_details[0]["index"])
    squeezed = np.squeeze(result)
    class_id = int(np.argmax(squeezed))
    confidence = float(squeezed[class_id])
    return class_id, confidence


# ---------------------------------------------------------------------------
# WebSocket: /ws/detect
# ---------------------------------------------------------------------------
@app.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    """
    WebSocket endpoint for real-time hand sign detection.
    Client sends: { "image": "<base64 JPEG>" }
    Server responds: { "signs": [...], "gesture": {...} }
    """
    await websocket.accept()
    print("[sign_server] WebSocket client connected")

    if not models_ready:
        await websocket.send_json({"error": "Models still loading, please wait and reconnect"})
        await websocket.close()
        return

    HISTORY_LEN = 16
    point_history = deque(maxlen=HISTORY_LEN)
    finger_gesture_history = deque(maxlen=HISTORY_LEN)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
                continue

            if "image" not in msg:
                await websocket.send_json({"error": "Missing 'image' field"})
                continue

            # Decode base64 image
            try:
                img_bytes = base64.b64decode(msg["image"])
                nparr = np.frombuffer(img_bytes, np.uint8)
                image = cv.imdecode(nparr, cv.IMREAD_COLOR)
                if image is None:
                    raise ValueError("Failed to decode image")
            except Exception as e:
                await websocket.send_json({"error": f"Image decode error: {str(e)}"})
                continue

            h, w = image.shape[:2]
            rgb = cv.cvtColor(image, cv.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

            results = hand_detector.detect(mp_image)

            signs = []
            gesture_result = None

            if results.hand_landmarks:
                for hand_idx, (hand_landmarks, handedness) in enumerate(
                    zip(results.hand_landmarks, results.handedness)
                ):
                    landmark_list = calc_landmark_list(w, h, hand_landmarks)
                    pre_processed = pre_process_landmark(landmark_list)

                    kp_id, kp_conf = classify_keypoint(pre_processed)
                    label = keypoint_labels[kp_id] if kp_id < len(keypoint_labels) else f"?({kp_id})"

                    signs.append({
                        "label": label,
                        "confidence": round(kp_conf, 3),
                        "type": "keypoint",
                        "hand": handedness[0].category_name,
                    })

                    if hand_idx == 0:
                        point_history.append(landmark_list[8] if len(landmark_list) > 8 else [0, 0])

                        ph_list = pre_process_point_history(w, h, point_history)
                        if len(ph_list) == HISTORY_LEN * 2:
                            ph_id, ph_conf = classify_point_history(ph_list)
                            finger_gesture_history.append(ph_id)

                            most_common = Counter(finger_gesture_history).most_common()
                            pid = most_common[0][0] if most_common else 0
                            if pid > 0 and ph_conf >= 0.2:
                                g_label = point_history_labels[pid] if pid < len(point_history_labels) else f"?({pid})"
                                gesture_result = {
                                    "label": g_label,
                                    "confidence": round(ph_conf, 3),
                                    "type": "gesture",
                                }
            else:
                point_history.append([0, 0])

            response = {"signs": signs}
            if gesture_result:
                response["gesture"] = gesture_result

            await websocket.send_json(response)

    except WebSocketDisconnect:
        print("[sign_server] WebSocket client disconnected")
    except Exception as e:
        print(f"[sign_server] WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8765))
    print(f"[sign_server] Starting on http://0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
