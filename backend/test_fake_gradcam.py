import os
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
import cv2
import numpy as np

model_path = r"D:\coding\Hackathons, Projects and other\ai ml project\Cifake v2\backend\models\checkpoints\efficientnet_b0_visionguard.pth"
image_path = r"D:\coding\Hackathons, Projects and other\ai ml project\CIFAKE Image Classification and Explainable Identification of AI-Generated Synthetic Images\testImages\test4.jpg"

from app.gradcam import GradCAM

try:
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(1280, 2)
    checkpoint = torch.load(model_path, map_location='cpu')
    if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    model.eval()
    
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    cv2_image = cv2.imread(image_path)
    rgb_image = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB)
    input_tensor = transform(rgb_image).unsqueeze(0)
    
    target_layer = model.features[8]
    grad_cam = GradCAM(model, target_layer)
    
    with torch.enable_grad():
        # Test class 1 (FAKE)
        heatmap, pred_idx = grad_cam.generate_heatmap(input_tensor, 1)
        
    print("=" * 60)
    print("GRAD-CAM CLASS 1 DIAGNOSTICS")
    print("=" * 60)
    print(f"Activations shape: {grad_cam.activations.shape if grad_cam.activations is not None else 'None'}")
    print(f"Gradients shape: {grad_cam.gradients.shape if grad_cam.gradients is not None else 'None'}")
    
    if grad_cam.gradients is not None:
        print(f"Gradients sum: {grad_cam.gradients.sum().item():.4f}")
        print(f"Gradients max: {grad_cam.gradients.max().item():.6f}")
        print(f"Gradients min: {grad_cam.gradients.min().item():.6f}")
        
    print(f"Heatmap min/max: {heatmap.min():.4f} / {heatmap.max():.4f}")
    print(f"Heatmap unique values: {len(np.unique(heatmap))}")
    print("=" * 60)

except Exception as e:
    print(f"ERROR: {e}")
