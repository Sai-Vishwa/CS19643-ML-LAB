import os
import cv2
import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

def load_features(directory, img_size=(128, 128), limit=200):
    features = []
    count = 0
    for class_folder in sorted(os.listdir(directory)):
        class_path = os.path.join(directory, class_folder)
        if not os.path.isdir(class_path):
            continue
        for file in os.listdir(class_path):
            if count >= limit:
                break
            file_path = os.path.join(class_path, file)
            img = cv2.imread(file_path)
            if img is None:
                continue
            img = cv2.resize(img, img_size)
            img = img / 255.0
            gray = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
            mean = np.mean(gray)
            std = np.std(gray)
            max_val = np.max(gray)
            min_val = np.min(gray)
            features.append([mean, std, max_val, min_val])
            count += 1
    return pd.DataFrame(features, columns=["Mean", "StdDev", "Max", "Min"])

# Load statistical features from images
df = load_features("dataset/", limit=200)

# Correlation matrix
corr_matrix = df.corr()

# Plot
sns.heatmap(corr_matrix, annot=True, cmap='coolwarm')
plt.title("Correlation Matrix of Image-Level Features")
plt.show()
