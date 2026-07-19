import React from 'react';

export default function FaqPanel() {
  return (
    <div className="w-full max-w-4xl space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-extrabold font-space bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-3">
          FAQ & Technical Documentation
        </h2>
        <p className="text-zinc-400">
          Key technical specifications, dataset details, and architecture documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 space-y-4">
          <h3 className="font-space text-xl font-bold text-indigo-400 flex items-center gap-2">
            🧠 1. Model Architecture
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            The model utilizes **EfficientNet-B0** pre-trained on ImageNet and fine-tuned for real-vs-fake classification. It is a highly optimized Convolutional Neural Network that uses a composite coefficient to scale network depth, width, and resolution.
          </p>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-indigo-300">
            Total Parameters: 4,052,175 (~4 Million)<br />
            Input Dimension: 224 x 224 x 3<br />
            Target layers: model.features[8]
          </div>
        </div>

        <div className="glass-panel p-8 space-y-4">
          <h3 className="font-space text-xl font-bold text-indigo-400 flex items-center gap-2">
            🔥 2. What is Explainable AI (XAI)?
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Typically, deep learning models act as "Black Boxes". We use **Grad-CAM (Gradient-weighted Class Activation Mapping)** to visualize which regions of the image influenced the neural network's classification.
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed">
            By calculating gradients of the target class score with respect to feature maps of the final convolutional layer, we highlight spatial features (compression artifacts, warping edges, unnatural patterns) in red/yellow overlay.
          </p>
        </div>

        <div className="glass-panel p-8 space-y-4 md:col-span-2 border border-indigo-500/20 bg-indigo-500/[0.03]">
          <h3 className="font-space text-xl font-bold text-indigo-400 flex items-center gap-2">
            🚀 3. Model Training & Evaluation Summary (M1–M4 Milestones)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-space pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-indigo-400 font-bold block mb-1">M1 • Project Setup</span>
              <p className="text-zinc-400 text-[11px] font-sans">Modular FastAPI + React architecture with Virtual Environment & PyTorch runtime.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-indigo-400 font-bold block mb-1">M2 • Data Pipeline</span>
              <p className="text-zinc-400 text-[11px] font-sans">Parveshiiii/AI-vs-Real (HuggingFace): 3,000 images (1.5k real, 1.5k fake), 80/20 train/val split.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-indigo-400 font-bold block mb-1">M3 • 2-Stage Transfer Learning</span>
              <p className="text-zinc-400 text-[11px] font-sans">Stage 1 (Head): 95.0% Acc.<br />Stage 2 (Fine-tune): <strong className="text-emerald-400">97.17% Val Acc</strong> (Beats 93.55% base paper).</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-indigo-400 font-bold block mb-1">M4 • XAI Explainability</span>
              <p className="text-zinc-400 text-[11px] font-sans">Grad-CAM & Grad-CAM++ tested with 99.38% Real & 99.99% Fake visual confidence.</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 space-y-4 md:col-span-2">
          <h3 className="font-space text-xl font-bold text-indigo-400 flex items-center gap-2">
            ❓ Frequently Asked Questions (FAQ)
          </h3>
          
          <div className="space-y-6 text-sm divide-y divide-white/5 pt-2">
            <div className="pt-4">
              <p className="font-space font-bold text-white mb-1.5">Q: Why did you choose EfficientNet-B0 instead of ResNet or a custom CNN?</p>
              <p className="text-zinc-400">A: EfficientNet-B0 uses compound scaling, achieving a high validation accuracy of 97.17% (beating the base paper benchmark of 93.55%) with only ~4 million parameters, making it lightweight and fast for deployment.</p>
            </div>

            <div className="pt-4">
              <p className="font-space font-bold text-white mb-1.5">Q: What dataset was used for model training?</p>
              <p className="text-zinc-400">A: We utilized the Parveshiiii/AI-vs-Real dataset from HuggingFace, containing a balanced distribution of 1,500 real and 1,500 fake images (224x224 resolution) with an 80/20 train/validation split.</p>
            </div>
            
            <div className="pt-4">
              <p className="font-space font-bold text-white mb-1.5">Q: How does authentication and storage persist?</p>
              <p className="text-zinc-400">A: We use Supabase Auth for JWT session management with an offline dev-mode fallback. Scanned images and Grad-CAM overlays persist to local static storage or Supabase Storage bucket.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
