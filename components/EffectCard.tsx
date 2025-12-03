import React from 'react';
import { EffectDef } from '../types';

interface EffectCardProps {
  effect: EffectDef;
  isActive: boolean;
  onClick: () => void;
}

const EffectCard: React.FC<EffectCardProps> = ({ effect, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden group p-4 rounded-xl border transition-all duration-300 text-left w-full h-full
        ${isActive 
          ? `bg-slate-800 border-${effect.color.replace('bg-', '')} shadow-[0_0_20px_rgba(0,0,0,0.3)] scale-[1.02]` 
          : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
        }
      `}
    >
      {/* Active Glow Indicator */}
      {isActive && (
        <div className={`absolute inset-0 opacity-10 ${effect.color} blur-xl transition-opacity duration-500`} />
      )}
      
      {/* Status LED */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className={`w-3 h-3 rounded-full shadow-md transition-colors duration-300 ${isActive ? 'bg-red-500 shadow-red-500/50' : 'bg-slate-700'}`} />
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
           {effect.category.toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className={`font-bold text-lg leading-tight mb-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>
          {effect.nameEn} <span className="text-base font-normal opacity-70">({effect.nameCn})</span>
        </h3>
        <p className={`text-xs leading-relaxed mb-2 mt-2 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
          {effect.description}
        </p>
        <p className={`text-xs leading-relaxed opacity-80 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
          {effect.descriptionCn}
        </p>
      </div>

      {/* Decorative Bottom Stripe */}
      <div className={`absolute bottom-0 left-0 w-full h-1 transform transition-transform duration-300 ${isActive ? effect.color : 'bg-transparent'}`} />
    </button>
  );
};

export default EffectCard;