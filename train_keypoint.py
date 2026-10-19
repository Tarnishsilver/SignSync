"""
Train the keypoint classifier (static hand poses -> words) on keypoint.csv.
Usage: python train_keypoint.py [--epochs 500] [--batch_size 128]
Saves: keypoint_classifier.keras and keypoint_classifier.tflite
"""
import csv
import argparse
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split

RANDOM_SEED = 42

def main():
    parser = argparse.ArgumentParser(description="Train keypoint classifier (static poses -> words)")
    parser.add_argument("--epochs", type=int, default=500)
    parser.add_argument("--batch_size", type=int, default=128)
    parser.add_argument("--augment", action="store_true", help="Add light Gaussian noise for robustness")
    args = parser.parse_args()

    dataset_path = "model/keypoint_classifier/keypoint.csv"
    model_save_path = "model/keypoint_classifier/keypoint_classifier.keras"
    tflite_save_path = "model/keypoint_classifier/keypoint_classifier.tflite"
    label_path = "model/keypoint_classifier/keypoint_classifier_label.csv"

    # Number of classes from label file (supports "index,word" or "word" per line)
    from label_utils import load_labels
    _labels = load_labels(label_path)
    NUM_CLASSES = len(_labels)
    print(f"Classes (from {label_path}): {NUM_CLASSES} -> {_labels}")

    # Load data: column 0 = class, columns 1..42 = 21*2 landmark values
    print(f"Loading {dataset_path} ...")
    try:
        X_dataset = np.loadtxt(
            dataset_path,
            delimiter=",",
            dtype="float32",
            usecols=list(range(1, 21 * 2 + 1)),
        )
        y_dataset = np.loadtxt(dataset_path, delimiter=",", dtype="int32", usecols=(0))
        if X_dataset.shape[0] == 0:
            raise ValueError("Dataset is empty.")
    except Exception as e:
        print(f"Error: {e}")
        print("Collect data with app.py: press K, then 0-9 (class), hold pose. See TRAINING.md")
        return

    X_train, X_test, y_train, y_test = train_test_split(
        X_dataset, y_dataset, train_size=0.75, random_state=RANDOM_SEED
    )
    if args.augment:
        noise = np.random.RandomState(RANDOM_SEED).normal(0, 0.02, X_train.shape).astype(np.float32)
        X_train = X_train + noise
        print("Applied light noise augmentation to training set.")

    print("Building model...")
    model = tf.keras.models.Sequential([
        tf.keras.layers.Input((21 * 2,)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(20, activation="relu"),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(10, activation="relu"),
        tf.keras.layers.Dense(NUM_CLASSES, activation="softmax"),
    ])
    model.summary()

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    cp_callback = tf.keras.callbacks.ModelCheckpoint(
        model_save_path, verbose=1, save_best_only=True, monitor="val_loss", mode="min"
    )
    lr_callback = tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5, patience=10, min_lr=1e-6, verbose=1
    )
    es_callback = tf.keras.callbacks.EarlyStopping(patience=30, verbose=1, restore_best_weights=True)

    print("Training...")
    model.fit(
        X_train,
        y_train,
        epochs=args.epochs,
        batch_size=args.batch_size,
        validation_data=(X_test, y_test),
        callbacks=[cp_callback, lr_callback, es_callback],
    )

    val_loss, val_acc = model.evaluate(X_test, y_test, verbose=2)
    print(f"Validation accuracy: {val_acc*100:.2f}%")

    print(f"Saving Keras model to {model_save_path} ...")
    model.save(model_save_path, include_optimizer=False)

    print("Converting to TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    with open(tflite_save_path, "wb") as f:
        f.write(tflite_model)
    print(f"Saved TFLite to {tflite_save_path}")
    print("Run app.py or Final Move to use the new model.")
    try:
        from popup_utils import show_completed
        show_completed("Keypoint model training completed.\n\nModel and TFLite saved.\nRun app.py to test.", title="Training completed")
    except Exception:
        pass


if __name__ == "__main__":
    main()
