import React, { useState } from 'react';
import { FaFan } from 'react-icons/fa';
import { WiHumidity } from 'react-icons/wi';
import { MdOutlineCo2 } from 'react-icons/md';
import { GiValve, GiHotSurface, GiSnowflake2 } from 'react-icons/gi';

// --- TYPESCRIPT INTERFACES ---
interface SensorData {
  temp: number;
  hum: number;
  co2?: number;
  pressure?: number;
}

interface HVACSystemData {
  ambient: SensorData;
  intake: SensorData;
  return: SensorData;
  economizer: SensorData;
  afterCooling: SensorData;
  afterHeating: SensorData;
  releaseAir: SensorData;
  room1: SensorData;
  room2: SensorData;
}

interface ControlSignals {
  intakeOpening: number;
  coolingCoil: number;
  heatingCoil: number;
  humidifier: number;
  blower: number;
  vavRoom1: number;
  vavRoom2: number;
}

// --- REUSABLE UI COMPONENTS ---
const DataBadge = ({ label, value, unit, isAlert = false }: { label: string, value: number, unit: string, isAlert?: boolean }) => (
  <div className={`flex flex-col items-center p-1.5 rounded bg-slate-900 border ${isAlert ? 'border-red-500/50 text-red-400' : 'border-slate-700 text-cyan-400'} shadow-lg min-w-[60px] z-10`}>
    <span className="text-[10px] text-slate-400 uppercase font-bold">{label}</span>
    <span className="text-sm font-mono font-bold">{value}<span className="text-[10px] ml-0.5">{unit}</span></span>
  </div>
);

const VerticalPipe = ({ height = "h-16", color = "bg-slate-700" }) => (
  <div className={`w-6 ${height} ${color} border-x-2 border-slate-900 mx-auto relative overflow-hidden flex justify-center`}>
     {/* Simulated air flow line */}
     <div className="w-1 h-full bg-white/10 animate-pulse"></div>
  </div>
);

const HorizontalDuct = ({ width = "w-full", color = "bg-slate-700", flow = "right" }) => (
  <div className={`${width} h-8 ${color} border-y-2 border-slate-900 relative flex items-center`}>
     <div className="w-full h-1 bg-white/10 animate-pulse"></div>
  </div>
);

const ComponentBlock = ({ icon: Icon, label, controlValue, onControlChange, colorRing }: any) => (
  <div className="flex flex-col items-center relative z-10 bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-xl">
    <div className="text-xs text-slate-400 mb-2 font-semibold tracking-wider">{label}</div>
    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-[3px] bg-slate-900 mb-3 ${colorRing}`}>
      <Icon className="text-2xl text-slate-300" />
    </div>
    <div className="text-xs text-cyan-400 font-mono mb-1">{controlValue}% CMD</div>
    <input
      type="range"
      min="0"
      max="100"
      value={controlValue}
      onChange={(e) => onControlChange(Number(e.target.value))}
      className="w-20 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
    />
  </div>
);

export default function ScadaAHU() {
  // --- STATE ---
  const [sensors] = useState<HVACSystemData>({
    ambient: { temp: 32.5, hum: 65, co2: 410 },
    intake: { temp: 30.0, hum: 60, co2: 450 },
    return: { temp: 24.5, hum: 55, co2: 800 },
    economizer: { temp: 26.0, hum: 58, pressure: 102 },
    afterCooling: { temp: 14.5, hum: 95, pressure: 98 },
    afterHeating: { temp: 18.0, hum: 60, pressure: 95 },
    releaseAir: { temp: 18.5, hum: 58, co2: 500 },
    room1: { temp: 23.0, hum: 55, co2: 600 },
    room2: { temp: 25.5, hum: 58, co2: 750 },
  });

  const [controls, setControls] = useState<ControlSignals>({
    intakeOpening: 40,
    coolingCoil: 75,
    heatingCoil: 0,
    humidifier: 10,
    blower: 80,
    vavRoom1: 60,
    vavRoom2: 30,
  });

  const updateControl = (key: keyof ControlSignals, val: number) => {
    setControls(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-[#111827] text-slate-300 p-8 font-sans selection:bg-cyan-900">
      
      {/* HEADER & TOP LEVEL DATA */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-widest flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
            AHU SCADA VIEW
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-6 uppercase tracking-wider font-mono">System Online • Mode: Auto</p>
        </div>
        
        {/* Ambient Badge cluster */}
        <div className="flex gap-4 p-3 rounded bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-500 uppercase flex items-center mr-2">Ambient</div>
          <DataBadge label="Temp" value={sensors.ambient.temp} unit="°C" />
          <DataBadge label="Hum" value={sensors.ambient.hum} unit="%" />
          <DataBadge label="CO2" value={sensors.ambient.co2 || 0} unit="ppm" />
        </div>
      </div>

      {/* --- MAIN SCADA SCHEMATIC AREA --- */}
      <div className="relative w-full max-w-7xl mx-auto bg-[#1a2332] rounded-xl border border-slate-700 p-10 shadow-2xl overflow-hidden">
        
        {/* --- ROW 1: Return Air Drop --- */}
        <div className="flex justify-start pl-[20%] relative h-24">
          <div className="flex flex-col items-center absolute -top-4">
            <span className="text-xs text-slate-500 uppercase mb-2 font-bold">Return Air</span>
            <div className="flex gap-2 mb-2 absolute left-14 top-8">
               <DataBadge label="Temp" value={sensors.return.temp} unit="°C" />
               <DataBadge label="CO2" value={sensors.return.co2 || 0} unit="ppm" isAlert={(sensors.return.co2 || 0 )> 700 } />
            </div>
            <VerticalPipe height="h-20" color="bg-orange-900/40" />
          </div>
        </div>

        {/* --- ROW 2: The Main AHU Duct Flow --- */}
        <div className="flex items-center w-full relative">
          
          {/* 1. Intake */}
          <div className="w-[15%] flex flex-col items-center justify-center relative">
            <span className="absolute -top-12 text-xs text-slate-500 uppercase font-bold">Outside Air</span>
            <div className="flex flex-col gap-1 absolute -top-8 -left-2">
              <DataBadge label="Temp" value={sensors.intake.temp} unit="°C" />
              <DataBadge label="Hum" value={sensors.intake.hum} unit="%" />
            </div>
            <HorizontalDuct color="bg-blue-900/30" />
          </div>

          {/* 2. Mixing Box / Economizer */}
          <ComponentBlock 
            icon={GiValve} label="MIX DAMPER" 
            controlValue={controls.intakeOpening} onControlChange={(v: number) => updateControl('intakeOpening', v)} 
            colorRing="border-slate-500"
          />
          <HorizontalDuct width="w-[10%]" color="bg-gradient-to-r from-blue-900/30 to-slate-700" />

          {/* Mixing Sensors Overlay */}
          <div className="absolute left-[26%] -top-14 flex gap-2">
             <DataBadge label="Mix T" value={sensors.economizer.temp} unit="°C" />
             <DataBadge label="Mix P" value={sensors.economizer.pressure || 0} unit="Pa" />
          </div>

          {/* 3. Cooling Coil */}
          <ComponentBlock 
            icon={GiSnowflake2} label="COOLING COIL" 
            controlValue={controls.coolingCoil} onControlChange={(v: number) => updateControl('coolingCoil', v)} 
            colorRing="border-blue-500 text-blue-400"
          />
          <HorizontalDuct width="w-[8%]" color="bg-blue-900/40" />

           {/* Cooling Sensors Overlay */}
           <div className="absolute left-[44%] top-16 flex gap-2">
             <DataBadge label="Cool T" value={sensors.afterCooling.temp} unit="°C" />
          </div>

          {/* 4. Heating Coil */}
          <ComponentBlock 
            icon={GiHotSurface} label="HEATING COIL" 
            controlValue={controls.heatingCoil} onControlChange={(v: number) => updateControl('heatingCoil', v)} 
            colorRing="border-red-500 text-red-400"
          />
          <HorizontalDuct width="w-[8%]" color="bg-slate-700" />

          {/* Heating Sensors Overlay */}
          <div className="absolute left-[58%] top-16 flex gap-2">
             <DataBadge label="Heat T" value={sensors.afterHeating.temp} unit="°C" />
          </div>

          {/* 5. Main Blower */}
          <ComponentBlock 
            icon={FaFan} label="MAIN BLOWER" 
            controlValue={controls.blower} onControlChange={(v: number) => updateControl('blower', v)} 
            colorRing="border-green-500 text-green-400"
          />
          
          {/* Supply Header to Zones */}
          <HorizontalDuct width="w-[15%]" color="bg-cyan-900/30" />
          <div className="w-6 h-8 bg-cyan-900/30 border-y-2 border-r-2 border-slate-900 rounded-r"></div>

          {/* Supply Sensors Overlay */}
          <div className="absolute right-[10%] -top-14 flex gap-2">
             <DataBadge label="Supply T" value={sensors.releaseAir.temp} unit="°C" />
             <DataBadge label="Supply H" value={sensors.releaseAir.hum} unit="%" />
          </div>
        </div>

        {/* --- ROW 3: VAV ZONES --- */}
        <div className="flex justify-end pr-[5%] mt-8 relative">
           {/* Pipe dropping down to zones */}
           <div className="absolute right-[16%] -top-8">
              <VerticalPipe height="h-12" color="bg-cyan-900/30" />
           </div>

           <div className="w-[40%] flex flex-col gap-6 pt-6 border-t-4 border-l-4 rounded-tl-xl border-cyan-900/30 pl-8 relative">
              
              {/* VAV Room 1 */}
              <div className="flex items-center gap-6 bg-[#111827] p-4 rounded border border-slate-700">
                 <ComponentBlock 
                    icon={GiValve} label="VAV ZONE A" 
                    controlValue={controls.vavRoom1} onControlChange={(v: number) => updateControl('vavRoom1', v)} 
                    colorRing="border-cyan-500"
                 />
                 <div className="flex-1 grid grid-cols-2 gap-2">
                    <DataBadge label="Room T" value={sensors.room1.temp} unit="°C" />
                    <DataBadge label="Room CO2" value={sensors.room1.co2 || 0} unit="ppm" />
                 </div>
              </div>

              {/* VAV Room 2 */}
              <div className="flex items-center gap-6 bg-[#111827] p-4 rounded border border-slate-700">
                 <ComponentBlock 
                    icon={GiValve} label="VAV ZONE B" 
                    controlValue={controls.vavRoom2} onControlChange={(v: number) => updateControl('vavRoom2', v)} 
                    colorRing="border-cyan-500"
                 />
                 <div className="flex-1 grid grid-cols-2 gap-2">
                    <DataBadge label="Room T" value={sensors.room2.temp} unit="°C" />
                    <DataBadge label="Room CO2" value={sensors.room2.co2 || 0} unit="ppm" />
                 </div>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}