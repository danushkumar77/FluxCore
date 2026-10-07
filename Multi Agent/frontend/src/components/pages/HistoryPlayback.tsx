import React, { useState, useEffect } from "react";
import { PlayCircle, PauseCircle, FastForward, Sliders, Activity, Clock, ShieldAlert } from "lucide-react";

export const HistoryPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sliderVal, setSliderVal] = useState(0);

  // Playback ticks loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSliderVal((prev) => (prev >= 100 ? 0 : prev + 1 * playbackSpeed));
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Interpolate mock parameters based on scrubber position
  const voltage = (114.2 + (sliderVal % 10) * 0.1).toFixed(1);
  const load = (78.5 + (sliderVal % 15) * 0.4).toFixed(1);
  const soc = Math.max(0, Math.min(100, 85 - Math.round(sliderVal * 0.3)));
  const gen = (12.4 + (sliderVal % 8) * 0.6).toFixed(1);

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Playback Deck Control Console */}
      <div className="p-5 glass-panel rounded-xl border border-white/5 space-y-4">
        <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
          <Clock className="w-4 h-4 mr-1.5" /> SCADA History Playback Deck
        </h3>
        
        {/* Scrubbing slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Historical Log Start (21:00:00)</span>
            <span className="text-brand-cyan font-bold">Scrubbing: 21:00:{sliderVal.toString().padStart(2, '0')}</span>
            <span>Current Time (21:30:00)</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={sliderVal}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
          />
        </div>

        {/* Buttons layout */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1 hover:text-white transition rounded-full ${isPlaying ? "text-brand-rose" : "text-brand-cyan"}`}
            >
              {isPlaying ? <PauseCircle className="w-8 h-8" /> : <PlayCircle className="w-8 h-8" />}
            </button>
            
            <div className="flex space-x-1 border-l border-white/10 pl-3">
              {[1, 2, 5].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setPlaybackSpeed(sp)}
                  className={`px-2.5 py-1 rounded text-[9px] uppercase font-bold border transition ${
                    playbackSpeed === sp 
                      ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40" 
                      : "bg-white/5 text-slate-400 border-white/5"
                  }`}
                >
                  {sp}x Speed
                </button>
              ))}
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
            isPlaying 
              ? "bg-brand-rose/10 text-brand-rose border-brand-rose/20 animate-pulse" 
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}>
            {isPlaying ? "Replaying Log Ticks" : "Playback Paused"}
          </span>
        </div>
      </div>

      {/* 2. Frozen state measurements */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-500 block">Replay Voltage</span>
          <p className="text-sm font-bold text-white font-mono">{voltage} kV</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-500 block">Replay Load</span>
          <p className="text-sm font-bold text-white font-mono">{load} MW</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-500 block">Replay Gen</span>
          <p className="text-sm font-bold text-white font-mono">{gen} MW</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-500 block">Replay BESS SOC</span>
          <p className="text-sm font-bold text-brand-purple font-mono">{soc}%</p>
        </div>
      </div>

    </div>
  );
};
