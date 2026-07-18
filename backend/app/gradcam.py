import torch
import torch.nn.functional as F
import numpy as np
import cv2

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self.forward_hook = self.target_layer.register_forward_hook(self.save_activation)
        self.backward_hook = self.target_layer.register_full_backward_hook(self.save_gradient)
        
    def save_activation(self, module, input, output):
        self.activations = output.detach()
        
    def save_gradient(self, module, grad_input, grad_output):
        # Save the gradient of the output with respect to feature maps
        self.gradients = grad_output[0].detach()
        
    def generate_heatmap(self, input_tensor, class_idx=None):
        self.model.eval()
        self.gradients = None
        self.activations = None
        
        # Forward pass
        output = self.model(input_tensor)
        
        if class_idx is None:
            class_idx = torch.argmax(output, dim=1).item()
            
        # Backward pass
        self.model.zero_grad()
        class_loss = output[0, class_idx]
        class_loss.backward()
        
        if self.gradients is None or self.activations is None:
            raise RuntimeError("Grad-CAM hooks failed to capture gradients/activations. Verify target layer.")
            
        # Global average pooling of gradients
        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True) # shape: [1, C, 1, 1]
        
        # Weighted combination of activations
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True) # shape: [1, 1, H, W]
        cam = torch.clamp(cam, min=0) # Standard Grad-CAM: Apply ReLU to keep only positive contributions
        
        # Resize heatmap to match input tensor resolution
        cam = F.interpolate(cam, size=(input_tensor.shape[2], input_tensor.shape[3]), mode='bilinear', align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        
        # Normalize between 0 and 1
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)
            
        return cam, class_idx
        
    def remove_hooks(self):
        self.forward_hook.remove()
        self.backward_hook.remove()

class GradCAMPlusPlus(GradCAM):
    def generate_heatmap(self, input_tensor, class_idx=None):
        self.model.eval()
        self.gradients = None
        self.activations = None
        
        # Forward pass
        output = self.model(input_tensor)
        
        if class_idx is None:
            class_idx = torch.argmax(output, dim=1).item()
            
        # Backward pass
        self.model.zero_grad()
        class_loss = output[0, class_idx]
        class_loss.backward()
        
        if self.gradients is None or self.activations is None:
            raise RuntimeError("Grad-CAM++ hooks failed to capture gradients/activations. Verify target layer.")
            
        # Gradients and activations
        # First, second, and third-order derivatives
        grads_power_1 = torch.clamp(self.gradients, min=0) # [1, C, H, W]
        grads_power_2 = self.gradients ** 2
        grads_power_3 = self.gradients ** 3
        
        # Sum of activations in spatial dimensions
        sum_activations = torch.sum(self.activations, dim=[2, 3], keepdim=True) # [1, C, 1, 1]
        
        # Compute alpha coefficients (with epsilon to avoid division by zero)
        eps = 1e-8
        denominator = 2.0 * grads_power_2 + sum_activations * grads_power_3 + eps
        alpha = grads_power_2 / denominator
        
        # Calculate weights: sum over spatial dimensions of (alpha * ReLU(gradients))
        weights = torch.sum(alpha * grads_power_1, dim=[2, 3], keepdim=True) # [1, C, 1, 1]
        
        # Saliency map
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        cam = torch.clamp(cam, min=0)
        
        # Resize heatmap to match input tensor resolution
        cam = F.interpolate(cam, size=(input_tensor.shape[2], input_tensor.shape[3]), mode='bilinear', align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        
        # Normalize between 0 and 1
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)
            
        return cam, class_idx

def overlay_heatmap(image_path, heatmap, alpha=0.5, colormap=cv2.COLORMAP_JET):
    # Read the original image
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image at path: {image_path}")
        
    img_h, img_w, _ = img.shape
    
    # Resize heatmap to match original image size
    heatmap_resized = cv2.resize(heatmap, (img_w, img_h))
    
    # Convert heatmap to 8-bit scale
    heatmap_8bit = np.uint8(255 * heatmap_resized)
    
    # Apply standard OpenCV jet colormap
    heatmap_colored = cv2.applyColorMap(heatmap_8bit, colormap)
    
    # Overlay the colored heatmap with alpha blending
    overlayed = cv2.addWeighted(img, 1 - alpha, heatmap_colored, alpha, 0)
    
    return overlayed
