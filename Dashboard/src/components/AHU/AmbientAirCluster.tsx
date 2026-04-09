import { FaThermometerHalf, FaWind } from 'react-icons/fa';
import { WiHumidity } from 'react-icons/wi';
import { MdOutlineCo2 } from 'react-icons/md';
import { getCo2Color, getHumColor, getTempColor } from '../../utils/colors';
import { useTelemetry } from '../../utils/TelemetryContext';

export default function AmbientAirWidget() {
  const { hvacData } = useTelemetry();

  return (
    <div 
      className="relative flex flex-col justify-center h-16 px-4 min-w-55 rounded-xl shadow-lg overflow-hidden shrink-0"
      style={{
        backgroundImage: `url(/env_bg.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >

      <div className="absolute inset-0 bg-[#111827]/90 backdrop-blur-[2px] pointer-events-none"></div>

      {/* Top Row: Icon + Label */}
      <div className="relative z-10 flex items-center gap-1.5 mb-0.5 text-slate-100">
        <FaWind className="text-lg text-cyan-500 drop-shadow-sm" />
        <span className="text-xs font-bold tracking-widest">Ambient Environment</span>
      </div>

      {/* Bottom Row: Data Values */}
      <div className="relative z-10 flex items-center justify-between w-full">
        {/* Temp */}
        <div className={`flex items-center gap-1 ${getTempColor(hvacData.ambient.temp)}`}>
          <FaThermometerHalf className="text-[13px]" />
          <span className="font-mono font-bold text-lg tracking-tighter">{hvacData.ambient.temp.toFixed(1)}°C</span>
        </div>

        {/* Subtle Divider */}
        <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

        {/* Humidity */}
        <div className={`flex items-center gap-0.5 ${getHumColor(hvacData.ambient.hum)}`}>
          <WiHumidity className="text-xl -ml-1" />
          <span className="font-mono font-bold text-lg tracking-tighter">{hvacData.ambient.hum.toFixed(1)}%</span>
        </div>

        {/* Subtle Divider */}
        <div className="h-3 w-px bg-slate-600/50 mx-1.5"></div>

        {/* CO2 */}
        <div className={`flex items-center gap-0.5 ${getCo2Color(hvacData.ambient.co2||0)}`}>
          <MdOutlineCo2 className="text-2xl" />
          <span className="font-mono font-bold text-lg tracking-tighter">{(hvacData.ambient.co2||0).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}