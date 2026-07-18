import React from 'react';
import { Sliders, CheckCircle, AlertTriangle, Eye, Sparkles } from 'lucide-react';

export default function ResultCard({
  scanResult,
  heatmapOpacity,
  setHeatmapOpacity
}) {
  if (!scanResult) {
    return (
      <div className="border-2 border-dashed border-white/5 rounded-3xl p-16 text-center flex flex-col items-center">
        <Sliders className="w-12 h-12 text-zinc-600 mb-4 animate-pulse" />
        <h4 className="font-space font-semibold text-zinc-400 text-lg mb-2">Awaiting Scan Input</h4>
        <p className="text-zinc-500 text-sm max-w-xs">
          Upload an image file and launch the classification process to view prediction telemetry and activation heatmaps.
        </p>
      </div>
    );
  }

  const origSrc = scanResult.orig_b64 
    ? `data:image/jpeg;base64,${scanResult.orig_b64}` 
    : (scanResult.orig_url_fallback || scanResult.image_url);

  const heatSrc = scanResult.heat_b64 
    ? `data:image/jpeg;base64,${scanResult.heat_b64}` 
    : (scanResult.heat_url_fallback || scanResult.heatmap_url);

  const confPercent = scanResult.confidence * 100;
  const isReal = scanResult.prediction === 'REAL';
  const barColor = isReal ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
  const processingTime = scanResult.processing_time_ms !== undefined ? `${scanResult.processing_time_ms} ms` : 'N/A';

  return (
    <div className="glass-panel p-8 w-full space-y-8 animate-fade-in">
      {/* Top Header Section with Model Metadata, Processing Time, & Confidence Bar */}
      <div className="border-b border-white/10 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-space text-2xl font-bold">Analysis Verdict</h3>
            <p className="text-zinc-400 text-xs mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono">
              <span>🤖 Model: EfficientNet-B0 v1.0 (Astra Lens)</span>
              <span>⏱️ Processing: {processingTime}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isReal ? (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.15)] font-space">
                <CheckCircle className="w-4 h-4" /> Real Image
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.15)] font-space">
                <AlertTriangle className="w-4 h-4" /> AI Generated
              </span>
            )}
          </div>
        </div>

        {/* Detection Confidence Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-semibold text-zinc-400 font-space">
            <span>Detection Confidence</span>
            <span className={`${isReal ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>{confPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden border border-white/10 p-[1px]">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
              style={{ width: `${confPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Grad-CAM Side-by-Side Comparison */}
      <div className="w-full flex flex-col md:flex-row gap-8 justify-center items-center">
        {/* Left: Original Image */}
        <div className="flex-1 flex flex-col items-center space-y-3 w-full max-w-[380px]">
          <span className="text-sm font-semibold text-zinc-400 flex items-center gap-1.5 font-space">
            <Eye className="w-4 h-4" /> Original Image
          </span>
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-glass w-full aspect-square relative bg-zinc-950">
            <img 
              src={origSrc} 
              alt="Original" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right: Grad-CAM Blend */}
        <div className="flex-1 flex flex-col items-center space-y-3 w-full max-w-[380px]">
          <span className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5 font-space">
            <Sparkles className="w-4 h-4 animate-pulse" /> Explainable Heatmap
          </span>
          <div className="rounded-2xl overflow-hidden border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.15)] w-full aspect-square relative bg-zinc-950">
            {/* Base Original Layer */}
            <img 
              src={origSrc} 
              alt="Original Base" 
              className="w-full h-full object-cover"
            />
            {/* Overlay Heatmap Layer */}
            <img 
              src={heatSrc} 
              alt="Heatmap Overlay" 
              className="w-full h-full object-cover absolute inset-0 block transition-all"
              style={{ opacity: heatmapOpacity }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Slider Controller */}
      <div className="w-full flex flex-col items-center mt-4">
        <div className="w-full max-w-[400px] space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
            <span>Original View</span>
            <span className="text-indigo-400 font-space font-bold">Heatmap Opacity: {Math.round(heatmapOpacity * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] text-zinc-400 text-sm leading-relaxed">
        💡 <strong>Visual Rationale:</strong> Move the intensity slider above to see where the neural network focused. High-red zones represent the pixels, edges, or texture anomalies that influenced the model's decision.
      </div>
    </div>
  );
}
