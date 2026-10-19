#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Dataset collection for ASL hand gesture recognition.
Run this script to capture pose (keypoint) or gesture (point history) data by:
  1. Entering the word(s) to collect
  2. Choosing Pose or Gesture
  3. Capturing with the camera via MediaPipe (same pipeline as app.py)
Saves to model/keypoint_classifier/keypoint.csv and model/point_history_classifier/point_history.csv.
"""
import csv
import copy
import itertools
from pathlib import Path
from collections import deque

import cv2 as cv
import numpy as np

import mediapipe as mp

# MediaPipe: prefer Tasks API (hand_landmarker.task), fallback to solutions.hands
try:
    from mediapipe.tasks import python as mp_tasks
    from mediapipe.tasks.python import vision
    HAS_TASKS = True
except Exception:
    HAS_TASKS = False

from capture_utils import (
    calc_landmark_list,
    pre_process_landmark,
    pre_process_point_history,
    check_hand_skeleton_quality,
    check_gesture_trail_quality,
)
from label_utils import load_labels, save_labels
from popup_utils import show_completed

# Paths (relative to project root = same folder as app.py)
PROJECT_ROOT = Path(__file__).resolve().parent
KEYPOINT_LABELS_PATH = PROJECT_ROOT / "model" / "keypoint_classifier" / "keypoint_classifier_label.csv"
KEYPOINT_CSV_PATH = PROJECT_ROOT / "model" / "keypoint_classifier" / "keypoint.csv"
POINT_HISTORY_LABELS_PATH = PROJECT_ROOT / "model" / "point_history_classifier" / "point_history_classifier_label.csv"
POINT_HISTORY_CSV_PATH = PROJECT_ROOT / "model" / "point_history_classifier" / "point_history.csv"
HAND_LANDMARKER_TASK = PROJECT_ROOT / "hand_landmarker.task"
HISTORY_LENGTH = 16
# Require hand stable for this many frames before saving (avoids bad captures)
STABLE_HAND_FRAMES = 8
# For gesture: require at least this many non-zero points in the 16-frame trail to save
MIN_GESTURE_POINTS = 12


def get_or_add_class(word, labels, path, kind):
    word = word.strip()
    if not word:
        return None, labels
    low = word.lower()
    for i, w in enumerate(labels):
        if w.strip().lower() == low:
            return i, labels
    labels.append(word)
    save_labels(path, labels)
    return len(labels) - 1, labels


def create_hands_detector():
    # Use higher confidence during training for careful hand capture
    if HAS_TASKS and HAND_LANDMARKER_TASK.exists():
        opts = vision.HandLandmarkerOptions(
            base_options=mp_tasks.BaseOptions(model_asset_path=str(HAND_LANDMARKER_TASK)),
            num_hands=2,
            min_hand_detection_confidence=0.8,
            min_hand_presence_confidence=0.8,
            min_tracking_confidence=0.6,
        )
        return vision.HandLandmarker.create_from_options(opts), "tasks"
    hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.8,
            min_tracking_confidence=0.6,
        )
    return hands, "solution"


def get_landmarks_from_frame(hands, api, image_rgb):
    """Return first hand only (raw landmarks for calc_landmark_list with frame)."""
    if api == "tasks":
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        results = hands.detect(mp_image)
        if not results.hand_landmarks:
            return None
        return results.hand_landmarks[0]
    else:
        results = hands.process(image_rgb)
        if not results.multi_hand_landmarks:
            return None
        return results.multi_hand_landmarks[0]


def get_all_hands_from_frame(hands, api, image_rgb, frame):
    """
    Return list of (landmark_list, handedness_str) for each detected hand.
    landmark_list = 21 [x,y] pixel coords; handedness_str is "Left" or "Right".
    """
    if frame is None:
        return []
    if api == "tasks":
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        results = hands.detect(mp_image)
        if not results.hand_landmarks:
            return []
        out = []
        for hand_landmarks, handedness in zip(results.hand_landmarks, results.handedness):
            label = handedness[0].category_name if handedness else "Left"
            landmark_list = calc_landmark_list(frame, hand_landmarks)
            out.append((landmark_list, label))
        return out
    else:
        results = hands.process(image_rgb)
        if not results.multi_hand_landmarks:
            return []
        out = []
        for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness or []):
            label = handedness.classification[0].label if handedness and handedness.classification else "Left"
            landmark_list = calc_landmark_list(frame, hand_landmarks)
            out.append((landmark_list, label))
        return out


def calc_hand_bbox(landmark_list):
    """Bounding box [x1, y1, x2, y2] with padding for careful hand capture."""
    if not landmark_list:
        return None
    xs = [p[0] for p in landmark_list]
    ys = [p[1] for p in landmark_list]
    pad = 25
    x1 = max(0, min(xs) - pad)
    y1 = max(0, min(ys) - pad)
    x2 = min(9999, max(xs) + pad)
    y2 = min(9999, max(ys) + pad)
    return (x1, y1, x2, y2)


# MediaPipe hand skeleton connections (index pairs) for detailed on-screen feedback
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),           # thumb
    (0, 5), (5, 6), (6, 7), (7, 8),           # index
    (0, 9), (9, 10), (10, 11), (11, 12),      # middle
    (0, 13), (13, 14), (14, 15), (15, 16),    # ring
    (0, 17), (17, 18), (18, 19), (19, 20),    # pinky
    (5, 9), (9, 13), (13, 17),                 # palm
]


def draw_hand_skeleton_and_bbox(image, landmark_list, quality_ok=False):
    """Draw full hand skeleton (lines + points) and bbox for detailed positioning feedback."""
    if not landmark_list or len(landmark_list) < 21:
        return image
    color = (0, 255, 0) if quality_ok else (0, 165, 255)  # green when OK, orange when adjusting
    for i, j in HAND_CONNECTIONS:
        if i < len(landmark_list) and j < len(landmark_list):
            pt1 = (landmark_list[i][0], landmark_list[i][1])
            pt2 = (landmark_list[j][0], landmark_list[j][1])
            cv.line(image, pt1, pt2, color, 2)
    for idx, pt in enumerate(landmark_list):
        x, y = pt[0], pt[1]
        r = 6 if idx == 8 else 4  # highlight index tip (landmark 8)
        cv.circle(image, (x, y), r, color, -1)
        cv.circle(image, (x, y), r, (255, 255, 255), 1)
    bbox = calc_hand_bbox(landmark_list)
    if bbox:
        x1, y1, x2, y2 = bbox
        h, w = image.shape[:2]
        x2, y2 = min(x2, w), min(y2, h)
        cv.rectangle(image, (x1, y1), (x2, y2), color, 2)
    return image


def capture_pose(hands, api, word, class_id, labels):
    KEYPOINT_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    cap = cv.VideoCapture(0)
    cap.set(cv.CAP_PROP_FRAME_WIDTH, 960)
    cap.set(cv.CAP_PROP_FRAME_HEIGHT, 540)
    recording = False
    count = 0
    # Per-hand stability (Left and Right) for two-hand training
    stable_frames_by_hand = {"Left": 0, "Right": 0}
    quality_msg = "Position hand(s) in frame"
    print(f"\n>>> Word: '{word}' (index {class_id}) | POSE mode — frames saved to keypoint.csv")
    print("    One or both hands: green skeleton = OK. SPACE = record, Q = done")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv.flip(frame, 1)
        rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        all_hands = get_all_hands_from_frame(hands, api, rgb, frame)
        # Reset stability for hands not seen this frame
        seen_hands = {label for _, label in all_hands}
        for h in ("Left", "Right"):
            if h not in seen_hands:
                stable_frames_by_hand[h] = 0
        any_quality_ok = False
        for landmark_list, handedness in all_hands:
            quality_ok, msg = check_hand_skeleton_quality(landmark_list, frame.shape)
            if quality_ok:
                stable_frames_by_hand[handedness] = min(stable_frames_by_hand[handedness] + 1, STABLE_HAND_FRAMES + 1)
                any_quality_ok = True
            else:
                stable_frames_by_hand[handedness] = 0
            frame = draw_hand_skeleton_and_bbox(frame, landmark_list, quality_ok=quality_ok)
            # Save one sample per hand when that hand is stable and quality OK
            if recording and quality_ok and stable_frames_by_hand[handedness] >= STABLE_HAND_FRAMES:
                pre = pre_process_landmark(landmark_list)
                with open(KEYPOINT_CSV_PATH, "a", newline="") as f:
                    csv.writer(f).writerow([class_id, *pre])
                count += 1
        if not all_hands:
            quality_msg = "Position hand(s) in frame"
        else:
            quality_msg = "Skeleton OK - hold steady" if any_quality_ok and max(stable_frames_by_hand.values()) >= STABLE_HAND_FRAMES else "Adjust hand position"
        status = "RECORDING" if recording else "PAUSED"
        cv.putText(frame, f"Word: {word} | {status} | samples: {count}", (10, 28),
                   cv.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2)
        cv.putText(frame, quality_msg, (10, 58), cv.FONT_HERSHEY_SIMPLEX, 0.6,
                   (0, 255, 0) if any_quality_ok else (0, 0, 255), 2)
        cv.putText(frame, "SPACE=record  Q=done  (both hands recorded)", (10, frame.shape[0] - 10),
                   cv.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        cv.imshow("Training - Pose", frame)
        key = cv.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if key == ord(" "):
            recording = not recording
    cap.release()
    cv.destroyWindow("Training - Pose")
    print(f"    Saved {count} pose samples for '{word}'.")
    return count


def capture_gesture(hands, api, word, class_id, labels):
    POINT_HISTORY_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    cap = cv.VideoCapture(0)
    cap.set(cv.CAP_PROP_FRAME_WIDTH, 960)
    cap.set(cv.CAP_PROP_FRAME_HEIGHT, 540)
    left_history = deque(maxlen=HISTORY_LENGTH)
    right_history = deque(maxlen=HISTORY_LENGTH)
    recording = False
    count = 0
    quality_msg = "Position hand(s) in frame"
    print(f"\n>>> Word: '{word}' (index {class_id}) | GESTURE mode — frames saved to point_history.csv")
    print("    One or both hands: draw with index tip (green dot). SPACE = record, Q = done")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv.flip(frame, 1)
        rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        all_hands = get_all_hands_from_frame(hands, api, rgb, frame)
        left_landmarks = next((lm for lm, h in all_hands if h == "Left"), None)
        right_landmarks = next((lm for lm, h in all_hands if h == "Right"), None)
        if recording:
            left_history.append(left_landmarks[8] if left_landmarks and len(left_landmarks) > 8 else [0, 0])
            right_history.append(right_landmarks[8] if right_landmarks and len(right_landmarks) > 8 else [0, 0])
        for landmark_list, handedness in all_hands:
            quality_ok, _ = check_hand_skeleton_quality(landmark_list, frame.shape)
            frame = draw_hand_skeleton_and_bbox(frame, landmark_list, quality_ok=quality_ok)
            # Save from each hand when that hand's trail is full and good
            if recording and len(left_history) == HISTORY_LENGTH and handedness == "Left":
                if check_gesture_trail_quality(list(left_history), min_nonzero=MIN_GESTURE_POINTS) and quality_ok:
                    pre = pre_process_point_history(frame, list(left_history))
                    with open(POINT_HISTORY_CSV_PATH, "a", newline="") as f:
                        csv.writer(f).writerow([class_id, *pre])
                    count += 1
            if recording and len(right_history) == HISTORY_LENGTH and handedness == "Right":
                if check_gesture_trail_quality(list(right_history), min_nonzero=MIN_GESTURE_POINTS) and quality_ok:
                    pre = pre_process_point_history(frame, list(right_history))
                    with open(POINT_HISTORY_CSV_PATH, "a", newline="") as f:
                        csv.writer(f).writerow([class_id, *pre])
                    count += 1
        # Draw trails (left = yellow, right = cyan)
        for i, pt in enumerate(left_history):
            if pt[0] != 0 or pt[1] != 0:
                cv.circle(frame, (pt[0], pt[1]), 2 + i // 2, (0, 255, 255), -1)
        for i, pt in enumerate(right_history):
            if pt[0] != 0 or pt[1] != 0:
                cv.circle(frame, (pt[0], pt[1]), 2 + i // 2, (255, 255, 0), -1)
        any_ok = any(check_hand_skeleton_quality(lm, frame.shape)[0] for lm, _ in all_hands)
        status = "RECORDING" if recording else "PAUSED"
        cv.putText(frame, f"Word: {word} | {status} | gestures: {count}", (10, 28),
                   cv.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)
        cv.putText(frame, quality_msg if not all_hands else ("Skeleton OK - draw gesture" if any_ok else "Adjust hand position"), (10, 58), cv.FONT_HERSHEY_SIMPLEX, 0.6,
                   (0, 255, 0) if any_ok else (0, 0, 255), 2)
        cv.putText(frame, "SPACE=record  Q=done  (L=yellow R=cyan)", (10, frame.shape[0] - 10),
                   cv.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        cv.imshow("Training - Gesture", frame)
        key = cv.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if key == ord(" "):
            recording = not recording
            if recording:
                left_history.clear()
                right_history.clear()
    cap.release()
    cv.destroyWindow("Training - Gesture")
    print(f"    Saved {count} gesture samples for '{word}'.")
    return count


def main():
    print("=" * 60)
    print("ASL Dataset Collection (MediaPipe + CNN pipeline)")
    print("=" * 60)

    keypoint_labels = load_labels(KEYPOINT_LABELS_PATH)
    point_history_labels = load_labels(POINT_HISTORY_LABELS_PATH)
    print(f"Current keypoint labels ({len(keypoint_labels)}):", keypoint_labels or "(none)")
    print(f"Current point-history labels ({len(point_history_labels)}):", point_history_labels or "(none)")

    words_input = input("\nEnter word(s) to collect (comma-separated, e.g. Eat, Drink, Yes): ").strip()
    if not words_input:
        print("No words entered. Exiting.")
        return
    words = [w.strip() for w in words_input.split(",") if w.strip()]
    if not words:
        print("No valid words. Exiting.")
        return

    choice = input("Capture as (P)ose or (G)esture? [p/g]: ").strip().lower()
    if choice not in ("p", "g"):
        print("Use 'p' for pose or 'g' for gesture. Exiting.")
        return
    is_pose = choice == "p"

    print("\nStarting camera and MediaPipe hand detection...")
    hands, api = create_hands_detector()
    print(f"Using MediaPipe: {api}")

    total = 0
    for word in words:
        if is_pose:
            class_id, keypoint_labels = get_or_add_class(word, keypoint_labels, KEYPOINT_LABELS_PATH, "keypoint")
            if class_id is None:
                continue
            n = capture_pose(hands, api, word, class_id, keypoint_labels)
        else:
            class_id, point_history_labels = get_or_add_class(word, point_history_labels, POINT_HISTORY_LABELS_PATH, "point_history")
            if class_id is None:
                continue
            n = capture_gesture(hands, api, word, class_id, point_history_labels)
        total += n

    if api == "tasks" and hasattr(hands, "close"):
        hands.close()
    print(f"\nDone. Total samples saved: {total}")
    print("Run train_keypoint.py or train_point_history.py to train the model.")
    show_completed(
        f"Data collection completed.\n\nTotal samples saved: {total}\n\nFrame data stored in CSV for model training.\nRun train_keypoint.py or train_point_history.py to train.",
        title="Collection completed",
    )


if __name__ == "__main__":
    main()
