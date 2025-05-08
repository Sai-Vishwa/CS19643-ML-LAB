import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv2D, Reshape, Dense, Flatten, MaxPooling2D, Dropout, BatchNormalization
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
import os
import numpy as np
import cv2

# Load and preprocess dataset
def load_images(data_dir, img_size=(128, 128)):
    images = []
    labels = []
    class_names = os.listdir(data_dir)
    
    for idx, class_name in enumerate(class_names):
        class_path = os.path.join(data_dir, class_name)
        for img_file in os.listdir(class_path):
            img_path = os.path.join(class_path, img_file)
            img = cv2.imread(img_path)
            img = cv2.resize(img, img_size)
            images.append(img)
            labels.append(idx)

    return np.array(images) / 255.0, tf.keras.utils.to_categorical(labels, num_classes=len(class_names))

# Load dataset
X, y = load_images("dataset/", img_size=(128, 128))
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2)

# Build CNN model (Capsule-like structure using spatially-aware blocks)
def build_model(input_shape, num_classes):
    inputs = Input(shape=input_shape)
    
    x = Conv2D(64, (3,3), activation='relu', padding='same')(inputs)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2,2))(x)

    x = Conv2D(128, (3,3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2,2))(x)

    x = Conv2D(256, (3,3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2,2))(x)

    x = Flatten()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.5)(x)

    outputs = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=inputs, outputs=outputs)
    return model

# Compile and train the model
model = build_model((128, 128, 3), num_classes=y.shape[1])
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

model.summary()

# Data augmentation
datagen = ImageDataGenerator(rotation_range=10, zoom_range=0.1, horizontal_flip=True)

# Train
model.fit(datagen.flow(X_train, y_train, batch_size=32),
          validation_data=(X_val, y_val),
          epochs=20)

# Save model
model.save("pothole_detection_model.h5")
