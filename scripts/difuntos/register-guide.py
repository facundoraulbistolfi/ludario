"""Re-register the official guide against the bundled georeferenced satellite.

Optional maintenance helper (numpy + opencv-python-headless); not needed at runtime.
Prints the homography and residuals. Never uses personal GPS records.
"""
from pathlib import Path
import cv2
import numpy as np

root = Path(__file__).resolve().parents[2] / 'public/difuntos/assets'
guide = cv2.imread(str(next(root.glob('guide-*.webp'))))
satellite = cv2.imread(str(next(root.glob('satellite-*.webp'))))
sift = cv2.SIFT_create(nfeatures=18000)
ka, da = sift.detectAndCompute(guide, None)
kb, db = sift.detectAndCompute(satellite, None)
matches = [m for m, n in cv2.BFMatcher().knnMatch(da, db, k=2) if m.distance < .7*n.distance]
a = np.float32([ka[m.queryIdx].pt for m in matches])
b = np.float32([kb[m.trainIdx].pt for m in matches])
h, mask = cv2.findHomography(a, b, cv2.RANSAC, 5)
inliers = mask.ravel().astype(bool)
if inliers.sum() < 30:
    raise RuntimeError('Insufficient independent matches; do not update geography')
errors = np.linalg.norm(cv2.perspectiveTransform(a[:, None], h)[:, 0] - b, axis=1)[inliers]
print('Homography:', h.tolist())
print('Inliers:', int(inliers.sum()), 'RMS pixels:', float(np.sqrt(np.mean(errors**2))))
print('Coverage in guide pixels:', a[inliers].min(axis=0).tolist(), a[inliers].max(axis=0).tolist())
print('Residuals measure image registration, not trail or GPS accuracy.')
