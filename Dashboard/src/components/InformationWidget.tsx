import { FaThermometerHalf, FaWind, FaTachometerAlt, FaDatabase, FaCircle } from 'react-icons/fa';
import { WiHumidity } from 'react-icons/wi';
import { MdOutlineCo2 } from 'react-icons/md';
import { getCo2Color, getHumColor, getTempColor } from '../utils/colors';
import { useTelemetry } from '../utils/TelemetryContext';

export default function InformationWidget() {
  const { systemData, isRecording, recordedPoints, experimentName } = useTelemetry();

  return (
    <div className="flex gap-4 ">
      {/* Ambient Environment (Yellowish) */}
      <div
        className="relative flex flex-col justify-center h-16 px-4 min-w-55 rounded-xl shadow-lg overflow-hidden shrink-0"
        style={{
          backgroundImage: `url(/env_bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#3b341f]/90 backdrop-blur-[2px] pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-1.5 mb-0.5 text-slate-100">
          <FaWind className="text-lg text-yellow-500 drop-shadow-sm" />
          <span className="text-xs font-bold tracking-widest text-yellow-100">Ambient Environment</span>
        </div>

        <div className="relative z-10 flex items-center justify-between w-full">
          <div className={`flex items-center gap-1 ${getTempColor(systemData.outside.t)}`}>
            <FaThermometerHalf className="text-[13px]" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.outside.t.toFixed(1)}°C</span>
          </div>

          <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

          <div className={`flex items-center gap-0.5 ${getHumColor(systemData.outside.h)}`}>
            <WiHumidity className="text-xl -ml-1" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.outside.h.toFixed(1)}%</span>
          </div>

          <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

          <div className={`flex items-center gap-0.5 ${getCo2Color(systemData.outside.c)}`}>
            <MdOutlineCo2 className="text-2xl" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.outside.c.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Supply Condition */}
      <div
        className="relative flex flex-col justify-center h-16 px-4 min-w-55 rounded-xl shadow-lg overflow-hidden shrink-0"
        style={{
          backgroundImage: `url(/env_bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#111827]/90 backdrop-blur-[2px] pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-1.5 mb-0.5 text-slate-100">
          <FaWind className="text-lg text-cyan-500 drop-shadow-sm" />
          <span className="text-xs font-bold tracking-widest">Supply Condition</span>
        </div>

        <div className="relative z-10 flex items-center justify-between w-full">
          <div className={`flex items-center gap-1 ${getTempColor(systemData.supply.t)}`}>
            <FaThermometerHalf className="text-[13px]" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.supply.t.toFixed(1)}°C</span>
          </div>

          <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

          <div className={`flex items-center gap-0.5 ${getHumColor(systemData.supply.h)}`}>
            <WiHumidity className="text-xl -ml-1" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.supply.h.toFixed(1)}%</span>
          </div>

          <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

          <div className={`flex items-center gap-0.5 ${getCo2Color(systemData.supply.c)}`}>
            <MdOutlineCo2 className="text-2xl" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.supply.c.toFixed(1)}</span>
          </div>
          
          <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

          <div className={`flex items-center gap-0.5 text-blue-300`}>
            <FaTachometerAlt className="text-[11px] mr-0.5" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.flowrate.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Room Condition (Bluish) */}
      <div
        className="relative flex flex-col justify-center h-16 px-4 min-w-55 rounded-xl shadow-lg overflow-hidden shrink-0"
        style={{
          backgroundImage: `url(/env_bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#172554]/90 backdrop-blur-[2px] pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-1.5 mb-0.5 text-slate-100">
          <FaWind className="text-lg text-blue-400 drop-shadow-sm" />
          <span className="text-xs font-bold tracking-widest text-blue-100">Room Condition</span>
        </div>

        <div className="relative z-10 flex items-center justify-between w-full">
          <div className={`flex items-center gap-1 ${getTempColor(systemData.room1_sensor1.t)}`}>
            <FaThermometerHalf className="text-[13px]" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.room1_sensor1.t.toFixed(1)}°C</span>
          </div>

          <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

          <div className={`flex items-center gap-0.5 ${getHumColor(systemData.room1_sensor1.h)}`}>
            <WiHumidity className="text-xl -ml-1" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.room1_sensor1.h.toFixed(1)}%</span>
          </div>

          <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

          <div className={`flex items-center gap-0.5 ${getCo2Color(systemData.room1_sensor1.c)}`}>
            <MdOutlineCo2 className="text-2xl" />
            <span className="font-mono font-bold text-lg tracking-tighter">{systemData.room1_sensor1.c.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="relative flex flex-col justify-center h-16 px-4 min-w-40 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)] overflow-hidden shrink-0 border border-red-500/30 bg-[#1a2332]">
          <div className="relative z-10 flex items-center gap-1.5 mb-1 text-red-400">
            <FaCircle className="text-[10px] animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase">{experimentName}</span>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <FaDatabase className="text-cyan-500 text-[13px]" />
            <span className="font-mono font-bold text-lg text-cyan-400 tracking-tighter">{recordedPoints}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">pts</span>
          </div>
        </div>
      )}

    </div>
  );
}