import { BiTargetLock } from 'react-icons/bi';
import { FaThermometerHalf } from 'react-icons/fa';
import { MdOutlineCo2 } from 'react-icons/md';
import { WiHumidity } from 'react-icons/wi';

const SetpointInput = ({
  label,
  tempVal,
  humVal,
  co2Val,
  onTempChange,
  onHumChange,
  onCo2Change
}: any) => (
  <div className="flex flex-col gap-4 bg-[#111827] p-5 rounded-2xl border border-slate-700/50 shadow-xl w-full min-w-48 max-w-64">

    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
      <BiTargetLock className="text-emerald-500 text-xl drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
      <span className="text-slate-200 text-xs font-bold tracking-[0.15em] uppercase truncate">
        {label}
      </span>
    </div>

    <div className="flex flex-col gap-3">

      {/* Temperature Input */}
      <div className="flex flex-col gap-1.5 group">
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Target Temp</label>
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 group-focus-within:border-emerald-500/50 transition-all hover:bg-slate-800/50">
          <FaThermometerHalf className="text-emerald-500 text-sm" />
          <input
            type="number"
            value={tempVal}
            onChange={e => onTempChange(Number(e.target.value))}
            className="no-spinner bg-transparent text-white font-mono font-bold text-sm w-full outline-none text-right"
            placeholder="0.0"
          />
          <span className="text-[10px] text-slate-500 font-bold ml-1">°C</span>
        </div>
      </div>

      {/* Humidity Input */}
      <div className="flex flex-col gap-1.5 group">
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Target Hum</label>
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 group-focus-within:border-emerald-500/50 transition-all hover:bg-slate-800/50">
          <WiHumidity className="text-emerald-500 text-xl -ml-1" />
          <input
            type="number"
            value={humVal}
            onChange={e => onHumChange(Number(e.target.value))}
            className="no-spinner bg-transparent text-white font-mono font-bold text-sm w-full outline-none text-right"
            placeholder="0.0"
          />
          <span className="text-[10px] text-slate-500 font-bold ml-1">%</span>
        </div>
      </div>

      {/* CO2 Input */}
      <div className="flex flex-col gap-1.5 group">
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">CO2 Limit</label>
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 group-focus-within:border-emerald-500/50 transition-all hover:bg-slate-800/50">
          <MdOutlineCo2 className="text-emerald-500 text-lg" />
          <input
            type="number"
            value={co2Val}
            onChange={e => onCo2Change(Number(e.target.value))}
            className="no-spinner bg-transparent text-white font-mono font-bold text-sm w-full outline-none text-right"
            placeholder="0"
          />
          <span className="text-[10px] text-slate-500 font-bold ml-1">ppm</span>
        </div>
      </div>

    </div>
  </div>
);


export default SetpointInput;