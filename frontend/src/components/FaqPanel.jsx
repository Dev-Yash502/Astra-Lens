import React from 'react';

export default function FaqPanel() {
  return (
    <div className="w-full max-w-4xl space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-extrabold font-space bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-3">
          Viva Cheatsheet & Documentation
        </h2>
        <p className="text-zinc-400">
          Key technical details of your project to explain to your examiners.
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

        <div className="glass-panel p-8 space-y-4 md:col-span-2">
          <h3 className="font-space text-xl font-bold text-indigo-400 flex items-center gap-2">
            ❓ Common Viva Questions & Answers
          </h3>
          
          <div className="space-y-6 text-sm divide-y divide-white/5 pt-2">
            <div className="pt-4">
              <p className="font-space font-bold text-white mb-1.5">Q: Why did you choose EfficientNet-B0 instead of ResNet or a custom CNN?</p>
              <p className="text-zinc-400">A: EfficientNet-B0 uses mobile-ready architecture scaling, achieving higher accuracy (up to 97.17% validation accuracy) with only 4 million parameters, making it computationally light, fast, and suitable for CPU server deployments.</p>
            </div>
            
            <div className="pt-4">
              <p className="font-space font-bold text-white mb-1.5">Q: Why is the input image resized to 224x224?</p>
              <p className="text-zinc-400">A: EfficientNet-B0 requires 224x224 RGB inputs. Resizing allows the model to process arbitrary high-resolution uploads while standardizing batch dimensions for mathematical operations.</p>
            </div>

            <div className="pt-4">
              <p className="font-space font-bold text-white mb-1.5">Q: How does authentication and storage persist?</p>
              <p className="text-zinc-400">A: We use Supabase Auth for JWT session generation. When a scan finishes, the FastAPI server pushes the original image and Grad-CAM overlay directly to a Supabase Cloud Storage bucket, and registers the metadata into a secure PostgreSQL table.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
