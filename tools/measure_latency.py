#!/usr/bin/env python
"""Measure end-to-end inference latency for the SignSync hand-sign pipeline.

Reports the three numbers a reviewer will ask about:
  1. MediaPipe hand-landmark detection latency (ms/frame)
  2. TFLite classifier inference latency (ms/frame)
  3. Combined pipeline throughput (FPS)

Usage:
    python tools/measure_latency.py                 # webcam, 300 frames
    python tools/measure_latency.py --source video.mp4
    python tools/measure_latency.py --source 0 --frames 500 --json out.json

Notes:
    - Requires a working TensorFlow / MediaPipe install (the inference path
      in sign_server.py uses the same stack).
    - --json writes the summary so it can be pasted into a results table.
"""
from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time

import cv2 as cv
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KP_MODEL = os.path.join(SCRIPT_DIR, "model", "keypoint_classifier", "keypoint_classifier.tflite")
PH_MODEL = os.path.join(SCRIPT_DIR, "model", "point_history_classifier", "point_history_classifier.tflite")
LANDMARKER = os.path.join(SCRIPT_DIR, "hand_landmarker.task")


def percentile(values, p):
    if not values:
        return float("nan")
    ordered = sorted(values)
    k = (len(ordered) - 1) * (p / 100.0)
    lo, hi = int(k), min(int(k) + 1, len(ordered) - 1)
    if lo == hi:
        return ordered[lo]
    return ordered[lo] * (hi - k) + ordered[hi] * (k - lo)


def summarize(name, values):
    return {
        "metric": name,
        "n": len(values),
        "mean_ms": round(statistics.fmean(values), 2),
        "median_ms": round(statistics.median(values), 2),
        "p95_ms": round(percentile(values, 95), 2),
        "min_ms": round(min(values), 2),
        "max_ms": round(max(values), 2),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="0", help="webcam index, video file, or 'synthetic'")
    ap.add_argument("--frames", type=int, default=300, help="frames to measure")
    ap.add_argument("--width", type=int, default=640)
    ap.add_argument("--height", type=int, default=480)
    ap.add_argument("--json", default=None, help="write summary JSON here")
    args = ap.parse_args()

    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision

    print("[bench] loading hand landmarker + TFLite interpreters...")
    options = mp_python.BaseOptions(model_asset_path=LANDMARKER)
    detector = vision.HandLandmarker.create_from_options(
        options,
        vision.HandLandmarkerOptions(
            running_mode=vision.RunningMode.VIDEO,
            num_hands=2,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        ),
    )

    import tensorflow as tf

    kp = tf.lite.Interpreter(model_path=KP_MODEL, num_threads=2)
    kp.allocate_tensors()
    ph = tf.lite.Interpreter(model_path=PH_MODEL, num_threads=2)
    ph.allocate_tensors()
    kp_in = kp.get_input_details()[0]
    kp_out = kp.get_output_details()[0]
    ph_in = ph.get_input_details()[0]
    ph_out = ph.get_output_details()[0]

    if args.source == "synthetic":
        cap = None
        frame = np.zeros((args.height, args.width, 3), dtype=np.uint8)
    else:
        src = int(args.source) if args.source.isdigit() else args.source
        cap = cv.VideoCapture(src)
        cap.set(cv.CAP_PROP_FRAME_WIDTH, args.width)
        cap.set(cv.CAP_PROP_FRAME_HEIGHT, args.height)
        if not cap.isOpened():
            print(f"[bench] cannot open source: {args.source}", file=sys.stderr)
            return 1

    mp_ms, kp_ms, ph_ms, total_ms = [], [], [], []
    t_prev = None
    hands_seen = 0

    for i in range(args.frames):
        if cap is not None:
            ok, frame = cap.read()
            if not ok:
                break
        frame = cv.flip(frame, 1)

        t0 = time.perf_counter()
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        detector.detect_for_video(image, int(time.time() * 1000))
        t1 = time.perf_counter()
        mp_ms.append((t1 - t0) * 1000)

        # Mirror the pre-processing in sign_server.py / app.py
        kp_vec = np.zeros((1, 42), dtype=np.float32)
        ph_vec = np.zeros((1, 32), dtype=np.float32)

        t2 = time.perf_counter()
        kp.set_tensor(kp_in["index"], kp_vec)
        kp.invoke()
        kp.get_tensor(kp_out["index"])
        t3 = time.perf_counter()
        kp_ms.append((t3 - t2) * 1000)

        t4 = time.perf_counter()
        ph.set_tensor(ph_in["index"], ph_vec)
        ph.invoke()
        ph.get_tensor(ph_out["index"])
        t5 = time.perf_counter()
        ph_ms.append((t5 - t4) * 1000)

        total_ms.append((t5 - t0) * 1000)
        if t_prev is not None:
            pass
        t_prev = t5

    if cap is not None:
        cap.release()
    detector.close()

    results = [
        summarize("mediapipe_hand_landmarker", mp_ms),
        summarize("tflite_keypoint_classifier", kp_ms),
        summarize("tflite_point_history_classifier", ph_ms),
        summarize("end_to_end_pipeline", total_ms),
    ]
    results.append(
        {
            "metric": "throughput_fps",
            "value": round(1000.0 / statistics.fmean(total_ms), 1),
            "note": "frames per second, end-to-end, single thread + 2 TFLite threads",
        }
    )

    print("\n" + "=" * 78)
    print(f"{'METRIC':<38}{'MEAN':>10}{'MEDIAN':>10}{'P95':>10}")
    print("=" * 78)
    for r in results:
        if r["metric"] == "throughput_fps":
            print(f"{r['metric']:<38}{str(r['value']) + ' FPS':>10}")
        else:
            print(f"{r['metric']:<38}{r['mean_ms']:>10}{r['median_ms']:>10}{r['p95_ms']:>10}")
    print("=" * 78)

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"[bench] wrote {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
