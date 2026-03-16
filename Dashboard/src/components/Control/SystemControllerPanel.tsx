
import { useState } from 'react';
import { FaSlidersH, FaRobot, FaPython, FaUpload, FaPlay } from 'react-icons/fa';
import { GiValve, GiSnowflake2, GiHotSurface, GiWaterDrop } from 'react-icons/gi';
import ControlKnob from './ControlKnob';
import SetpointInput from './SetPoint';


const SystemControllerPanel = () => {
  const [mode, setMode] = useState<'manual' | 'auto' | 'custom'>('manual');

  // Dynamic Rooms Setup (You can pass this array length via props later)
  const dynamicRooms = ['room1', 'room2', 'room3', 'room4', 'room5'];

  // State: Manual Controls
  const [manualCmd, setManualCmd] = useState<any>({
    intakeOpening: 40, coolingCoil: 75, heatingCoil: 0, humidifier: 10, blower: 80,
    ...dynamicRooms.reduce((acc, room) => ({ ...acc, [`vav_${room}`]: 50 }), {})
  });

  // State: Auto Setpoints
  const [setpoints, setSetpoints] = useState<any>({
    releaseAir: { temp: 18.0, co2: 450 },
    ...dynamicRooms.reduce((acc, room) => ({ ...acc, [room]: { temp: 24.0, co2: 600 } }), {})
  });

  // State: Custom Python Script
  const [pythonScript, setPythonScript] = useState("# Define your custom HVAC control logic here\n# Available objects: sensors, actuators\n\ndef control_loop(sensors):\n    # Example: Simple proportional control\n    error = 24.0 - sensors['room1']['temp']\n    actuators['vavRoom1'] = max(0, min(100, error * 10))\n    return actuators\n");

  const updateManual = (key: string, val: number) => setManualCmd((p: any) => ({ ...p, [key]: val }));
  const updateSetpoint = (room: string, param: string, val: number) => {
    setSetpoints((p: any) => ({ ...p, [room]: { ...p[room], [param]: val } }));
  };

  return (
    <div className="w-full contrianer mx-auto mt-8 bg-[#1a2332] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">

      {/* HEADER & MODE TOGGLE */}
      <div className="bg-[#0f172a] p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
            System Command pnale
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-mono">Override & Logic Control</p>
        </div>

        {/* Segmented Control */}
        <div className="flex bg-[#111827] p-1.5 rounded-lg border border-slate-700 shadow-inner">
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-6 py-2 rounded text-xs font-bold tracking-widest uppercase transition-all ${mode === 'manual' ? 'bg-cyan-900/50 text-cyan-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FaSlidersH /> Manual
          </button>
          <button
            onClick={() => setMode('auto')}
            className={`flex items-center gap-2 px-6 py-2 rounded text-xs font-bold tracking-widest uppercase transition-all ${mode === 'auto' ? 'bg-emerald-900/50 text-emerald-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FaRobot /> Auto
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex items-center gap-2 px-6 py-2 rounded text-xs font-bold tracking-widest uppercase transition-all ${mode === 'custom' ? 'bg-purple-900/50 text-purple-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FaPython /> Custom
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-8">

        {/* --- MANUAL MODE --- */}
        {mode === 'manual' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-sm text-slate-400 font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">AHU Hardware Override</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <ControlKnob label="Mix Damper" value={manualCmd.intakeOpening} onChange={(v: number) => updateManual('intakeOpening', v)} icon={GiValve} colorClass="text-slate-400" />
                <ControlKnob label="Cooling Coil" isBinary={true} value={manualCmd.coolingCoil} onChange={(v: number) => updateManual('coolingCoil', v)} icon={GiSnowflake2} colorClass="text-sky-400" />
                <ControlKnob label="Heating Coil" isBinary={true} value={manualCmd.heatingCoil} onChange={(v: number) => updateManual('heatingCoil', v)} icon={GiHotSurface} colorClass="text-red-400" />
                <ControlKnob label="Humidifier" isBinary={true} value={manualCmd.humidifier} onChange={(v: number) => updateManual('humidifier', v)} icon={GiWaterDrop} colorClass="text-blue-400" />
                <ControlKnob label="Main Blower" value={manualCmd.blower} onChange={(v: number) => updateManual('blower', v)} icon={FaSlidersH} colorClass="text-green-400" />
              </div>
            </div>

            <div>
              <h3 className="text-sm text-slate-400 font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Zone VAV Override</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {dynamicRooms.map((room, idx) => (
                  <ControlKnob
                    key={room} label={`VAV Zone ${idx + 1}`}
                    value={manualCmd[`vav_${room}`]} onChange={(v: number) => updateManual(`vav_${room}`, v)}
                    icon={GiValve} colorClass="text-cyan-500"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- AUTO MODE --- */}
        {mode === 'auto' && (
          <div className="space-y-8 animate-in fade-in duration-300 w-full">
            <div>
              <h3 className="text-sm text-emerald-500/80 font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Main Supply Targets</h3>
              <SetpointInput
                label="AHU Release"
                tempVal={setpoints.releaseAir.temp} co2Val={setpoints.releaseAir.co2}
                onTempChange={(v: number) => updateSetpoint('releaseAir', 'temp', v)}
                onCo2Change={(v: number) => updateSetpoint('releaseAir', 'co2', v)}
              />
            </div>

            <div>
              <h3 className="text-sm text-emerald-500/80 font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-6">
                Zone Setpoints
              </h3>

              {/* The Grid Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
                {dynamicRooms.map((room, idx) => (
                  <SetpointInput
                    key={room}
                    label={`Zone ${idx + 1}`}

                    // Values
                    tempVal={setpoints[room].temp}
                    humVal={setpoints[room].hum || 50} // Added humidity
                    co2Val={setpoints[room].co2}

                    // Handlers
                    onTempChange={(v: number) => updateSetpoint(room, 'temp', v)}
                    onHumChange={(v: number) => updateSetpoint(room, 'hum', v)} // Added handler
                    onCo2Change={(v: number) => updateSetpoint(room, 'co2', v)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- CUSTOM MODE --- */}
        {mode === 'custom' && (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="flex justify-between items-end border-b border-slate-700 pb-2 mb-4">
              <h3 className="text-sm text-purple-400/80 font-bold uppercase tracking-widest">Python Logic Editor</h3>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold tracking-widest uppercase transition-colors border border-slate-600">
                  <FaUpload /> Upload .py
                </button>
                <button className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                  <FaPlay /> Deploy Logic
                </button>
              </div>
            </div>

            <textarea
              value={pythonScript}
              onChange={(e) => setPythonScript(e.target.value)}
              spellCheck="false"
              className="w-full h-80 bg-[#0d1117] text-slate-300 font-mono text-sm p-4 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500/50 shadow-inner resize-y custom-scrollbar"
            />
            <p className="text-[10px] text-slate-500 font-mono mt-2">
              Note: Script runs securely on the edge controller. Ensure you return the `actuators` dictionary.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default SystemControllerPanel;
