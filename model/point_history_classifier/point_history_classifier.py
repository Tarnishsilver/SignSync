#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import numpy as np
import tensorflow as tf

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Project root = parent of model/ folder (model/point_history_classifier/ -> model/ -> root)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(_SCRIPT_DIR))
_DEFAULT_MODEL = os.path.join(_PROJECT_ROOT, "model", "point_history_classifier", "point_history_classifier.tflite")


class PointHistoryClassifier(object):
    def __init__(
        self,
        model_path=None,
        score_th=0.2,
        invalid_value=0,
        num_threads=1,
    ):
        if model_path is None:
            model_path = _DEFAULT_MODEL
        self.interpreter = tf.lite.Interpreter(model_path=model_path,
                                               num_threads=num_threads)

        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

        self.score_th = score_th
        self.invalid_value = invalid_value

    def num_classes(self):
        """Number of output classes (so app can check against label count)."""
        return int(self.output_details[0]["shape"][-1])

    def __call__(
        self,
        point_history,
    ):
        input_details_tensor_index = self.input_details[0]['index']
        self.interpreter.set_tensor(
            input_details_tensor_index,
            np.array([point_history], dtype=np.float32))
        self.interpreter.invoke()

        output_details_tensor_index = self.output_details[0]['index']

        result = self.interpreter.get_tensor(output_details_tensor_index)

        result_index = np.argmax(np.squeeze(result))
        confidence = float(np.squeeze(result)[result_index])

        # Only reject if confidence very low (0.2), so new words can still show
        if confidence < self.score_th:
            result_index = self.invalid_value

        return result_index
