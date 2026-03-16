import { FaCircle, FaServer, FaCodeBranch, FaExclamationTriangle } from 'react-icons/fa';


const Taskbar = () => {
  // You can later pass real system state props here from your IoT backend
  return (
    <footer className="h-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 shrink-0 z-50 text-[11px] font-mono text-slate-400 tracking-wider">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-green-500">
          <FaCircle className="animate-pulse text-[8px]" />
          <span>SYSTEM ONLINE</span>
        </div>
        <div className="flex items-center gap-2">
          <FaServer className="text-slate-500" />
          <span>MQTT: CONNECTED</span>
        </div>
        <div className="flex items-center gap-2">
          <FaCodeBranch className="text-slate-500" />
          <span>MODE: AUTO / PID Active</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors cursor-pointer">
          <FaExclamationTriangle />
          <span>ALARMS: 0</span>
        </div>
        <span>UPTIME: 04:12:45</span>
      </div>
    </footer>
  );
};

export default Taskbar;