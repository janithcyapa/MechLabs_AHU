import { useState } from 'react';
import { FaFan, FaTachometerAlt, FaThermometerHalf } from 'react-icons/fa';
import { GiValve, GiHotSurface, GiSnowflake2 } from 'react-icons/gi';
import AmbientAirCluster from '../components/LiveDash/AmbientAirCluster';
import { MdOutlineCo2 } from 'react-icons/md';
import { WiHumidity } from 'react-icons/wi';

import { BiSolidSprayCan } from 'react-icons/bi';
import { ComponentBlock, HorizontalDuct, SensorBlock, VerticalPipe, VerticalSensorBlock } from '../components/LiveDash/AHUComponents';


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

export default function ScadaAHU() {

  const [sensors] = useState<HVACSystemData>({
    ambient: { temp: 32.5, hum: 65, co2: 410 },
    intake: { temp: 30.0, hum: 60, co2: 450 },
    return: { temp: 28.5, hum: 55, co2: 800 },
    economizer: { temp: 24.0, hum: 58, pressure: 102 },
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


  return (
    <div className="min-h-screen container mx-auto bg-[#111827] text-slate-300 p-8 font-sans selection:bg-cyan-900">

      {/* HEADER & TOP LEVEL DATA */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-white  flex items-center gap-3 uppercase">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Monitoring
          </h1>
          <p className="text-slate-500 text-sm ml-6 uppercase tracking-wider font-mono">System Online • Mode: Auto</p>
        </div>

        <AmbientAirCluster />
      </div>


      <div className="relative w-full rounded-xl p-4 py-4 shadow-2xl overflow-hidden mt-8 text-slate-500">

        {/* --- ROW 1: THE AHU & ENCLOSURE --- */}
        <div className="flex items-center w-full relative z-20 p-2">

          <SensorBlock 
              label="Outside Air" 
              temp={sensors.ambient.temp} 
              hum={sensors.ambient.hum} 
              co2={sensors.ambient.co2} 
              width="max-w-48 w-full"
            />

          {/* THE AHU BOX */}
          <div className="flex-5 h-48 border-4 border-slate-600/40 bg-slate-800/20 rounded-2xl relative flex items-center justify-between shadow-[inset_0_0_30px_rgba(0,0,0,0.2)]">
            <span className="absolute z-30 -top-6 left-4 bg-slate-800/20 px-3 py-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest rounded border border-slate-600/40 shadow-md">
              AHU Enclosure
            </span>

            {/* 1. Mix Damper */}
            <ComponentBlock icon={GiValve} label="MIX DAMPER" controlValue={controls.intakeOpening} colorRing="border-slate-500" />
            <SensorBlock 
              label="Mix Sensor" 
              temp={sensors.economizer.temp} 
              hum={sensors.economizer.hum} 
              pressure={sensors.economizer.pressure} 
            />
            {/* 2. Cooling Coil */}
            <ComponentBlock icon={GiSnowflake2} label="COOL COIL" controlValue={controls.coolingCoil} colorRing="border-blue-500 text-blue-400" />
            <SensorBlock 
              label="Cooler Sensor" 
              temp={sensors.afterCooling.temp} 
              hum={sensors.afterCooling.hum} 
              pressure={sensors.afterCooling.pressure} 
            />
 
            {/* 3. Heating Coil */}
            <ComponentBlock icon={GiHotSurface} label="HEAT COIL" controlValue={controls.heatingCoil} colorRing="border-red-500 text-red-400" />
            <HorizontalDuct width="w-24" color={""} />
            <ComponentBlock icon={BiSolidSprayCan} label="HUMIDIFER" controlValue={controls.humidifier} colorRing="border-sky-500 text-sky-400" />
            <SensorBlock 
              label="Heater Sensor" 
              temp={sensors.afterCooling.temp} 
              hum={sensors.afterCooling.hum} 
              pressure={sensors.afterCooling.pressure} 
            />
            <ComponentBlock icon={FaFan} label="MAIN BLOWER" controlValue={controls.blower} colorRing="border-green-500 text-green-400" />
          </div>


        </div>

        {/* --- ROW 2: ROUTING (Return Air Up / Supply Air Down) --- */}
        <div className="flex items-center justify-between w-full relative h-28 z-10">
            <div className="max-w-56 w-full" />
             <VerticalSensorBlock 
              label="Return Air" 
              temp={sensors.return.temp} 
              hum={sensors.return.hum} 
              co2={sensors.return.co2} 
            />
            <div className="flex-1"/>
            <VerticalSensorBlock 
              label="Release Air" 
              temp={sensors.releaseAir.temp} 
              hum={sensors.releaseAir.hum} 
              co2={sensors.releaseAir.co2} 
            />
            <div className="max-w-10 w-full" />
          {/* Return Air Column (Lines up under Mix Damper) */}
          {/* <div className="ml-[22%] flex items-center h-full ">
            <div className="flex flex-col items-end mr-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Return Air</span>
              <SeamlessSensor icon={FaThermometerHalf} value={sensors.return.temp} unit="°C" type="temp" />
              <div className="my-1"></div>
              <SeamlessSensor icon={MdOutlineCo2} value={sensors.return.co2 || 0} unit="ppm" type="co2" />
            </div>
            <VerticalPipe height="h-full" color="bg-orange-900/30" />
          </div> */}

          {/* Supply Air Column (Lines up under right duct) */}
          {/* <div className="mr-[2%] flex items-center h-full">
            <VerticalPipe height="h-full" color="bg-cyan-900/30" />
            <div className="flex flex-col items-start ml-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Supply Air</span>
              <SeamlessSensor icon={FaThermometerHalf} value={sensors.releaseAir.temp} unit="°C" type="temp" />
              <div className="my-1"></div>
              <SeamlessSensor icon={WiHumidity} value={sensors.releaseAir.hum} unit="%" type="hum" />
            </div>
          </div> */}
        </div>

        {/* --- ROW 3: VAV ZONES --- */}
        <div className="grid grid-cols-2 gap-12 w-full px-[8%] mt-4 relative z-20">

          {/* VAV Room A */}
          <div className="flex items-center gap-6 bg-slate-900 p-5 rounded-2xl border border-slate-700 shadow-lg relative">
            <ComponentBlock icon={GiValve} label="VAV ZONE A" controlValue={controls.vavRoom1} colorRing="border-cyan-500 text-cyan-400" />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700 pb-1 mb-1">Room Conditions</span>
              <SeamlessSensor icon={FaThermometerHalf} value={sensors.room1.temp} unit="°C" type="temp" />
              <SeamlessSensor icon={MdOutlineCo2} value={sensors.room1.co2 || 0} unit="ppm" type="co2" />
            </div>
          </div>

          {/* VAV Room B */}
          <div className="flex items-center gap-6 bg-slate-900 p-5 rounded-2xl border border-slate-700 shadow-lg relative">
            <ComponentBlock icon={GiValve} label="VAV ZONE B" controlValue={controls.vavRoom2} colorRing="border-cyan-500 text-cyan-400" />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700 pb-1 mb-1">Room Conditions</span>
              <SeamlessSensor icon={FaThermometerHalf} value={sensors.room2.temp} unit="°C" type="temp" />
              <SeamlessSensor icon={MdOutlineCo2} value={sensors.room2.co2 || 0} unit="ppm" type="co2" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}


const SeamlessSensor = ({ icon: Icon, value, unit, type }: { icon: any, value: number, unit: string, type: string }) => {
  // Color logic identical to the seamless ambient widget
  let colorClass = 'text-slate-300';
  if (type === 'temp') {
    if (value < 18) colorClass = 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]';
    else if (value > 28) colorClass = 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]';
    else colorClass = 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]';
  } else if (type === 'hum') {
    colorClass = 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]';
  } else if (type === 'co2') {
    if (value > 1000) colorClass = 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]';
    else if (value < 800) colorClass = 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]';
    else colorClass = 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]';
  } else if (type === 'pressure') {
    colorClass = 'text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]';
  }

  return (
    <div className={`flex items-center gap-1.5 bg-[#111827]/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-700/50 shadow-sm ${colorClass}`}>
      <Icon className="text-sm" />
      <span className="font-mono font-bold text-xs tracking-tighter">{value}<span className="text-[10px] ml-[1px] opacity-70">{unit}</span></span>
    </div>
  );
};

