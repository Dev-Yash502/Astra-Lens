import React from 'react';
import { UploadCloud, Cpu } from 'lucide-react';

export default function UploadBox({
  isScanning,
  previewUrl,
  selectedFile,
  handleFileChange,
  handleScan,
  xaiMethod,
  setXaiMethod
}) {
  return (
    <div className="glass-panel p-8 lg:col-span-5 flex flex-col items-center">
      {isScanning ? (
        /* Laser Scanning animation view */
        <div className="w-full flex flex-col items-center py-10">
          <div className="scanner-container max-w-[280px] w-full relative mb-6">
            <div className="scanner-laser"></div>
            <img 
              src={previewUrl} 
              alt="Scanning preview" 
              className="w-full h-auto object-cover rounded-2xl opacity-60 border border-white/5" 
            />
          </div>
          <h3 className="font-space font-bold text-indigo-400 text-lg mb-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 animate-spin" /> Running PyTorch Inference...
          </h3>
          <p className="text-zinc-500 text-sm text-center">
            Processing activations at features[8] layer and computing colormaps
          </p>
        </div>
      ) : (
        <form onSubmit={handleScan} className="w-full space-y-6">
          <div 
            onClick={() => document.getElementById('file-picker').click()}
            className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 bg-white/[0.01] rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group"
          >
            <UploadCloud className="w-12 h-12 text-indigo-500 group-hover:scale-110 transition-transform duration-300 mb-4" />
            <h4 className="font-space font-semibold text-lg text-white mb-2">Drop your image here</h4>
            <p className="text-zinc-500 text-sm mb-4">PNG, JPG, WEBP formats up to 10MB</p>
            <button 
              type="button" 
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
            >
              Browse File
            </button>
            
            <input 
              type="file" 
              id="file-picker" 
              required 
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept="image/*"
            />
          </div>

          {previewUrl && (
            <div className="flex flex-col items-center">
              <span className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-space">Selected Image</span>
              <img src={previewUrl} alt="Preview" className="max-w-[200px] h-auto rounded-2xl border border-white/5 object-cover" />
            </div>
          )}

          {/* Explainable AI Method Selector */}
          <div className="w-full text-left space-y-2">
            <label className="block text-zinc-400 text-xs uppercase tracking-wider font-space">Explainable AI (XAI) Method</label>
            <select
              value={xaiMethod}
              onChange={(e) => setXaiMethod(e.target.value)}
              className="glass-input text-sm w-full py-3.5 bg-zinc-950/80 border border-white/10 rounded-xl focus:border-indigo-500 transition-all font-space"
            >
              <option value="gradcam">Standard Grad-CAM (Direct Gradients)</option>
              <option value="gradcam++">Grad-CAM++ (Higher-Order Gradients)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={!selectedFile}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed font-bold font-space transition-all shadow-glow"
          >
            Classify & Compute {xaiMethod === 'gradcam++' ? 'Grad-CAM++' : 'Grad-CAM'}
          </button>
        </form>
      )}
    </div>
  );
}
