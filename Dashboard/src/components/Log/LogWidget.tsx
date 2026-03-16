import { FaPlay, FaStop, FaTrashAlt, FaFileDownload, FaClock, FaDatabase } from 'react-icons/fa';

interface DataRecordControllerProps {
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;
  timeStep: number;
  setTimeStep: (val: number) => void;
  dataCount: number;
  onReset: () => void;
  onSave: () => void;
}

export default function DataRecordController({
  isRecording,
  setIsRecording,
  timeStep,
  setTimeStep,
  dataCount,
  onReset,
  onSave
}: DataRecordControllerProps) {
  return (
    <div 
      className="relative flex items-center h-16 px-2 min-w-105 rounded-xl shadow-lg overflow-hidden shrink-0 border border-slate-700/50"
      style={{
        backgroundImage: `linear-gradient(to right, #1e293b, #111827)`,
        backgroundSize: 'cover',
      }}
    >
      {/* Background overlay/blur for consistency */}
      <div className="absolute inset-0 bg-[#111827]/80 backdrop-blur-[2px] pointer-events-none"></div>

      <div className="relative z-10 flex w-full items-center gap-2">
        
        {/* LEFT SECTION: Record / Stop Toggle */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`flex flex-col items-center justify-center w-24 h-12 rounded-lg transition-all duration-300 group border
            ${isRecording 
              ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
              : 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            }`}
        >
          {isRecording ? (
            <>
              <FaStop className="text-sm text-red-500 animate-pulse" />
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-red-500">Stop</span>
            </>
          ) : (
            <>
              <FaPlay className="text-sm text-emerald-400" />
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-emerald-400">Record</span>
            </>
          )}
        </button>

        {/* MIDDLE SECTION: Dynamic Time Step OR Point Counter */}
        <div className="flex-1 flex flex-col items-center justify-center h-12 bg-slate-900/40 rounded-lg border border-slate-700/30 px-3 overflow-hidden relative">
          {!isRecording ? (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <FaClock className="text-[10px]" /> Step (sec)
              </span>
              <input 
                type="number" 
                value={timeStep}
                onChange={(e) => setTimeStep(Math.max(1, Number(e.target.value)))}
                className="no-spinner bg-transparent text-cyan-400 font-mono font-bold text-sm w-full text-center outline-none"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-[8px] text-cyan-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <FaDatabase className="text-[10px]" /> Data Points
              </span>
              <span className="text-white font-mono font-bold text-sm">
                {dataCount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT SECTION: Action Buttons (Reset & Save) */}
        <div className="flex gap-1">
          {/* RESET BUTTON */}
          <button
            onClick={onReset}
            disabled={isRecording}
            className="w-11 h-12 flex flex-col items-center justify-center rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 text-slate-500 hover:text-red-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
          >
            <FaTrashAlt className="text-sm mb-0.5" />
            <span className="text-[7px] font-bold uppercase tracking-wider">Reset</span>
          </button>

          {/* SAVE/CSV BUTTON */}
          <button
            onClick={onSave}
            disabled={isRecording || dataCount === 0}
            className="w-11 h-12 flex flex-col items-center justify-center rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 text-slate-500 hover:text-emerald-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <FaFileDownload className="text-sm mb-0.5" />
            <span className="text-[7px] font-bold uppercase tracking-wider">Save</span>
          </button>
        </div>

      </div>
    </div>
  );
}