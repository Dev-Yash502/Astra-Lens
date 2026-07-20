# 🪐 Astra Lens — Explainable AI Deepfake Detection System

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Astra Lens** is a full-stack, Explainable AI (XAI) deepfake detection platform that classifies real vs. AI-generated images using an optimized **EfficientNet-B0** architecture while generating visual activation heatmaps via **Grad-CAM** and **Grad-CAM++** to explain neural network predictions.

---

## 🌟 Key Features

* 🔍 **Real-Time Classification:** Instant verdict (`REAL IMAGE` or `AI GENERATED`) with confidence percentage telemetry.
* 🔥 **Explainable AI (XAI) Overlays:** Dynamic heatmaps pinpointing specific facial manipulation artifacts, unnatural textures, and edge distortion zones.
* ⚡ **Grad-CAM & Grad-CAM++ Support:** Dual heatmap generation algorithms for deep feature map inspection.
* 📊 **Admin Telemetry & Analytics Dashboard:** Real-time metrics monitoring total scans, forgery ratios, user login history, and registered accounts.
* 🔒 **Supabase & Dev-Mode Auth:** Seamless authentication supporting Google OAuth, Supabase JWT, and offline mock bypass.
* ⚡ **High Efficiency:** Mobile-ready EfficientNet-B0 model trained with composite scaling (~4M parameters), running inference in under 150ms.

---

## 📊 Dataset & Model Performance

### 📁 Dataset Specifications
* **Source:** Hugging Face [`Parveshiiii/AI-vs-Real`](https://huggingface.co/datasets/Parveshiiii/AI-vs-Real)
* **Total Images:** 3,000 balanced images (1,500 Real + 1,500 Fake)
* **Resolution:** 224 × 224 pixels
* **Split:** 80% Training / 20% Validation

### 🏋️ Training Milestones (Two-Stage Transfer Learning)
| Stage | Epochs | Target Layer | Validation Accuracy |
| :--- | :--- | :--- | :--- |
| **Stage 1 (Head Only)** | 5 | Classifier Head (Frozen Base) | `95.00%` |
| **Stage 2 (Fine-Tuning)** | 5 | Unfrozen Base (`features[8]`) | **`97.17%`** |
| **Baseline Paper Benchmark** | - | Custom CNN | `93.55%` |

---

## 🏗️ Project Architecture

```
Astra-Lens/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI main application server & static router
│   │   ├── model.py           # PyTorch EfficientNet-B0 loader & image transforms
│   │   ├── gradcam.py         # Grad-CAM & Grad-CAM++ execution engine
│   │   ├── admin.py           # Administrative dashboard endpoints & user tracking
│   │   ├── analytics.py       # Analytics summary & timeline stats API
│   │   ├── auth.py            # JWT verification & offline auth fallback
│   │   └── mock_db.py         # In-memory session database & metadata map
│   ├── models/
│   │   └── checkpoints/
│   │       └── efficientnet_b0_visionguard.pth  # Trained model weights
│   ├── static/                # Uploaded images & generated heatmaps
│   ├── tests/                 # PyTorch & FastAPI pytest suite
│   └── requirements.txt       # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # React components (Admin, Detector, Result, FAQ, etc.)
│   │   ├── App.jsx            # Main React SPA state orchestrator
│   │   └── index.css          # Tailwind CSS design system & Glassmorphism styles
│   ├── package.json           # Frontend Node.js dependencies
│   └── vite.config.js         # Vite build configuration
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & `npm`

### 1️⃣ Setup Backend (FastAPI + PyTorch)
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server
python -m app.main
```
The FastAPI backend server will start on `http://localhost:8000`.

### 2️⃣ Setup Frontend (React + Vite)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
The React frontend application will start on `http://localhost:5173`.

---

## 🔑 Administrator Access

To access administrative telemetry, user list auditing, and global scan metrics:
* Configure `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your server environment variables or `.env` file.
* Admin panel features live user account auditing, scan telemetry logs, and system metrics.

---

## 🧪 Running Automated Tests

Run the full pytest suite for API routes, authentication logic, and model inference:
```bash
cd backend
pytest
```


