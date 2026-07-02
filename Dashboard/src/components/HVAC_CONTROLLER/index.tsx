
import { useEffect, useState } from 'react';
import { FaSlidersH, FaRobot, FaUpload, FaPlay } from 'react-icons/fa';
import { GiValve, GiSnowflake2, GiHotSurface, GiWaterDrop } from 'react-icons/gi';
import { ToggleSwitch, ControlKnob } from './ControlKnob';
import PanelSlider from './ControlSlider';
import SetpointInput from './SetPoint';
import { useTelemetry } from '../../utils/TelemetryContext';
import { dummyActuators as actuators } from '../../utils/dummyData';

const SystemControllerPanel = () => {
  const { sendCommand } = useTelemetry();
  const [mode, setMode] = useState<'manual' | 'auto' | 'custom'>('manual');

  // Dynamic Rooms Setup (You can pass this array length via props later)
  const dynamicRooms = ['room'];

  // State: Manual Controls
  const [manualCmd, setManualCmd] = useState<any>({
    intakeOpening: 0, coolingCoil: 0, heatingCoil: 0, humidifier: 0, blower: 0, vav: 0
  });

  // State: Auto Setpoints
  const [setpoints, setSetpoints] = useState<any>({
    releaseAir: { temp: 18.0, co2: 450, hum: 50 },
    ...dynamicRooms.reduce((acc, room) => ({ ...acc, [room]: { temp: 24.0, co2: 600, hum: 50 } }), {})
  });

  useEffect(() => {
    if (actuators) {
      setManualCmd((prev: any) => ({
        ...prev,
        intakeOpening: actuators.intakeOpening ?? prev.intakeOpening,
        coolingCoil: actuators.coolingCoil ?? prev.coolingCoil,
        heatingCoil: actuators.heatingCoil ?? prev.heatingCoil,
        humidifier: actuators.humidifier ?? prev.humidifier,
        blower: actuators.blower ?? prev.blower,
      }));
    }
  }, [actuators]);

  const updateManual = (key: string, val: number) => {
    // Sync fan (blower) and vav
    if (key === 'blower' || key === 'vav') {
      setManualCmd((p: any) => ({ ...p, blower: val, vav: val }));
      sendCommand("ahu/cmd", { fan: val, vav: val });
    } else {
      setManualCmd((p: any) => ({ ...p, [key]: val }));

      const hardwareKeys: Record<string, string> = {
        intakeOpening: 'mixer',
        coolingCoil: 'cooler',
        heatingCoil: 'heater',
        humidifier: 'humidifer', // Note: matching the typo in firmware
      };

      const hwKey = hardwareKeys[key];

      if (hwKey) {
        sendCommand("ahu/cmd", { [hwKey]: val });
      }
    }
  };

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
          {/* <button
            onClick={() => setMode('custom')}
            className={`flex items-center gap-2 px-6 py-2 rounded text-xs font-bold tracking-widest uppercase transition-all ${mode === 'custom' ? 'bg-purple-900/50 text-purple-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FaPython /> Custom
          </button> */}
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
                <PanelSlider label="Mix Damper" value={manualCmd.intakeOpening} onChange={(v: number) => updateManual('intakeOpening', v)} icon={GiValve} colorClass="text-slate-400" />
                <ToggleSwitch label="Cooling Coil" isBinary={true} value={manualCmd.coolingCoil} onChange={(v: number) => updateManual('coolingCoil', v)} icon={GiSnowflake2} colorClass="text-sky-400" />
                <ToggleSwitch label="Heating Coil" isBinary={true} value={manualCmd.heatingCoil} onChange={(v: number) => updateManual('heatingCoil', v)} icon={GiHotSurface} colorClass="text-red-400" disabled={true} />
                <ToggleSwitch label="Humidifier" isBinary={true} value={manualCmd.humidifier} onChange={(v: number) => updateManual('humidifier', v)} icon={GiWaterDrop} colorClass="text-blue-400" disabled={true} />
                <PanelSlider label="Main Blower" value={manualCmd.blower} onChange={(v: number) => updateManual('blower', v)} icon={FaSlidersH} colorClass="text-green-400" />
              </div>
            </div>

            <div>
              <h3 className="text-sm text-slate-400 font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Zone VAV Override</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <ControlKnob
                  label={`VAV`}
                  value={manualCmd.vav} onChange={(v: number) => updateManual(`vav`, v)}
                  icon={GiValve} colorClass="text-cyan-500" disabled={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* --- AUTO MODE --- */}
        {mode === 'auto' && (
          <div className="space-y-8 animate-in fade-in duration-300 w-full grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm text-emerald-500/80 font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Main Supply Targets</h3>
              <SetpointInput
                label="AHU Release"
                tempVal={setpoints.releaseAir.temp} co2Val={setpoints.releaseAir.co2}
                humVal={setpoints.releaseAir.hum}
                onTempChange={(v: number) => updateSetpoint('releaseAir', 'temp', v)}
                onCo2Change={(v: number) => updateSetpoint('releaseAir', 'co2', v)}
                onHumChange={(v: number) => updateSetpoint('releaseAir', 'hum', v)}
              />
            </div>

            <div>
              <h3 className="text-sm text-emerald-500/80 font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-6">
                Zone Setpoints
              </h3>

              {/* The Grid Container */}
              <div className="">
                {dynamicRooms.map((room, idx) => (
                  <SetpointInput
                    key={room}
                    label={`Zone ${idx + 1}`}
                    tempVal={setpoints[room].temp}
                    humVal={setpoints[room].hum}
                    co2Val={setpoints[room].co2}
                    onTempChange={(v: number) => updateSetpoint(room, 'temp', v)}
                    onHumChange={(v: number) => updateSetpoint(room, 'hum', v)} // Added handler
                    onCo2Change={(v: number) => updateSetpoint(room, 'co2', v)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}



      </div>
    </div>
  );
}

export default SystemControllerPanel;
