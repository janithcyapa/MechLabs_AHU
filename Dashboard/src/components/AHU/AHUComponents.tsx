import { getCo2Color, getHumColor, getPressureColor, getTempColor } from '../../utils/colors';
import { FaTachometerAlt, FaThermometerHalf } from 'react-icons/fa';
import { MdOutlineCo2 } from 'react-icons/md';
import { WiHumidity } from 'react-icons/wi';

export const ComponentBlock = ({ icon: Icon, label, controlValue, colorRing, isBooleanControl = false }: any) => {
  // --- Math for the SVG Dial ---
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  // 1. Determine the numeric value for the dial
  // If boolean: truthy = 100, falsy = 0. Otherwise, clamp the 0-100 range.
  const effectiveValue = isBooleanControl
    ? (controlValue ? 100 : 0)
    : Math.max(0, Math.min(100, controlValue || 0));

  const strokeDashoffset = circumference - (effectiveValue / 100) * circumference;

  // 2. Determine the text display
  const displayLabel = isBooleanControl
    ? (controlValue ? "ON" : "OFF")
    : `${effectiveValue}%`;

  return (
    <div className="flex flex-col items-center justify-between relative z-10 p-3 rounded-xl bg-slate-700/40 shadow-xl min-w-28 h-full">
      <div className="text-xs uppercase text-center mb-3 text-slate-400">
        {label}
      </div>

      {/* The Dial Container */}
      <div className={`relative w-20 h-20 flex items-center justify-center ${colorRing}`}>

        {/* SVG Progress Ring */}
        <svg className="absolute inset-0 w-full h-full rotate-90 drop-shadow-md z-20">
          {/* Faint Background Track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="opacity-20"
          />
          {/* Active Glowing Progress Track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Inner Circle */}
        <div className="w-15 h-15 rounded-full flex items-center justify-center bg-[#0f172a] shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)] z-10">
          <Icon className="text-2xl text-slate-200 drop-shadow-sm" />
        </div>
      </div>

      {/* Status Text - Toggles between "ON/OFF" and "X%" */}
      <div className={`text-xl font-mono font-bold tracking-wider mt-3 ${colorRing}`}>
        {displayLabel}
      </div>
    </div>
  );
};

export const SensorBlock = ({ label = "", temp, hum, co2, pressure, flowrate, duct = "", width = 'w-full', showDuct = true }: any) => {

  // If no sensors are provided at all, we can hide the whole box, or just render the duct.
  const hasReadings = temp != null || hum != null || co2 != null || pressure != null || flowrate != null;

  return (
    <div className={`min-w-25 ${width} relative flex flex-col justify-center items-center`}>
      {showDuct && <HorizontalDuct width="w-full" color={duct} />}

      <div className='absolute -top-16 pt-2 flex flex-col items-center gap-1 z-20'>
        {label && <div className="text-xs uppercase text-center">{label}</div>}

        {/* Sensor Readings Box - Using divide-y to automatically handle lines between existing items */}
        {hasReadings && (
          <div className="mt-1 flex flex-col bg-slate-800/85 px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-[2px] divide-y divide-slate-600/50">

            {/* Temp */}
            {temp != null && (
              <div className={`flex items-center justify-between gap-4 py-1.5 ${getTempColor(temp)}`}>
                <FaThermometerHalf className="text-[13px]" />
                <span className="font-mono font-bold text-sm tracking-tighter">{temp}°C</span>
              </div>
            )}

            {/* Humidity */}
            {hum != null && (
              <div className={`flex items-center justify-between gap-4 py-1.5 ${getHumColor(hum)}`}>
                <WiHumidity className="text-xl -ml-1" />
                <span className="font-mono font-bold text-sm tracking-tighter">{hum}%</span>
              </div>
            )}

            {/* CO2 */}
            {co2 != null && (
              <div className={`flex items-center justify-between gap-4 py-1.5 ${getCo2Color(co2)}`}>
                <MdOutlineCo2 className="text-2xl -ml-1" />
                <span className="font-mono font-bold text-sm tracking-tighter">{co2}ppm</span>
              </div>
            )}

            {/* Pressure */}
            {pressure != null && (
              <div className={`flex items-center justify-between gap-4 py-1.5 ${getPressureColor(pressure)}`}>
                <FaTachometerAlt className="text-[12px]" />
                <span className="font-mono font-bold text-sm tracking-tighter">{pressure}Pa</span>
              </div>
            )}

            {/* Flowrate */}
            {flowrate != null && (
              <div className={`flex items-center justify-between gap-4 py-1.5 text-blue-300`}>
                <FaTachometerAlt className="text-[12px]" />
                <span className="font-mono font-bold text-sm tracking-tighter">{flowrate.toFixed(1)} L/s</span>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export const VerticalSensorBlock = ({ label = "", temp, hum, co2, pressure, flowrate, duct = "", height = 'h-52', showDuct = true }: any) => {

  const hasReadings = temp != null || hum != null || co2 != null || pressure != null || flowrate != null;

  return (
    <div className={`relative flex items-center justify-center ${height} w-20`}>
      {/* The Vertical Pipe Background */}
      {showDuct && <VerticalPipe height="h-full" color={duct} />}

      {/* Label positioned to the left of the pipe */}
      {label && (
        <div className="absolute right-24 mr-4 text-xs uppercase text-center">
          {label}
        </div>
      )}

      {/* Sensor Readings Box - Floating directly on the pipe */}
      {hasReadings && (
        <div className="absolute z-30 flex w-28 flex-col bg-slate-800/85 px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-[2px] divide-y divide-slate-600/50">

          {/* Temp */}
          {temp != null && (
            <div className={`flex items-center justify-between gap-4 py-1.5 ${getTempColor(temp)}`}>
              <FaThermometerHalf className="text-[13px]" />
              <span className="font-mono font-bold text-sm tracking-tighter">{temp}°C</span>
            </div>
          )}

          {/* Humidity */}
          {hum != null && (
            <div className={`flex items-center justify-between gap-4 py-1.5 ${getHumColor(hum)}`}>
              <WiHumidity className="text-xl -ml-1" />
              <span className="font-mono font-bold text-sm tracking-tighter">{hum}%</span>
            </div>
          )}

          {/* CO2 */}
          {co2 != null && (
            <div className={`flex items-center justify-between gap-4 py-1.5 ${getCo2Color(co2)}`}>
              <MdOutlineCo2 className="text-2xl -ml-1" />
              <span className="font-mono font-bold text-sm tracking-tighter">{co2}ppm</span>
            </div>
          )}

          {/* Pressure */}
          {pressure != null && (
            <div className={`flex items-center justify-between gap-4 py-1.5 ${getPressureColor(pressure)}`}>
              <FaTachometerAlt className="text-[12px]" />
              <span className="font-mono font-bold text-sm tracking-tighter">{pressure}Pa</span>
            </div>
          )}

          {/* Flowrate */}
          {flowrate != null && (
            <div className={`flex items-center justify-between gap-4 py-1.5 text-blue-300`}>
              <FaTachometerAlt className="text-[12px]" />
              <span className="font-mono font-bold text-sm tracking-tighter">{flowrate.toFixed(1)} L/s</span>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export const VerticalPipe = ({ height = "h-16", color = "bg-slate-700" }) => (
  <div className={`w-12 ${height} ${color} border-x-2 border-slate-900 mx-auto relative overflow-hidden flex justify-center`}>
    <div className="w-1 h-full bg-white/10 animate-pulse"></div>
  </div>
);

export const HorizontalDuct = ({ width = "w-full", color = "bg-slate-700" }) => (
  <div className={`${width} h-12 ${color} border-y-2 border-slate-900 relative flex items-center`}>
    <div className="w-full h-1 bg-white/10 animate-pulse"></div>
  </div>
);
