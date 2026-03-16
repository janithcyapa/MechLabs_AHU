
const ControlKnob = ({ label, value, onChange, icon: Icon, colorClass = "text-cyan-400", isBinary = false }: any) => {
  // Determine display text based on binary mode
  const displayValue = isBinary 
    ? (value >= 50 ? 'ON' : 'OFF') 
    : `${value}%`;

  // Dynamic styling for the ON/OFF state text
  const valueStyle = isBinary && value < 50 
    ? "text-slate-500" // Dimmed when OFF
    : colorClass;      // Glowing when ON or Continuous

  // Calculate rotation angle. 
  // Standard knobs go from -135 degrees (0%) to +135 degrees (100%), a 270-degree sweep.
  const rotation = (value / 100) * 270 - 135;

  return (
    <div className="flex flex-col items-center justify-between gap-3 bg-[#111827] p-4 rounded-xl border border-slate-700/50 shadow-inner min-w-30 h-full">
      
      {/* Label & Icon */}
      <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-widest uppercase text-center h-8">
        <Icon className={`text-sm ${colorClass}`} /> {label}
      </div>

      {/* The Rotary Knob Container */}
      <div className="relative w-16 h-16 rounded-full bg-[#0f172a] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_2px_4px_rgba(255,255,255,0.05)] border border-slate-800 flex items-center justify-center shrink-0">

        {/* The physically rotating knob */}
        <div 
          className={`absolute w-12 h-12 rounded-full bg-slate-700 shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_0_2px_3px_rgba(255,255,255,0.2)] border border-slate-600 ${isBinary ? 'transition-transform duration-300' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* The Glowing Indicator Mark */}
          {/* We use 'text-...' colorClass on the wrapper, and 'bg-current' so the div inherits that exact color */}
          <div className={`mx-auto mt-1 w-1.5 h-3 rounded-full ${value > 0 ? colorClass : 'text-slate-500'}`}>
             <div className="w-full h-full bg-current rounded-full shadow-[0_0_6px_currentColor]"></div>
          </div>
        </div>

        {/* Invisible native range slider for flawless drag/touch interaction */}
        <input
          type="range"
          min="0"
          max="100"
          step={isBinary ? 100 : 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 z-10"
          title={displayValue}
        />
      </div>

      {/* Value Display */}
      <span className={`font-mono font-bold text-sm drop-shadow-[0_0_5px_currentColor] ${valueStyle}`}>
        {displayValue}
      </span>
    </div>
  );
};

export default ControlKnob;