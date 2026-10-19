# How to Make and Train on a New Dataset

This guide covers collecting your own gestures and training both **keypoint** (static hand poses → words) and **point history** (finger movements → phrases) classifiers.

---

## 0. Build dataset with training.py (recommended)

Use the interactive script to create the dataset by **entering words** and choosing **pose** or **gesture** capture (MediaPipe + same CSV format as the app):

```bash
cd SignSync
python training.py
```

1. **Enter word(s)** when prompted (comma-separated, e.g. `Eat, Drink, Yes`).
2. Choose **(P)ose** or **(G)esture**:
   - **Pose** = static hand shape (saved to `keypoint.csv` for the keypoint classifier).
   - **Gesture** = movement of the index finger over 16 frames (saved to `point_history.csv` for the point-history classifier).
3. For each word, the camera opens. **SPACE** = start/stop recording, **Q** = done with that word.
   - **Pose:** hold the hand pose in view while recording; each frame with a **valid skeleton** adds one sample (see below).
   - **Gesture:** keep hand in frame with **good skeleton**, draw with index finger; each full 16-frame trail with enough real points adds one sample.
4. New words are **added automatically** to the corresponding label CSV (keypoint or point history).

**Perfect hand skeleton (data quality):** The training window shows a **full hand skeleton** (lines + joints). Only frames that pass quality checks are saved:
- Hand **fully in frame** (with margin).
- Hand **size** in a good range (not too small/far or too large/close).
- **Palm visible** (open hand enough so the skeleton is stable).
- **Stable** for several frames (pose) or **enough index-tip points** in the trail (gesture).
When the skeleton turns **green**, the position is OK and samples will be recorded. Follow on-screen messages (e.g. "Hand too small - move closer") to get more valid samples.

Then **you must train** with `train_keypoint.py` or `train_point_history.py` (see below). For **efficient training**, the scripts use:
- **Best model only** (saved by validation loss).
- **ReduceLROnPlateau** (learning rate drops when loss plateaus).
- **Early stopping** with `restore_best_weights`.
- Optional **light augmentation**: add `--augment` for Gaussian noise on the training set (e.g. `python train_point_history.py --epochs 1000 --augment`). **If you add new words to the label file but don't retrain, the model will not predict them** (it still has the old number of output classes). The app will print a warning when the model and label count don't match.

---

## 1. Define your classes (words/phrases)

### Keypoint classifier (static poses)

- One **word** per class, e.g. Open, Close, Pointer, OK, Hello, Thanks, Yes, No.
- Up to **10 classes** with the default app (keys 0–9). For more, you’d need to change the app.

**Edit** `model/keypoint_classifier/keypoint_classifier_label.csv` — **one label per line, in order** (line 1 = class 0, line 2 = class 1, …):

```csv
Open
Close
Pointer
OK
Hello
Thanks
```

### Point history classifier (gestures / phrases)

- One **phrase** per class, e.g. hello, how are you, i love you, thank you.

**Edit** `model/point_history_classifier/point_history_classifier_label.csv`:

```csv
hello
how are you
i love you
thank you
```

---

## 2. Collect data with the app

Run the app from this folder:

```bash
cd SignSync
python app.py
```

Data is logged only when you are in **logging mode** and press a **number key**.

### Collecting keypoint data (static poses)

1. Press **K** — mode switches to “Logging Key Point”.
2. Press a **number key 0–9** to choose the class (must match the order in `keypoint_classifier_label.csv`).
   - 0 = first label, 1 = second, …, 9 = tenth.
3. Show the **hand pose** for that class to the camera and keep it steady; the app appends one row per frame to `model/keypoint_classifier/keypoint.csv`.
4. Repeat for other classes: press the right number, then hold the pose.
5. Press **N** when you’re done logging (back to normal mode).

**Tips:**

- Collect many frames per class (e.g. 100–500+ per class).
- Slightly move the hand (position/angle) so the model sees variation.
- Do multiple sessions if needed.

### Collecting point history data (gestures)

1. Press **H** — mode switches to “Logging Point History”.
2. Press a **number key 0–9** to choose the gesture class (same order as in `point_history_classifier_label.csv`).
3. Do the **pointer** pose (index finger out; that’s the pose that records the finger trail).
4. **Draw the gesture** with your index finger (e.g. wave for “hello”). The app records the last 16 positions of the index tip; when the buffer is full, it writes one row to `model/point_history_classifier/point_history.csv`.
5. Repeat the same gesture many times (different speeds/sizes) so you get many rows for that class.
6. Change number for another gesture class and repeat.
7. Press **N** when done.

**Tips:**

- Each logged sample is 16 consecutive frames of index-tip positions. Do the full gesture within that window.
- Collect at least 50–200 samples per gesture (more is better).

---

## 3. Train the keypoint classifier

From this folder:

```bash
python train_keypoint.py --epochs 500
```

- Reads `model/keypoint_classifier/keypoint.csv` and `keypoint_classifier_label.csv`.
- **NUM_CLASSES** is taken from the number of lines in the label file.
- Saves:
  - `model/keypoint_classifier/keypoint_classifier.keras`
  - `model/keypoint_classifier/keypoint_classifier.tflite`

Optional: `--epochs`, `--batch_size` (default 128).

---

## 4. Train the point history classifier

```bash
python train_point_history.py --epochs 1000
```

- Reads `model/point_history_classifier/point_history.csv` and `point_history_classifier_label.csv`.
- **NUM_CLASSES** from the label file.
- Saves:
  - `model/point_history_classifier/point_history_classifier.keras`
  - `model/point_history_classifier/point_history_classifier.tflite`

---

## 5. Use the new models

- Run **app.py** again; it loads the `.tflite` models from the same `model/` paths.

---

## Quick reference

| Step | Action |
|------|--------|
| Define keypoint words | Edit `model/keypoint_classifier/keypoint_classifier_label.csv` (one word per line, order = 0,1,…) |
| Define gesture phrases | Edit `model/point_history_classifier/point_history_classifier_label.csv` |
| Log keypoint data | Run `app.py` → **K** → press **0–9** (class) → hold pose; repeat. **N** to stop. |
| Log point history data | Run `app.py` → **H** → press **0–9** (class) → pointer pose + draw gesture; repeat. **N** to stop. |
| Train keypoint | `python train_keypoint.py --epochs 500` |
| Train point history | `python train_point_history.py --epochs 1000` |

---

## If you start from empty CSVs

- **keypoint.csv**: The app will create/append when you log in **K** mode. Format: one row per frame = `class_id, x1, y1, x2, y2, ..., x42, y42` (21 landmarks × 2, normalized).
- **point_history.csv**: Created/appended in **H** mode. Format: `class_id, 32 floats` (16 points × 2).

You can clear old data by deleting or truncating the CSV files before collecting a new dataset.
