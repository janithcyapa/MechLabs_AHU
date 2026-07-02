import HVAC_SCADA from "../components/HVAC_SCADA";
import HVAC_CONTROLLER from "../components/HVAC_CONTROLLER";
import InformationWidget from "../components/InformationWidget";

export default function Dashboard() {
  // const { hvacData, isConnected , actuators} = useTelemetry();
  return (
    <div className="min-h-screen container mx-auto bg-[#111827] text-slate-300 p-8 font-sans selection:bg-cyan-900">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h1 className="text-xl font-bold text-white  flex items-center gap-3 uppercase">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Monitoring
          </h1>
          <p className="text-slate-500 text-sm ml-6 uppercase tracking-wider font-mono">Dashboard</p>
        </div>
        <div className="flex-1"></div>
        <InformationWidget />
      </div>

      <HVAC_SCADA />
      <HVAC_CONTROLLER />
    </div>
  );
}

