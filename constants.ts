import { EffectCategory, EffectDef } from './types';

export const EFFECTS: EffectDef[] = [
  // Distortion Type
  {
    id: 'overdrive',
    nameEn: 'Overdrive',
    nameCn: '过载',
    category: EffectCategory.Distortion,
    description: 'Simulates the warm sound of a tube amplifier beginning to distort. Maintains dynamics.',
    descriptionCn: '模拟电子管放大器开始失真时的温暖声音，保留了演奏的动态。',
    color: 'bg-yellow-600',
    parameters: [
      { id: 'drive', name: 'Drive', min: 0, max: 100, defaultValue: 50, step: 1 },
      { id: 'tone', name: 'Tone', min: 1000, max: 8000, defaultValue: 3000, step: 100, unit: 'Hz' }
    ]
  },
  {
    id: 'distortion',
    nameEn: 'Distortion',
    nameCn: '失真',
    category: EffectCategory.Distortion,
    description: 'Hard clipping of the signal. Creates a gritty, aggressive sound with more sustain.',
    descriptionCn: '对信号进行硬削波。产生粗糙、激进的声音，并增加延音。',
    color: 'bg-orange-600',
    parameters: [
      { id: 'gain', name: 'Gain', min: 0, max: 100, defaultValue: 75, step: 1 },
      { id: 'filter', name: 'Filter', min: 500, max: 5000, defaultValue: 2500, step: 100, unit: 'Hz' }
    ]
  },
  {
    id: 'fuzz',
    nameEn: 'Fuzz',
    nameCn: '法兹',
    category: EffectCategory.Distortion,
    description: 'Extreme distortion that squares off the wave completely. Thick, synthetic buzz.',
    descriptionCn: '极端的失真效果，将波形完全削成方形。产生厚重、合成器般的嗡鸣声。',
    color: 'bg-red-700',
    parameters: [
      { id: 'fuzz', name: 'Fuzz', min: 1, max: 10, defaultValue: 5, step: 0.5 },
      { id: 'level', name: 'Level', min: 0, max: 1, defaultValue: 0.2, step: 0.01 }
    ]
  },

  // Spatial Type
  {
    id: 'reverb',
    nameEn: 'Reverb',
    nameCn: '混响',
    category: EffectCategory.Spatial,
    description: 'Simulates the reflection of sound in a physical space, like a hall or room.',
    descriptionCn: '模拟声音在物理空间（如大厅或房间）中的反射效果。',
    color: 'bg-blue-600',
    parameters: [
      { id: 'mix', name: 'Mix', min: 0, max: 1, defaultValue: 0.5, step: 0.05 },
      { id: 'decay', name: 'Size', min: 0.5, max: 5, defaultValue: 2.0, step: 0.1, unit: 's' }
    ]
  },
  {
    id: 'delay',
    nameEn: 'Delay',
    nameCn: '延迟',
    category: EffectCategory.Spatial,
    description: 'Repeats the input sound after a short period of time, creating echoes.',
    descriptionCn: '在短时间后重复输入的声音，产生回声效果。',
    color: 'bg-indigo-600',
    parameters: [
      { id: 'time', name: 'Time', min: 0, max: 1, defaultValue: 0.25, step: 0.01, unit: 's' },
      { id: 'feedback', name: 'Feedback', min: 0, max: 0.9, defaultValue: 0.4, step: 0.05 }
    ]
  },

  // Modulation Type
  {
    id: 'flanger',
    nameEn: 'Flanger',
    nameCn: '镶边',
    category: EffectCategory.Modulation,
    description: 'Mixes two identical signals with one slightly delayed and modulated. Jet-plane "swoosh".',
    descriptionCn: '混合两个相同的信号，其中一个略微延迟并被调制。产生类似喷气式飞机的呼啸声。',
    color: 'bg-purple-600',
    parameters: [
      { id: 'speed', name: 'Rate', min: 0.1, max: 5, defaultValue: 0.5, step: 0.1, unit: 'Hz' },
      { id: 'depth', name: 'Depth', min: 0.001, max: 0.01, defaultValue: 0.003, step: 0.001 }
    ]
  },
  {
    id: 'phaser',
    nameEn: 'Phaser',
    nameCn: '移相',
    category: EffectCategory.Modulation,
    description: 'Creates a sweeping effect by shifting the phase of different frequencies.',
    descriptionCn: '通过移动不同频率的相位来产生扫频效果。',
    color: 'bg-pink-600',
    parameters: [
      { id: 'speed', name: 'Rate', min: 0.1, max: 10, defaultValue: 1, step: 0.1, unit: 'Hz' },
      { id: 'feedback', name: 'Resonance', min: 0, max: 20, defaultValue: 5, step: 1 }
    ]
  },
  {
    id: 'chorus',
    nameEn: 'Chorus',
    nameCn: '合唱',
    category: EffectCategory.Modulation,
    description: 'Makes a single instrument sound like multiple instruments playing together. Rich and shimmering.',
    descriptionCn: '让单一乐器听起来像多个乐器同时演奏。声音丰富且闪烁。',
    color: 'bg-cyan-600',
    parameters: [
      { id: 'speed', name: 'Rate', min: 0.5, max: 8, defaultValue: 1.5, step: 0.1, unit: 'Hz' },
      { id: 'depth', name: 'Depth', min: 0.0005, max: 0.005, defaultValue: 0.002, step: 0.0001 }
    ]
  },
  {
    id: 'tremolo',
    nameEn: 'Tremolo',
    nameCn: '音量颤音',
    category: EffectCategory.Modulation,
    description: 'Rhythmic modulation of the volume (amplitude).',
    descriptionCn: '对音量（振幅）进行有节奏的调制。',
    color: 'bg-green-600',
    parameters: [
      { id: 'speed', name: 'Rate', min: 1, max: 15, defaultValue: 5, step: 0.5, unit: 'Hz' },
      { id: 'depth', name: 'Depth', min: 0, max: 1, defaultValue: 0.7, step: 0.05 }
    ]
  },
  {
    id: 'vibrato',
    nameEn: 'Vibrato',
    nameCn: '音高颤音',
    category: EffectCategory.Modulation,
    description: 'Rhythmic modulation of the pitch (frequency).',
    descriptionCn: '对音高（频率）进行有节奏的调制。',
    color: 'bg-teal-600',
    parameters: [
      { id: 'speed', name: 'Rate', min: 1, max: 15, defaultValue: 5, step: 0.5, unit: 'Hz' },
      { id: 'depth', name: 'Depth', min: 0.001, max: 0.01, defaultValue: 0.003, step: 0.0001 }
    ]
  },

  // EQ Type
  {
    id: 'eq',
    nameEn: 'Equalizer',
    nameCn: '均衡器',
    category: EffectCategory.EQ,
    description: 'Adjusts the balance of frequency components. Boost or cut specific bands.',
    descriptionCn: '调整频率成分的平衡。提升或削减特定频段。',
    color: 'bg-emerald-600',
    parameters: [
      { id: 'low', name: 'Low (250Hz)', min: -15, max: 15, defaultValue: 0, step: 1, unit: 'dB' },
      { id: 'mid', name: 'Mid (1kHz)', min: -15, max: 15, defaultValue: 0, step: 1, unit: 'dB' },
      { id: 'high', name: 'High (4kHz)', min: -15, max: 15, defaultValue: 0, step: 1, unit: 'dB' }
    ]
  },
  {
    id: 'autowah',
    nameEn: 'Auto Wah',
    nameCn: '自动哇音',
    category: EffectCategory.EQ,
    description: 'A filter that sweeps frequencies automatically based on signal input/envelope.',
    descriptionCn: '一种根据信号输入/包络自动扫频的滤波器。',
    color: 'bg-lime-600',
    parameters: [
      { id: 'frequency', name: 'Center Freq', min: 200, max: 2000, defaultValue: 500, step: 50, unit: 'Hz' },
      { id: 'sensitivity', name: 'Sensitivity', min: 500, max: 4000, defaultValue: 2000, step: 100 }
    ]
  }
];

export const CATEGORY_COLORS: Record<EffectCategory, string> = {
  [EffectCategory.Distortion]: 'text-orange-400 border-orange-400/30',
  [EffectCategory.Spatial]: 'text-blue-400 border-blue-400/30',
  [EffectCategory.Modulation]: 'text-purple-400 border-purple-400/30',
  [EffectCategory.EQ]: 'text-emerald-400 border-emerald-400/30',
};