import React, { useState } from 'react';
import { FaThermometerHalf, FaFan, FaTachometerAlt, FaWind } from 'react-icons/fa';
import { WiHumidity } from 'react-icons/wi';
import { MdOutlineCo2 } from 'react-icons/md';
import { GiValve, GiHotSurface, GiSnowflake2, GiWaterDrop } from 'react-icons/gi';

// Helper component for Sensor Values
type SensorItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  unit: string;
  colorClass?: string;
};

const SensorItem: React.FC<SensorItemProps> = ({ icon: Icon, label, value, unit, colorClass = "text-gray-300" }) => (
  <div className="flex items-center justify-between text-sm py-1">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon className="text-lg" />
      <span>{label}</span>
    </div>
    <span className={`font-mono font-semibold ${colorClass}`}>
      {value} {unit}
    </span>
  </div>
);

// Helper component for Control Sliders
interface ControlSliderProps {
  label: string;
  value: number | string;
  onChange: (val: string) => void;
  icon: React.ComponentType;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, onChange, icon: Icon }) => (
  <div className="mt-3 bg-slate-800/50 p-3 rounded-lg border border-cyan-900/50">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
        <Icon /> {label}
      </div>
      <span className="text-cyan-300 font-mono text-sm">{value}%</span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
    />
  </div>
);

export default function AHUDashboard() {
  // --- MOCK SENSOR DATA (Replace with your IoT backend data) ---
  const sensors = {
    ambient: { temp: 32.5, hum: 65, co2: 410 },
    intake: { temp: 30.0, hum: 60, co2: 450 },
    return: { temp: 24.5, hum: 55, co2: 800 },
    economizer: { temp: 26.0, hum: 58, pressure: 102 },
    afterCooling: { temp: 14.5, hum: 95, pressure: 98 },
    afterHeating: { temp: 18.0, hum: 60, pressure: 95 },
    releaseAir: { temp: 18.5, hum: 58, co2: 500 },
    room1: { temp: 23.0, hum: 55, co2: 600 },
    room2: { temp: 25.5, hum: 58, co2: 750 },
  };

  // --- CONTROL SIGNAL STATES ---
  const [controls, setControls] = useState({
    intakeOpening: 40,
    coolingCoil: 75,
    heatingCoil: 0,
    humidifier: 10,
    blower: 80,
    vavRoom1: 60,
    vavRoom2: 30,
  });

  const handleControlChange = (key: keyof typeof controls, val: string) => {
    setControls(prev => ({ ...prev, [key]: val }));
  };

  // Dynamic color logic for temperatures
  const getTempColor = (temp: number) => {
    if (temp < 18) return 'text-blue-400';
    if (temp > 26) return 'text-red-400';
    return 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      
      {/* HEADER & AMBIENT */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-white">AHU TELEMETRY</h1>
          <p className="text-slate-500 text-sm mt-1">Decentralized HVAC Lab Control Unit</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-6 shadow-lg shadow-black/50">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1 absolute -mt-7">Ambient Env</div>
          <SensorItem icon={FaThermometerHalf} label="Temp" value={sensors.ambient.temp} unit="°C" colorClass={getTempColor(sensors.ambient.temp)} />
          <SensorItem icon={WiHumidity} label="Humidity" value={sensors.ambient.hum} unit="%" />
          <SensorItem icon={MdOutlineCo2} label="CO2" value={sensors.ambient.co2} unit="ppm" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* AHU SCHEMATIC SECTION */}
        <h2 className="text-xl font-semibold text-slate-400 mb-4 flex items-center gap-2">
          <FaWind className="text-slate-500" /> AHU Internal Stages
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Stage 1: Intake & Return */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-1">Fresh Air Intake</h3>
                <SensorItem icon={FaThermometerHalf} label="Temp" value={sensors.intake.temp} unit="°C" colorClass={getTempColor(sensors.intake.temp)} />
                <SensorItem icon={WiHumidity} label="Hum" value={sensors.intake.hum} unit="%" />
                <SensorItem icon={MdOutlineCo2} label="CO2" value={sensors.intake.co2} unit="ppm" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-1">Return Air</h3>
                <SensorItem icon={FaThermometerHalf} label="Temp" value={sensors.return.temp} unit="°C" colorClass={getTempColor(sensors.return.temp)} />
                <SensorItem icon={MdOutlineCo2} label="CO2" value={sensors.return.co2} unit="ppm" />
              </div>
            </div>
            <ControlSlider label="Damper / Intake" value={controls.intakeOpening} onChange={(v) => handleControlChange('intakeOpening', v)} icon={GiValve} />
          </div>

          {/* Stage 2: Economizer (Mixed) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-1">Economizer (Mixed)</h3>
            <div className="space-y-1 flex-grow">
              <SensorItem icon={FaThermometerHalf} label="Temp" value={sensors.economizer.temp} unit="°C" colorClass={getTempColor(sensors.economizer.temp)} />
              <SensorItem icon={WiHumidity} label="Hum" value={sensors.economizer.hum} unit="%" />
              <SensorItem icon={FaTachometerAlt} label="Pressure" value={sensors.economizer.pressure} unit="Pa" />
            </div>
          </div>

          {/* Stage 3: Cooling Coil */}
          <div className="bg-slate-900 border border-blue-900/30 rounded-xl p-4 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-blue-500 mb-2 border-b border-slate-800 pb-1">After Cooling</h3>
              <SensorItem icon={FaThermometerHalf} label="Temp" value={sensors.afterCooling.temp} unit="°C" colorClass={getTempColor(sensors.afterCooling.temp)} />
              <SensorItem icon={WiHumidity} label="Hum" value={sensors.afterCooling.hum} unit="%" />
              <SensorItem icon={FaTachometerAlt} label="Pressure" value={sensors.afterCooling.pressure} unit="Pa" />
            </div>
            <ControlSlider label="Cooling Coil" value={controls.coolingCoil} onChange={(v) => handleControlChange('coolingCoil', v)} icon={GiSnowflake2} />
          </div>

          {/* Stage 4: Heating & Humidifier */}
          <div className="bg-slate-900 border border-red-900/30 rounded-xl p-4 shadow-md flex flex-col justify-between">
             <div>
              <h3 className="text-xs uppercase tracking-widest text-red-500 mb-2 border-b border-slate-800 pb-1">After Heating</h3>
              <SensorItem icon={FaThermometerHalf} label="Temp" value={sensors.afterHeating.temp} unit="°C" colorClass={getTempColor(sensors.afterHeating.temp)} />
              <SensorItem icon={WiHumidity} label="Hum" value={sensors.afterHeating.hum} unit="%" />
              <SensorItem icon={FaTachometerAlt} label="Pressure" value={sensors.afterHeating.pressure} unit="Pa" />
            </div>
            <div className="space-y-2 mt-2">
              <ControlSlider label="Heating Coil" value={controls.heatingCoil} onChange={(v) => handleControlChange('heatingCoil', v)} icon={GiHotSurface} />
              <ControlSlider label="Humidifier" value={controls.humidifier} onChange={(v) => handleControlChange('humidifier', v)} icon={GiWaterDrop} />
            </div>
          </div>

          {/* Stage 5: Blower & Supply */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-green-500 mb-2 border-b border-slate-800 pb-1">Release Air (Supply)</h3>
              <SensorItem icon={FaThermometerHalf} label="Temp" value={sensors.releaseAir.temp} unit="°C" colorClass={getTempColor(sensors.releaseAir.temp)} />
              <SensorItem icon={WiHumidity} label="Hum" value={sensors.releaseAir.hum} unit="%" />
              <SensorItem icon={MdOutlineCo2} label="CO2" value={sensors.releaseAir.co2} unit="ppm" />
            </div>
            <ControlSlider label="Main Blower" value={controls.blower} onChange={(v) => handleControlChange('blower', v)} icon={FaFan} />
          </div>

        </div>

        {/* MULTI-ZONE ROOMS SECTION */}
        <h2 className="text-xl font-semibold text-slate-400 mt-10 mb-4 border-t border-slate-800 pt-8 flex items-center gap-2">
           Zone Control (VAV)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Room 1 */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 shadow-lg flex justify-between items-center">
            <div className="flex-1 pr-6 border-r border-slate-800">
              <h3 className="text-lg font-medium text-white mb-3">Zone A / Room 1</h3>
              <SensorItem icon={FaThermometerHalf} label="Temperature" value={sensors.room1.temp} unit="°C" colorClass={getTempColor(sensors.room1.temp)} />
              <SensorItem icon={WiHumidity} label="Humidity" value={sensors.room1.hum} unit="%" />
              <SensorItem icon={MdOutlineCo2} label="CO2 Level" value={sensors.room1.co2} unit="ppm" />
            </div>
            <div className="flex-1 pl-6">
               <ControlSlider label="VAV Box Opening" value={controls.vavRoom1} onChange={(v) => handleControlChange('vavRoom1', v)} icon={GiValve} />
            </div>
          </div>

          {/* Room 2 */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 shadow-lg flex justify-between items-center">
            <div className="flex-1 pr-6 border-r border-slate-800">
              <h3 className="text-lg font-medium text-white mb-3">Zone B / Room 2</h3>
              <SensorItem icon={FaThermometerHalf} label="Temperature" value={sensors.room2.temp} unit="°C" colorClass={getTempColor(sensors.room2.temp)} />
              <SensorItem icon={WiHumidity} label="Humidity" value={sensors.room2.hum} unit="%" />
              <SensorItem icon={MdOutlineCo2} label="CO2 Level" value={sensors.room2.co2} unit="ppm" />
            </div>
            <div className="flex-1 pl-6">
               <ControlSlider label="VAV Box Opening" value={controls.vavRoom2} onChange={(v) => handleControlChange('vavRoom2', v)} icon={GiValve} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}