export const ControlKnob = ({ label, value, onChange, icon: Icon, colorClass = "text-cyan-400", isBinary = false }: any) => {
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


export const ToggleSwitch = ({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  colorClass = "text-cyan-400" 
}: any) => {
  
  // Treat any value greater than 0 as ON (handles both 1 and 100 based on your backend)
  const isOn = value > 0;

  // Dynamic styling for the ON/OFF state text
  const valueStyle = isOn ? colorClass : "text-slate-500";

  const handleToggle = () => {
    // If it's ON, send 0. If it's OFF, send 1.
    onChange(isOn ? 0 : 1);
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 bg-[#111827] p-4 rounded-xl border border-slate-700/50 shadow-inner min-w-30 h-full">
      
      {/* Label & Icon */}
      <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-widest uppercase text-center h-8">
        <Icon className={`text-sm ${colorClass}`} /> {label}
      </div>

      {/* The Toggle Switch Container */}
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        
        {/* Invisible button for flawless click interaction */}
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          onClick={handleToggle}
          className="absolute inset-0 w-full h-full z-10 cursor-pointer outline-none rounded-full"
          title={isOn ? "Turn OFF" : "Turn ON"}
        />

        {/* The Track */}
        <div className={`w-14 h-7 rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_2px_4px_rgba(255,255,255,0.05)] border transition-colors duration-300 flex items-center px-1 ${
          isOn ? 'border-slate-600 bg-slate-800' : 'border-slate-800 bg-[#0f172a]'
        }`}>
          
          {/* The Sliding Thumb */}
          {/* We apply the colorClass here so the inner dot can inherit it via 'currentColor' */}
          <div 
            className={`w-5 h-5 rounded-full bg-slate-700 shadow-[0_2px_6px_rgba(0,0,0,0.6),inset_0_2px_2px_rgba(255,255,255,0.2)] border border-slate-600 flex items-center justify-center transition-transform duration-300 ease-out ${
              isOn ? `translate-x-7 ${colorClass}` : 'translate-x-0 text-slate-500'
            }`}
          >
            {/* The Glowing Indicator Mark */}
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isOn ? 'bg-current shadow-[0_0_6px_currentColor]' : 'bg-slate-500'
            }`}></div>
          </div>
        </div>
      </div>

      {/* Value Display */}
      <span className={`font-mono font-bold text-sm drop-shadow-[0_0_5px_currentColor] transition-colors duration-300 ${valueStyle}`}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
};