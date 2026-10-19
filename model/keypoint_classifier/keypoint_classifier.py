#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import numpy as np
import tensorflow as tf

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(os.path.dirname(_SCRIPT_DIR))
_DEFAULT_MODEL = os.path.join(_PROJECT_ROOT, "model", "keypoint_classifier", "keypoint_classifier.tflite")


class KeyPointClassifier(object):
    def __init__(
        self,
        model_path=None,
        num_threads=1,
    ):
        if model_path is None:
            model_path = _DEFAULT_MODEL
        self.interpreter = tf.lite.Interpreter(model_path=model_path,
                                               num_threads=num_threads)

        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

    def num_classes(self):
        """Number of output classes (so app can check against label count)."""
        return int(self.output_details[0]["shape"][-1])

    def __call__(
        self,
        landmark_list,
    ):
        input_details_tensor_index = self.input_details[0]['index']
        self.interpreter.set_tensor(
            input_details_tensor_index,
            np.array([landmark_list], dtype=np.float32))
        self.interpreter.invoke()

        output_details_tensor_index = self.output_details[0]['index']

        result = self.interpreter.get_tensor(output_details_tensor_index)

        result_index = np.argmax(np.squeeze(result))

        return result_index
