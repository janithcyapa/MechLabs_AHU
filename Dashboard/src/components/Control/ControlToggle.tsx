import { useState } from 'react';
import { FaSlidersH, FaRobot, FaPython } from 'react-icons/fa';

export default function ModeSelector() {
  const [mode, setMode] = useState<'manual' | 'auto' | 'custom'>('manual');
  return (
    <div 
      className="relative flex items-center h-16 px-1.5 min-w-72 rounded-xl shadow-lg overflow-hidden shrink-0 border border-slate-700/50"
      style={{
        backgroundImage: `linear-gradient(to right, #1e293b, #111827)`,
        backgroundSize: 'cover',
      }}
    >
      {/* Background overlay and blur to match the Ambient Widget */}
      <div className="absolute inset-0 bg-[#111827]/80 backdrop-blur-[2px] pointer-events-none"></div>

      <div className="relative z-10 flex w-full gap-1">
        {/* MANUAL BUTTON */}
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-12 rounded-lg transition-all duration-300 group
            ${mode === 'manual' 
              ? 'bg-cyan-500/10 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
              : 'hover:bg-slate-800/50 border border-transparent'
            }`}
        >
          <FaSlidersH className={`text-sm ${mode === 'manual' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
          <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${mode === 'manual' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
            Manual
          </span>
        </button>

        {/* AUTO BUTTON */}
        <button
          onClick={() => setMode('auto')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-12 rounded-lg transition-all duration-300 group
            ${mode === 'auto' 
              ? 'bg-emerald-500/10 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
              : 'hover:bg-slate-800/50 border border-transparent'
            }`}
        >
          <FaRobot className={`text-sm ${mode === 'auto' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
          <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${mode === 'auto' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
            Auto
          </span>
        </button>

        {/* CUSTOM BUTTON */}
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-12 rounded-lg transition-all duration-300 group
            ${mode === 'custom' 
              ? 'bg-purple-500/10 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
              : 'hover:bg-slate-800/50 border border-transparent'
            }`}
        >
          <FaPython className={`text-sm ${mode === 'custom' ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
          <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${mode === 'custom' ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
            Custom
          </span>
        </button>
      </div>
    </div>
  );
}