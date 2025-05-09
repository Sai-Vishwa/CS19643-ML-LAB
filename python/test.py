import cv2
import numpy as np
from tensorflow.keras.models import load_model
import os
import sys
import random

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf
tf.get_logger().setLevel('ERROR')


model = load_model("C:/Users/SaivishwaramRamkumar/Desktop/pothole.ai/python/pothole_detector_model.h5")

class_names = ['normal', 'pothole', 'random']

def predict_image():
    img = cv2.imread("C:/Users/SaivishwaramRamkumar/Desktop/pothole.ai/backend/complaint/temp_image.jpg")
    if img is None:
        print("Error: Could not read image")
        return

    img = cv2.resize(img, (128, 128))
    img = img / 255.0
    img = np.expand_dims(img, axis=0)

    prediction = model.predict(img)
    class_index = np.argmax(prediction)
    confidence = prediction[0][class_index]

    print(f"{class_names[class_index]} ({confidence*100:.2f}%)")

if __name__ == "__main__":
       predict_image()
