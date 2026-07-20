import cv2
import numpy as np

img_path = "decoded_heat.jpg"
img = cv2.imread(img_path)

if img is None:
    print(f"ERROR: Could not load {img_path}")
else:
    print("=" * 60)
    print("IMAGE PIXEL DIAGNOSTICS")
    print("=" * 60)
    print(f"Shape: {img.shape}")
    
    # Calculate channel stats (Blue, Green, Red)
    b_channel = img[:,:,0]
    g_channel = img[:,:,1]
    r_channel = img[:,:,2]
    
    print(f"Blue channel  - Mean: {b_channel.mean():.2f}, Min: {b_channel.min()}, Max: {b_channel.max()}")
    print(f"Green channel - Mean: {g_channel.mean():.2f}, Min: {g_channel.min()}, Max: {g_channel.max()}")
    print(f"Red channel   - Mean: {r_channel.mean():.2f}, Min: {r_channel.min()}, Max: {r_channel.max()}")
    
    # Calculate difference between Red and Blue to see if colormap exists
    diff = np.abs(r_channel.astype(float) - b_channel.astype(float))
    print(f"Max absolute R-B difference: {diff.max()}")
    print(f"Mean absolute R-B difference: {diff.mean():.2f}")
    print("=" * 60)
