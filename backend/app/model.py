import os
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms

import gc

# Conserve RAM on low-memory servers (e.g. Render Free Tier 512MB RAM limit)
torch.set_num_threads(1)

# Setup Model
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "checkpoints", "efficientnet_b0_visionguard.pth"))
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Loading PyTorch model on device: {device}...")
model = models.efficientnet_b0(weights=None)
model.classifier[1] = nn.Linear(1280, 2) # Adjust for binary REAL/FAKE classification

if os.path.exists(model_path):
    try:
        checkpoint = torch.load(model_path, map_location=device)
        if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
            model.load_state_dict(checkpoint['model_state_dict'])
        elif isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
            model.load_state_dict(checkpoint['state_dict'])
        else:
            model.load_state_dict(checkpoint)
        print("PyTorch model loaded successfully!")
    except Exception as e:
        print(f"ERROR loading model state dict: {e}")
else:
    print(f"WARNING: Weights file not found at {model_path}! Model will run with random weights.")

model = model.to(device)
model.eval()

# Clean up temporary loading buffers from memory
if 'checkpoint' in locals():
    del checkpoint
gc.collect()

# Transforms for ImageNet pre-training / EfficientNet
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])
