"""
Shared helpers for hand landmark capture and preprocessing.
Used by app.py and training.py. MediaPipe outputs -> CSV-ready features for keypoint/point_history models.
"""
import copy
import itertools
import math


def calc_landmark_list(image, landmarks):
    """Convert MediaPipe landmarks (normalized x,y) to pixel [x,y] list (21 points)."""
    image_width, image_height = image.shape[1], image.shape[0]
    landmark_point = []
    for _, landmark in enumerate(landmarks):
        x = min(int(landmark.x * image_width), image_width - 1)
        y = min(int(landmark.y * image_height), image_height - 1)
        landmark_point.append([x, y])
    return landmark_point


def pre_process_landmark(landmark_list):
    """Relative + normalized 21*2 = 42 values for keypoint classifier."""
    temp = copy.deepcopy(landmark_list)
    base_x, base_y = temp[0][0], temp[0][1]
    for i in range(len(temp)):
        temp[i][0] -= base_x
        temp[i][1] -= base_y
    flat = list(itertools.chain.from_iterable(temp))
    max_val = max(map(abs, flat)) or 1e-6
    return [n / max_val for n in flat]


def pre_process_point_history(image, point_history):
    """Relative normalized 16*2 = 32 values for point history classifier."""
    image_width, image_height = image.shape[1], image.shape[0]
    temp = copy.deepcopy(point_history)
    base_x, base_y = temp[0][0], temp[0][1]
    out = []
    for p in temp:
        out.append((p[0] - base_x) / image_width)
        out.append((p[1] - base_y) / image_height)
    return out


# ---------------------------------------------------------------------------
# Hand skeleton quality checks for high-quality training data
# ---------------------------------------------------------------------------

# MediaPipe hand: 0=wrist, 1-4=thumb, 5-8=index, 9-12=middle, 13-16=ring, 17-20=pinky
# Palm "spread" ≈ distance wrist(0) to middle_mcp(9); finger length ≈ mcp to tip
MIN_HAND_BBOX_PX = 70       # hand bbox width/height at least this (avoid far/small hand)
MAX_HAND_BBOX_PX = 450      # hand bbox not huge (avoid too-close / bad scale)
FRAME_MARGIN_PX = 20        # all landmarks must be inside frame minus this margin
MIN_PALM_SPREAD_PX = 25      # wrist-to-middle-base minimum (reject closed fist as only pose)
MAX_LANDMARK_DIST_PX = 350  # max distance between any two points (reject outliers/glitches)


def _dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def check_hand_skeleton_quality(landmark_list, image_shape):
    """
    Check if the hand skeleton is suitable for training: in frame, good size, consistent.
    Returns (ok: bool, message: str).
    """
    if not landmark_list or len(landmark_list) < 21:
        return False, "Need 21 landmarks"
    h, w = image_shape[0], image_shape[1]
    xs = [p[0] for p in landmark_list]
    ys = [p[1] for p in landmark_list]
    x1, x2 = min(xs), max(xs)
    y1, y2 = min(ys), max(ys)
    bbox_w = x2 - x1
    bbox_h = y2 - y1

    if bbox_w < MIN_HAND_BBOX_PX or bbox_h < MIN_HAND_BBOX_PX:
        return False, "Hand too small - move closer"
    if bbox_w > MAX_HAND_BBOX_PX or bbox_h > MAX_HAND_BBOX_PX:
        return False, "Hand too large - move back"
    if x1 < FRAME_MARGIN_PX or y1 < FRAME_MARGIN_PX or x2 > w - FRAME_MARGIN_PX or y2 > h - FRAME_MARGIN_PX:
        return False, "Keep hand fully in frame"
    # Palm spread (wrist to middle finger base) – reject degenerate poses
    palm_spread = _dist(landmark_list[0], landmark_list[9])
    if palm_spread < MIN_PALM_SPREAD_PX:
        return False, "Open hand slightly - palm visible"
    # Sanity: no single landmark too far from others (glitch)
    for i in range(21):
        for j in range(i + 1, 21):
            if _dist(landmark_list[i], landmark_list[j]) > MAX_LANDMARK_DIST_PX:
                return False, "Hold hand steady"
    return True, "Skeleton OK"


def check_gesture_trail_quality(point_history, min_nonzero=12):
    """Check that the 16-frame trail has enough real index-tip points for a valid gesture."""
    if len(point_history) != 16:
        return False
    non_zero = sum(1 for p in point_history if (p[0] != 0 or p[1] != 0))
    return non_zero >= min_nonzero
