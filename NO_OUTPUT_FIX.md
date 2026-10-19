# Why you might not get output (and how to fix it)

## 1. **No gesture data collected**
- **Symptom:** Gesture line stays empty or never shows "rock" / "paper".
- **Check:** Open `model/point_history_classifier/point_history.csv`. If it's empty or has very few rows, the model was never trained on your words.
- **Fix:** Run `python training.py` → enter `rock, paper` → choose **Gesture (g)** → for each word press SPACE, do the gesture many times, press Q. Then run `python train_point_history.py --epochs 1000`.

## 2. **Model and labels don't match (e.g. "?(5)" or "— (retrain gesture model)")**
- **Symptom:** Finger Gesture shows "?(5)" or "— (retrain gesture model)" even though you have 2 words (e.g. rock, paper) in the label file.
- **Cause:** The saved `.tflite` was trained when you had more classes (e.g. 6). You then changed the label file to only 2 words but didn't retrain, so the model still outputs 0–5 and there is no label for 5.
- **Fix:**
  1. **Collect gesture data** if `model/point_history_classifier/point_history.csv` is empty: run `python training.py` → enter `rock, paper` → choose **Gesture (g)** → record many samples per word (SPACE / Q).
  2. **Retrain** so the TFLite has 2 outputs:
     ```bash
     python train_point_history.py --epochs 1000
     ```
  3. Restart the app. You should then see "rock" or "paper" instead of "?(5)".

## 3. **Run the app from the project folder**
- **Symptom:** App crashes on start or "file not found" for .tflite.
- **Fix:** Always run from the repository root, so the relative `model/` and `hand_landmarker.task` paths resolve:
  ```bash
  cd SignSync
  python app.py
  ```

## 4. **Hand must be visible for gesture**
- The gesture model needs **16 frames** of your index fingertip position. Show your hand and move it (or hold a pose); after ~16 frames you should see "Finger Gesture: rock" or "paper" when the model predicts.

## 5. **Camera or MediaPipe**
- If the camera window never opens, check the camera index in the app (default 0). If hand_landmarker.task is missing, the app may fail; ensure the file is in the project folder or the path set in the code.
