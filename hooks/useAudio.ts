import { useRef, useEffect, useState, useCallback } from 'react';

// --- Helpers ---
const createDistortionCurve = (amount: number) => {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
};

const createImpulseResponse = (ctx: AudioContext, duration: number, decay: number) => {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i; // simple noise
    // Exponential decay
    const val = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    left[i] = val;
    right[i] = val;
  }
  return impulse;
};

export const useAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const noteIndexRef = useRef<number>(0);
  
  // Effect Nodes Refs
  const currentEffectNodesRef = useRef<AudioNode[]>([]);
  const activeParamsRef = useRef<Record<string, AudioParam | AudioNode>>({}); // Store AudioParams or Nodes to control
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);
  
  // Current effect ID
  const activeEffectIdRef = useRef<string | null>(null);

  // Cmaj7 Arpeggio Notes (C3, E3, G3, B3)
  const ARPEGGIO_FREQS = [130.81, 164.81, 196.00, 246.94]; 
  const TEMPO = 60; // BPM
  const LOOKAHEAD = 25.0; // ms
  const SCHEDULE_AHEAD_TIME = 0.1; // s

  // Initialize Audio Context
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.4; // Master volume
    masterGain.connect(ctx.destination);
    gainRef.current = masterGain;

    // Dry/Wet Routing
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    
    // Connect to Analyser then to Master
    dry.connect(analyser);
    wet.connect(analyser);
    analyser.connect(masterGain);

    dryGainRef.current = dry;
    wetGainRef.current = wet;

    return () => {
      ctx.close();
    };
  }, []);

  // We need a persistent input node for the synth to connect to
  const effectInputRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if(!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const input = ctx.createGain();
    effectInputRef.current = input;
    
    // Default: Direct to analyser (Dry only)
    if (dryGainRef.current) input.connect(dryGainRef.current);
  }, []);


  const updateEffectChain = useCallback((effectId: string | null) => {
    if (!audioCtxRef.current || !effectInputRef.current || !dryGainRef.current || !wetGainRef.current) return;
    
    const ctx = audioCtxRef.current;
    const input = effectInputRef.current;
    const dry = dryGainRef.current;
    const wet = wetGainRef.current;

    // 1. Clean up old chain
    input.disconnect(); // Disconnect from everything
    currentEffectNodesRef.current.forEach(n => {
        try { n.disconnect(); } catch(e) {}
    });
    currentEffectNodesRef.current = [];
    activeParamsRef.current = {};

    // 2. Default Routing (No Effect)
    if (!effectId) {
       input.connect(dry);
       dry.gain.value = 1.0;
       wet.gain.value = 0.0;
       activeEffectIdRef.current = null;
       return;
    }

    activeEffectIdRef.current = effectId;

    let nodes: AudioNode[] = [];
    let params: Record<string, AudioParam | AudioNode> = {};

    try {
      switch (effectId) {
        case 'overdrive': {
          dry.gain.value = 0.0; 
          wet.gain.value = 0.5; 
          
          const preGain = ctx.createGain(); // Drive control
          preGain.gain.value = 5.0; // Default drive

          const shaper = ctx.createWaveShaper();
          shaper.curve = createDistortionCurve(20); 
          shaper.oversample = '4x';
          
          const tone = ctx.createBiquadFilter();
          tone.type = 'lowpass';
          tone.frequency.value = 3000;

          input.connect(preGain);
          preGain.connect(shaper);
          shaper.connect(tone);
          tone.connect(wet);
          
          nodes.push(preGain, shaper, tone);
          params = {
            'drive': preGain.gain,
            'tone': tone.frequency
          };
          break;
        }
        case 'distortion': {
          dry.gain.value = 0.0;
          wet.gain.value = 0.4;
          
          const preGain = ctx.createGain();
          preGain.gain.value = 50.0; 

          const shaper = ctx.createWaveShaper();
          shaper.curve = createDistortionCurve(400); 
          shaper.oversample = '4x';

          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 2500; 

          input.connect(preGain);
          preGain.connect(shaper);
          shaper.connect(lowpass);
          lowpass.connect(wet);
          
          nodes.push(preGain, shaper, lowpass);
          params = {
              'gain': preGain.gain,
              'filter': lowpass.frequency
          };
          break;
        }
        case 'fuzz': {
            dry.gain.value = 0.0;
            wet.gain.value = 0.2;

            const shaper = ctx.createWaveShaper();
            const curve = new Float32Array(44100);
            for(let i=0; i<44100; i++) {
                const x = (i * 2) / 44100 - 1;
                curve[i] = x > 0 ? 1 : -1;
            }
            shaper.curve = curve;
            
            const drive = ctx.createGain();
            drive.gain.value = 5.0; 

            input.connect(drive);
            drive.connect(shaper);
            shaper.connect(wet);

            nodes.push(drive, shaper);
            params = {
                'fuzz': drive.gain,
                'level': wet.gain // Fuzz level controls wet output
            };
            break;
        }
        case 'reverb': {
            dry.gain.value = 0.6;
            wet.gain.value = 0.6;

            const convolver = ctx.createConvolver();
            convolver.buffer = createImpulseResponse(ctx, 2.0, 2.0); 

            input.connect(dry);
            input.connect(convolver);
            convolver.connect(wet);
            
            nodes.push(convolver);
            params = {
                'mix': wet.gain,
                'decay': convolver // Special case handling in updateParams for buffer regen
            };
            break;
        }
        case 'delay': {
            dry.gain.value = 0.7;
            wet.gain.value = 0.6;

            const delay = ctx.createDelay(5.0);
            delay.delayTime.value = 0.25; 

            const feedback = ctx.createGain();
            feedback.gain.value = 0.4;

            input.connect(dry);
            input.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wet);
            
            nodes.push(delay, feedback);
            params = {
                'time': delay.delayTime,
                'feedback': feedback.gain
            };
            break;
        }
        case 'flanger': {
            dry.gain.value = 0.5;
            wet.gain.value = 0.5;

            const delay = ctx.createDelay();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            const feedback = ctx.createGain();

            delay.delayTime.value = 0.005; 
            lfo.type = 'sine';
            lfo.frequency.value = 0.5; 
            lfoGain.gain.value = 0.003; 
            feedback.gain.value = 0.6;

            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);
            
            input.connect(dry);
            input.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wet);

            lfo.start();
            nodes.push(delay, lfo, lfoGain, feedback);
            params = {
                'speed': lfo.frequency,
                'depth': lfoGain.gain
            };
            break;
        }
        case 'phaser': {
             dry.gain.value = 0.5;
             wet.gain.value = 0.5;
             
             const lfo = ctx.createOscillator();
             lfo.frequency.value = 1.0;
             const lfoGain = ctx.createGain();
             lfoGain.gain.value = 400; 
             const feedback = ctx.createGain();
             feedback.gain.value = 5.0; // Used as resonance factor

             const filters: BiquadFilterNode[] = [];
             for(let i=0; i<4; i++) {
                 const f = ctx.createBiquadFilter();
                 f.type = 'allpass';
                 f.frequency.value = 800;
                 filters.push(f);
                 lfo.connect(lfoGain);
                 lfoGain.connect(f.frequency);
             }

             lfo.start();

             input.connect(dry);
             input.connect(filters[0]);
             filters[0].connect(filters[1]);
             filters[1].connect(filters[2]);
             filters[2].connect(filters[3]);
             filters[3].connect(wet);

             nodes.push(lfo, lfoGain, ...filters);
             params = {
                 'speed': lfo.frequency,
                 'feedback': lfoGain.gain 
             };
             break;
        }
        case 'chorus': {
            dry.gain.value = 0.7;
            wet.gain.value = 0.7;
            
            const delay = ctx.createDelay();
            delay.delayTime.value = 0.03; 
            
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 1.5;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.002;

            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);
            lfo.start();

            input.connect(dry);
            input.connect(delay);
            delay.connect(wet);
            
            nodes.push(delay, lfo, lfoGain);
            params = {
                'speed': lfo.frequency,
                'depth': lfoGain.gain
            };
            break;
        }
        case 'tremolo': {
            dry.gain.value = 0;
            wet.gain.value = 1.0;
            
            const tremoloGain = ctx.createGain();
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 5;
            
            tremoloGain.gain.value = 0.5; 
            const lfoAmp = ctx.createGain();
            lfoAmp.gain.value = 0.5; 
            
            lfo.connect(lfoAmp);
            lfoAmp.connect(tremoloGain.gain);
            lfo.start();

            input.connect(tremoloGain);
            tremoloGain.connect(wet);
            
            nodes.push(tremoloGain, lfo, lfoAmp);
            params = {
                'speed': lfo.frequency,
                'depth': lfoAmp.gain
            };
            break;
        }
        case 'vibrato': {
            dry.gain.value = 0.0;
            wet.gain.value = 1.0;
            
            const delay = ctx.createDelay();
            delay.delayTime.value = 0.01; 
            
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 5.0; 
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.003; 

            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);
            lfo.start();

            input.connect(delay);
            delay.connect(wet);
            
            nodes.push(delay, lfo, lfoGain);
            params = {
                'speed': lfo.frequency,
                'depth': lfoGain.gain
            };
            break;
        }
        case 'eq': {
            dry.gain.value = 0;
            wet.gain.value = 1;
            
            const low = ctx.createBiquadFilter();
            low.type = 'lowshelf';
            low.frequency.value = 250;
            low.gain.value = 0;

            const mid = ctx.createBiquadFilter();
            mid.type = 'peaking';
            mid.frequency.value = 1000;
            mid.Q.value = 1;
            mid.gain.value = 0;

            const high = ctx.createBiquadFilter();
            high.type = 'highshelf';
            high.frequency.value = 4000;
            high.gain.value = 0;
            
            input.connect(low);
            low.connect(mid);
            mid.connect(high);
            high.connect(wet);
            
            nodes.push(low, mid, high);
            params = {
                'low': low.gain,
                'mid': mid.gain,
                'high': high.gain
            };
            break;
        }
        case 'autowah': {
             dry.gain.value = 0.4;
             wet.gain.value = 0.6;
             
             const filter = ctx.createBiquadFilter();
             filter.type = 'lowpass';
             filter.Q.value = 6; 
             
             const lfo = ctx.createOscillator();
             lfo.frequency.value = 2; // Fixed speed for demo simplicity or map to param if desired
             const lfoDepth = ctx.createGain();
             lfoDepth.gain.value = 2000; 
             
             filter.frequency.value = 500; 
             
             lfo.connect(lfoDepth);
             lfoDepth.connect(filter.frequency);
             lfo.start();
             
             input.connect(filter);
             filter.connect(wet);
             
             nodes.push(filter, lfo, lfoDepth);
             params = {
                 'frequency': filter.frequency,
                 'sensitivity': lfoDepth.gain
             };
             break;
        }
        default:
          input.connect(dry);
      }
      currentEffectNodesRef.current = nodes;
      activeParamsRef.current = params;
    } catch(e) {
      console.error("Effect Error", e);
      input.connect(dry);
    }

  }, []);

  // Generic Parameter Update
  const updateParams = useCallback((newParams: Record<string, number>) => {
      const paramTargets = activeParamsRef.current;
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;

      Object.entries(newParams).forEach(([key, value]) => {
          const target = paramTargets[key];
          if (!target) return;

          // Special case for Reverb decay (requires buffer regen)
          if (activeEffectIdRef.current === 'reverb' && key === 'decay' && target instanceof AudioNode) {
             (target as ConvolverNode).buffer = createImpulseResponse(ctx, value, value);
          } 
          // Standard AudioParam
          else if (target instanceof AudioParam) {
              target.setTargetAtTime(value, now, 0.05);
          }
      });
  }, []);

  // --- Scheduler ---
  const playNote = (time: number, freq: number) => {
    if (!audioCtxRef.current || !effectInputRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Clean Guitar Synthesis
    // 1. Oscillator: Triangle (Body) + Sawtooth (Brightness)
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle'; 
    osc1.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq;
    // Slight detune for richness
    osc2.detune.value = 5;

    // 2. Filter: Pluck simulation
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(3000, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.3); // Pluck decay

    // 3. Amplitude Envelope
    const gainNode = ctx.createGain();
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.2; // Blend saw lower

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.8, time + 0.01); // Fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.6); // Long release for ring

    // Routing
    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    
    filter.connect(gainNode);
    gainNode.connect(effectInputRef.current);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.8);
    osc2.stop(time + 0.8);
  };

  const schedule = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
       // Rhythm Pattern: 16th notes
       // 4 notes (1 beat), then 1 beat rest.
       const stepInCycle = noteIndexRef.current % 5; 
       
       if (stepInCycle < 4) {
           const freq = ARPEGGIO_FREQS[stepInCycle];
           playNote(nextNoteTimeRef.current, freq);
           nextNoteTimeRef.current += 0.25; // 16th note at 60bpm = 0.25s
       } else {
           nextNoteTimeRef.current += 1.0; // Rest
       }

       noteIndexRef.current++;
       if (noteIndexRef.current >= 5) noteIndexRef.current = 0;
    }
    
    if (isPlaying) {
        schedulerRef.current = window.setTimeout(schedule, LOOKAHEAD);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      noteIndexRef.current = 0;
      nextNoteTimeRef.current = audioCtxRef.current!.currentTime + 0.1;
      schedule();
    } else {
      if (schedulerRef.current) window.clearTimeout(schedulerRef.current);
    }
    return () => {
        if (schedulerRef.current) window.clearTimeout(schedulerRef.current);
    };
  }, [isPlaying, schedule]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return {
    togglePlay,
    isPlaying,
    analyser: analyserRef.current,
    setEffect: updateEffectChain,
    updateParams
  };
};