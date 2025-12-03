export enum EffectCategory {
  Distortion = 'Distortion',
  Spatial = 'Spatial',
  Modulation = 'Modulation',
  EQ = 'EQ'
}

export interface EffectParameter {
  id: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
  step: number;
  unit?: string;
}

export interface EffectDef {
  id: string;
  nameEn: string;
  nameCn: string;
  category: EffectCategory;
  description: string;
  descriptionCn: string;
  color: string;
  parameters: EffectParameter[];
}

export type AudioStatus = 'idle' | 'playing' | 'suspended';

export const CATEGORY_CN: Record<EffectCategory, string> = {
  [EffectCategory.Distortion]: 'Distortion (失真类)',
  [EffectCategory.Spatial]: 'Spatial (空间类)',
  [EffectCategory.Modulation]: 'Modulation (调制类)',
  [EffectCategory.EQ]: 'EQ (均衡类)',
};