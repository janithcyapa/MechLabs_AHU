import { useState, useEffect } from "react";
import AmbientAirCluster from "../components/AHU/AmbientAirCluster";
import ModeSelector from "../components/Control/ControlToggle";
import DataRecorderPanel from "../components/Log/DataRecordPanel";
import DataRecordController from "../components/Log/LogWidget";

export default function DataRecorder() {
  const [mode, setMode] = useState<'manual' | 'auto' | 'custom'>('manual');
  
  // State for DataRecordController
  const [isRecording, setIsRecording] = useState(false);
  const [timeStep, setTimeStep] = useState(10);
  const [dataCount, setDataCount] = useState(0);

  // Sync with DataRecorderPanel logic or centralize state
  // For now, we provide the required props to fix the type error
  const handleReset = () => {
    if (window.confirm("Clear all recorded buffer?")) {
      setDataCount(0);
      // This should ideally trigger a reset in DataRecorderPanel
    }
  };

  const handleSave = () => {
    // Trigger CSV download logic
    const event = new CustomEvent('trigger-csv-download');
    window.dispatchEvent(event);
  };

  // Mock data count increment if recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setDataCount(prev => prev + 1);
      }, timeStep * 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, timeStep]);

  return (
    <div className="min-h-screen container mx-auto bg-[#111827] text-slate-300 p-8 font-sans selection:bg-cyan-900">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h1 className="text-xl font-bold text-white  flex items-center gap-3 uppercase">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Data Record
          </h1>
          <p className="text-slate-500 text-sm ml-6 uppercase tracking-wider font-mono">RECORDE AND SAVE DATA</p>
        </div>
        <div className="flex-1"></div>
        {/* <DataRecordController 
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          timeStep={timeStep}
          setTimeStep={setTimeStep}
          dataCount={dataCount}
          onReset={handleReset}
          onSave={handleSave}
        /> */}
        <ModeSelector/>
        <AmbientAirCluster />
      </div>

      <DataRecorderPanel />
    </div>
  );
}
