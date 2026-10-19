import csv
import argparse
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split

def main():
    parser = argparse.ArgumentParser(description="Retrain the dynamic point history gesture model.")
    parser.add_argument("--epochs", type=int, default=1000, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=128, help="Batch size for training")
    parser.add_argument("--augment", action="store_true", help="Add light Gaussian noise augmentation for robustness")
    args = parser.parse_args()

    RANDOM_SEED = 42
    dataset = 'model/point_history_classifier/point_history.csv'
    model_save_path = 'model/point_history_classifier/point_history_classifier.keras'
    tflite_save_path = 'model/point_history_classifier/point_history_classifier.tflite'
    label_path = 'model/point_history_classifier/point_history_classifier_label.csv'

    # Dynamically determine the number of classes (supports "index,word" or "word" per line)
    from label_utils import load_labels
    _labels = load_labels(label_path)
    NUM_CLASSES = len(_labels)
    print(f"Detected {NUM_CLASSES} classes from: {label_path} -> {_labels}")

    TIME_STEPS = 16
    DIMENSION = 2

    print(f"Loading dataset from: {dataset} ...")
    try:
        X_dataset = np.loadtxt(dataset, delimiter=',', dtype='float32', usecols=list(range(1, (TIME_STEPS * DIMENSION) + 1)))
        y_dataset = np.loadtxt(dataset, delimiter=',', dtype='int32', usecols=(0))
        if X_dataset.ndim == 1:
            X_dataset = X_dataset.reshape(1, -1)
        if y_dataset.ndim == 0:
            y_dataset = np.array([y_dataset.item()])
        
        if X_dataset.shape[0] == 0:
            raise ValueError("Dataset is empty.")
        # Keep only rows whose label is in [0, NUM_CLASSES) (drop old/invalid labels)
        valid = (y_dataset >= 0) & (y_dataset < NUM_CLASSES)
        if not np.all(valid):
            n_dropped = np.sum(~valid)
            print(f"Dropping {n_dropped} row(s) with label >= {NUM_CLASSES} (label file has {NUM_CLASSES} classes).")
            X_dataset = X_dataset[valid]
            y_dataset = y_dataset[valid]
        if X_dataset.shape[0] == 0:
            raise ValueError("No rows left after filtering. Collect data for classes 0.." + str(NUM_CLASSES - 1) + " only.")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        print("Please ensure you have collected data using the logging mode in app.py")
        return

    X_train, X_test, y_train, y_test = train_test_split(X_dataset, y_dataset, train_size=0.75, random_state=RANDOM_SEED)

    if args.augment:
        # Light Gaussian noise on training data (same shape) for robustness
        noise = np.random.RandomState(RANDOM_SEED).normal(0, 0.02, X_train.shape).astype(np.float32)
        X_train = X_train + noise
        print("Applied light noise augmentation to training set.")

    print("Building model...")
    model = tf.keras.models.Sequential([
        tf.keras.layers.InputLayer(input_shape=(TIME_STEPS * DIMENSION, )),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(24, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(10, activation='relu'),
        tf.keras.layers.Dense(NUM_CLASSES, activation='softmax')
    ])

    model.summary()

    # Callbacks: save best model by val_loss, reduce LR on plateau, early stop
    cp_callback = tf.keras.callbacks.ModelCheckpoint(
        model_save_path, verbose=1, save_weights_only=False, save_best_only=True, monitor="val_loss", mode="min"
    )
    lr_callback = tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5, patience=10, min_lr=1e-6, verbose=1
    )
    es_callback = tf.keras.callbacks.EarlyStopping(patience=30, verbose=1, restore_best_weights=True)

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    print("Training model...")
    model.fit(
        X_train,
        y_train,
        epochs=args.epochs,
        batch_size=args.batch_size,
        validation_data=(X_test, y_test),
        callbacks=[cp_callback, lr_callback, es_callback]
    )

    # Save and evaluate accuracy on test data
    val_loss, val_acc = model.evaluate(X_test,  y_test, verbose=2)
    print(f"Final Validation Accuracy: {val_acc*100:.2f}%")

    print(f"Saving Keras model to {model_save_path} ...")
    model.save(model_save_path, include_optimizer=False)

    print("Converting to TensorFlow Lite format...")
    # Convert model to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_quantized_model = converter.convert()

    print(f"Saving TFLite model to {tflite_save_path} ...")
    with open(tflite_save_path, 'wb') as f:
        f.write(tflite_quantized_model)

    print("Successfully retrained and saved the model!")
    print("You can now run `python app.py` to test your new gestures.")
    try:
        from popup_utils import show_completed
        show_completed("Point history (gesture) model training completed.\n\nModel and TFLite saved.\nRun app.py to test.", title="Training completed")
    except Exception:
        pass

if __name__ == '__main__':
    main()
