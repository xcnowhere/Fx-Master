import React, { useState, useEffect, useCallback } from 'react';
import { EFFECTS, CATEGORY_COLORS } from './constants';
import { EffectDef, EffectCategory, CATEGORY_CN } from './types';
import { useAudio } from './hooks/useAudio';
import Visualizer from './components/Visualizer';
import EffectCard from './components/EffectCard';
import { Play, Square, Activity, Sliders, Info } from 'lucide-react';

export default function App() {
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const { togglePlay, isPlaying, analyser, setEffect, updateParams } = useAudio();
  
  // Generic Parameter State
  const [params, setParams] = useState<Record<string, number>>({});

  // Reset params when effect changes
  useEffect(() => {
    const effect = EFFECTS.find(e => e.id === selectedEffectId);
    if (effect) {
        const defaults: Record<string, number> = {};
        effect.parameters.forEach(p => defaults[p.id] = p.defaultValue);
        setParams(defaults);
        setEffect(selectedEffectId);
        setTimeout(() => updateParams(defaults), 10);
    } else {
        setEffect(null);
        setParams({});
    }
  }, [selectedEffectId, setEffect, updateParams]);

  // Update audio when params change slider
  const handleParamChange = (id: string, value: number) => {
      const newParams = { ...params, [id]: value };
      setParams(newParams);
      updateParams(newParams);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        togglePlay();
      } else if (e.key.toLowerCase() === 'b') {
        // Toggle Bypass (if we have an effect, turn it off. If off, do nothing or toggle back? 
        // Prompt says "Bypass effect", usually implies turning it OFF)
        if (selectedEffectId) {
            setSelectedEffectId(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, selectedEffectId]);

  const activeEffect = EFFECTS.find(e => e.id === selectedEffectId);

  // Filter effects by category for organized display
  const effectsByCategory = {
    [EffectCategory.Distortion]: EFFECTS.filter(e => e.category === EffectCategory.Distortion),
    [EffectCategory.Spatial]: EFFECTS.filter(e => e.category === EffectCategory.Spatial),
    [EffectCategory.Modulation]: EFFECTS.filter(e => e.category === EffectCategory.Modulation),
    [EffectCategory.EQ]: EFFECTS.filter(e => e.category === EffectCategory.EQ),
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 p-6 md:p-12 font-sans selection:bg-pedal-blue selection:text-white">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-8 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
            FX <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Master</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Interactive exploration of audio effects. Select a pedal to hear the Clean Guitar Arpeggio transform.
          </p>
          <p className="text-slate-500 text-sm mt-2 font-mono">
            [SPACE] Play/Stop &nbsp; [B] Bypass Effect
          </p>
        </div>
        
        {/* Playback Controls */}
        <div className="flex items-center gap-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <button
            onClick={togglePlay}
            className={`
              flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-lg group
              ${isPlaying 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-2 border-red-500/50' 
                : 'bg-green-500 text-slate-900 hover:bg-green-400 hover:scale-105 shadow-green-500/20'
              }
            `}
          >
            {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
          </button>
          
          <div className="flex flex-col gap-2 min-w-[140px]">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Activity size={12}/> STATUS</span>
              <span className={isPlaying ? 'text-green-400' : 'text-slate-500'}>
                {isPlaying ? 'LIVE' : 'IDLE'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                {isPlaying && (
                    <div className="h-full bg-green-500 animate-pulse w-full origin-left" />
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visualizer & Info */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6 self-start">
           
           {/* Visualizer Panel */}
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-grid-slate-800/[0.05] pointer-events-none" />
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="font-bold text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Signal Waveform
                </h2>
                <span className="text-xs font-mono text-slate-500">3D Time-Domain</span>
              </div>
              <Visualizer 
                analyser={analyser} 
                isPlaying={isPlaying} 
                color={activeEffect?.color || 'bg-slate-500'} 
              />
              
              <div className="mt-4 flex justify-between items-center text-xs font-mono text-slate-500 relative z-10">
                 <span>SRC: Clean Guitar</span>
                 <span>{activeEffect ? activeEffect.nameEn.toUpperCase() : 'DRY SIGNAL'}</span>
              </div>
           </div>

           {/* Active Effect Details & Controls */}
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl min-h-[250px] flex flex-col">
              {activeEffect ? (
                  <>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 self-start ${activeEffect.color.replace('bg-', 'bg-opacity-20 text-')}`}>
                        {activeEffect.category.toUpperCase()}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                        {activeEffect.nameEn}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium mb-4">
                        {activeEffect.nameCn}
                    </p>
                    <p className="text-slate-300 leading-relaxed border-t border-slate-800 pt-4 mb-2">
                        {activeEffect.description}
                    </p>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 opacity-80">
                        {activeEffect.descriptionCn}
                    </p>

                    {/* Generic Controls */}
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 mt-auto backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-4 text-blue-400 text-sm font-bold uppercase tracking-wider">
                            <Sliders className="w-4 h-4" /> Parameters
                        </div>
                        <div className="space-y-5">
                            {activeEffect.parameters.map((param) => (
                                <div key={param.id}>
                                    <div className="flex justify-between text-xs mb-2 text-slate-400 font-medium">
                                        <span>{param.name}</span>
                                        <span className="text-slate-300">{params[param.id]}{param.unit || ''}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={param.min} 
                                        max={param.max} 
                                        step={param.step}
                                        value={params[param.id] || param.defaultValue}
                                        onChange={(e) => handleParamChange(param.id, Number(e.target.value))}
                                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-${activeEffect.color.replace('bg-', '')}`}
                                        style={{ accentColor: 'currentColor' }} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                  </>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-8">
                      <Info className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No Effect Selected</p>
                      <p className="text-sm">Tap a pedal on the right to engage</p>
                  </div>
              )}
           </div>
        </div>

        {/* Right Column: Effects Grid */}
        <div className="lg:col-span-7 flex flex-col gap-8">
            {Object.entries(effectsByCategory).map(([category, effects]) => (
                <section key={category}>
                    <div className={`flex items-center gap-3 mb-4 border-b pb-2 ${CATEGORY_COLORS[category as EffectCategory]}`}>
                        <h3 className="text-xl font-bold tracking-tight">
                            {CATEGORY_CN[category as EffectCategory]}
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {effects.map((effect) => (
                            <EffectCard
                                key={effect.id}
                                effect={effect}
                                isActive={selectedEffectId === effect.id}
                                onClick={() => setSelectedEffectId(selectedEffectId === effect.id ? null : effect.id)}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>

      </main>
    </div>
  );
}