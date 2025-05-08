import os
import cv2
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split

def load_images(directory, img_size=(128, 128)):
    X = []
    y = []
    class_names = os.listdir(directory)
    class_names = [name for name in class_names if os.path.isdir(os.path.join(directory, name))]
    class_names.sort()  # ensure consistent ordering
    for idx, class_name in enumerate(class_names):
        class_path = os.path.join(directory, class_name)
        for file in os.listdir(class_path):
            file_path = os.path.join(class_path, file)
            img = cv2.imread(file_path)
            if img is None:
                print(f"[Warning] Skipped unreadable image: {file_path}")
                continue
            img = cv2.resize(img, img_size)
            img = img / 255.0
            X.append(img)
            y.append(idx)
    return np.array(X), np.array(y), class_names

def build_model(input_shape, num_classes):
    model = Sequential()
    model.add(Conv2D(32, (3, 3), activation='relu', input_shape=input_shape))
    model.add(MaxPooling2D((2, 2)))
    model.add(Conv2D(64, (3, 3), activation='relu'))
    model.add(MaxPooling2D((2, 2)))
    model.add(Flatten())
    model.add(Dense(128, activation='relu'))
    model.add(Dropout(0.3))
    model.add(Dense(num_classes, activation='softmax'))
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

# Load and preprocess data
X, y, class_names = load_images("dataset/", img_size=(128, 128))
y = to_categorical(y, num_classes=len(class_names))

# Split into train/val sets
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# Build and train model
model = build_model((128, 128, 3), num_classes=y.shape[1])
model.fit(X_train, y_train, epochs=10, validation_data=(X_val, y_val), batch_size=32)

# Save model
model.save("pothole_detector_model.h5")

print(f"Training complete. Classes: {class_names}")
