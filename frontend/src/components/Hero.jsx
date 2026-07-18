import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Hero({ onStartScan, onViewFaq }) {
  return (
    <div className="flex-1 text-left max-w-xl">
      <span className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6 font-space">
        ⚡ PyTorch EfficientNet-B0 Classifier
      </span>
      <h1 className="text-5xl lg:text-6xl font-extrabold font-space leading-[1.1] mb-6">
        Deepfake & AI <br />
        <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Image Authenticity
        </span> <br />
        Verification Platform
      </h1>
      <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
        Utilize our advanced neural network optimized for detecting edge anomalies, generative patterns, and synthetic textures with high-fidelity explainable Grad-CAM activation mapping.
      </p>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onStartScan}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-bold shadow-glow hover:-translate-y-0.5 transition-all flex items-center gap-2 font-space text-lg"
        >
          <Sparkles className="w-5 h-5" /> Start Scan Now
        </button>
        <button 
          onClick={onViewFaq}
          className="px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-bold hover:-translate-y-0.5 transition-all text-lg font-space"
        >
          View Viva Cheatsheet
        </button>
      </div>
    </div>
  );
}
