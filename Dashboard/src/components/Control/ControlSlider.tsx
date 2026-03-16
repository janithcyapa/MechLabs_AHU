const PanelSlider = ({ label, value, onChange, icon: Icon, colorClass = "text-cyan-400", isBinary = false }: any) => {
  // Determine display text based on binary mode
  const displayValue = isBinary 
    ? (value >= 50 ? 'ON' : 'OFF') 
    : `${value}%`;

  // Dynamic styling for the ON/OFF state text
  const valueStyle = isBinary && value < 50 
    ? "text-slate-500" // Dimmed when OFF
    : colorClass;      // Glowing when ON or Continuous

  return (
    <div className="flex flex-col gap-3 bg-[#111827] p-4 rounded-xl border border-slate-700/50 shadow-inner">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold tracking-widest uppercase">
          <Icon className={colorClass} /> {label}
        </div>
        <span className={`font-mono font-bold text-sm drop-shadow-[0_0_5px_currentColor] ${valueStyle}`}>
          {displayValue}
        </span>
      </div>
      
      <div className="relative flex items-center h-4">
        {/* Dynamic Track Color for Binary mode */}
        {isBinary && (
          <div 
            className={`absolute left-0 top-0 h-full rounded-full pointer-events-none transition-all duration-300 ${
              value >= 50 ? 'w-full bg-cyan-900/50' : 'w-0 bg-transparent'
            }`}
          />
        )}
        
        <input
          type="range"
          min="0"
          max="100"
          step={isBinary ? 100 : 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`
            w-full h-4 bg-slate-800 rounded-full appearance-none cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]
            /* Custom Round Thumb styling for Chrome/Safari */
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
            [&::-webkit-slider-thumb]:bg-slate-200 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-800 [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-125
            /* Custom Round Thumb styling for Firefox */
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-slate-200 
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-800
          `}
        />
      </div>
    </div>
  );
};

export default PanelSlider;