import { FaCircle, FaServer, FaCodeBranch, FaExclamationTriangle } from 'react-icons/fa';
import { useTelemetry } from '../utils/TelemetryContext';

const formatUptime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const Taskbar = () => {
  const {systemStatus, isConnected } = useTelemetry();
  return (
    <footer className="h-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 shrink-0 z-50 text-[11px] font-mono text-slate-400 tracking-wider">
      <div className="flex items-center gap-6">
        
        {isConnected ?
        <div className="flex items-center gap-2">
          <FaServer className="text-green-500" />
          <span>MQTT: CONNECTED</span>
        </div>
        :
        <div className="flex items-center gap-2">
          <FaServer className="text-rose-500" />
          <span >MQTT: DISCONNECTED</span>
        </div>
        }

        {systemStatus.online ? 
          <div className="flex items-center gap-2 text-green-500">
            <FaCircle className="animate-pulse text-[8px]" />
            <span>SYSTEM ONLINE</span>
          </div>
        :
          <div className="flex items-center gap-2 text-rose-500">
            <FaCircle className="animate-pulse text-[8px]" />
            <span>SYSTEM OFFLINE</span>
          </div>
        }

        <div className="flex items-center gap-2">
          <FaCodeBranch className="text-slate-500" />
          <span>MODE: AUTO </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors cursor-pointer">
          <FaExclamationTriangle />
          <span>ALARMS: 0</span>
        </div>
        <span>UPTIME: {formatUptime(systemStatus.uptime)}</span>
      </div>
    </footer>
  );
};

export default Taskbar;