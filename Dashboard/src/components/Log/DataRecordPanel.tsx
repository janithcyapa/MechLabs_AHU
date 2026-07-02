import { useState, useEffect } from "react";
import {
  FaPlay,
  FaStop,
  FaFileDownload,
  FaChartLine,
  FaTrashAlt,
  FaClock,
  FaExclamationTriangle,
  FaDatabase
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTelemetry } from "../../utils/TelemetryContext";
import {
  getExperiments,
  getExperimentData,
  deleteExperiment,
  type ExperimentMeta,
  type DataPoint,
} from "../../utils/db";

// Helper to flatten nested system data for recharts and tables
const flattenData = (data: any, prefix = ''): Record<string, number> => {
  let result: Record<string, number> = {};
  for (const key in data) {
    if (typeof data[key] === 'object' && data[key] !== null) {
      result = { ...result, ...flattenData(data[key], `${prefix}${key}_`) };
    } else if (typeof data[key] === 'number' || typeof data[key] === 'boolean') {
      result[`${prefix}${key}`] = Number(data[key]);
    }
  }
  return result;
};

// Generate a random stable color based on string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
};

export default function DataRecorderPanel() {
  const { isRecording, experimentName, startRecording, stopRecording, storageWarning } = useTelemetry();
  
  const [inputExpName, setInputExpName] = useState("");
  const [inputInterval, setInputInterval] = useState(10);
  
  const [experiments, setExperiments] = useState<ExperimentMeta[]>([]);
  const [selectedExp, setSelectedExp] = useState<string | null>(null);
  const [expData, setExpData] = useState<DataPoint[]>([]);
  
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Poll experiments list
  const fetchExperiments = async () => {
    try {
      const exps = await getExperiments();
      // Sort newest first
      exps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setExperiments(exps);
    } catch (e) {
      console.error("Failed to fetch experiments", e);
    }
  };

  useEffect(() => {
    fetchExperiments();
    const interval = setInterval(fetchExperiments, 2000);
    return () => clearInterval(interval);
  }, []);

  // Poll selected experiment data
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const fetchExpData = async () => {
      if (!selectedExp) return;
      try {
        const data = await getExperimentData(selectedExp);
        setExpData(data);
      } catch (e) {
        console.error("Failed to fetch experiment data", e);
      }
    };

    if (selectedExp) {
      fetchExpData();
      if (isRecording && experimentName === selectedExp) {
        interval = setInterval(fetchExpData, 2000);
      }
    } else {
      setExpData([]);
    }

    return () => clearInterval(interval);
  }, [selectedExp, isRecording, experimentName]);

  const handleStart = () => {
    if (!inputExpName.trim()) {
      alert("Please enter an experiment name.");
      return;
    }
    if (experiments.find(e => e.name === inputExpName)) {
      alert("Experiment name already exists.");
      return;
    }
    startRecording(inputExpName, inputInterval);
    setInputExpName("");
  };

  const handleDelete = async (name: string) => {
    if (confirm(`Are you sure you want to delete experiment "${name}"?`)) {
      await deleteExperiment(name);
      if (selectedExp === name) setSelectedExp(null);
      fetchExperiments();
    }
  };

  const handleDownloadCSV = async (name: string) => {
    const data = await getExperimentData(name);
    if (data.length === 0) {
      alert("No data available to download.");
      return;
    }
    
    const flat = data.map(dp => ({ timestamp: dp.timestamp, ...flattenData(dp.data) }));
    const headers = Object.keys(flat[0]).join(',');
    const rows = flat.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleVisualize = (name: string) => {
    setSelectedExp(name);
    setPage(0);
  };

  const toggleColumn = (col: string) => {
    setActiveColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // Prepare flattened data for charts/table
  const flatData = expData.map(dp => ({
    timeLabel: new Date(dp.timestamp).toLocaleTimeString(),
    fullTimestamp: dp.timestamp,
    ...flattenData(dp.data)
  }));
  
  const allAvailableColumns = flatData.length > 0 
    ? Object.keys(flatData[0]).filter(k => k !== 'timeLabel' && k !== 'fullTimestamp') 
    : [];

  const paginatedData = flatData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(flatData.length / rowsPerPage);

  return (
    <div className="flex flex-col gap-6 mt-8 animate-in fade-in duration-500">
      
      {storageWarning && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl flex items-center gap-3">
          <FaExclamationTriangle className="text-xl" />
          <span><strong>Storage Warning:</strong> IndexedDB quota is nearing its limit. Please export and delete old experiments.</span>
        </div>
      )}

      {/* --- CONFIGURATION SECTION --- */}
      <div className="bg-[#1a2332] p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row gap-6 items-end">
        
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <FaDatabase /> Experiment Name
          </label>
          <input
            type="text"
            placeholder="e.g., Cooling_Test_01"
            value={inputExpName}
            onChange={(e) => setInputExpName(e.target.value)}
            disabled={isRecording}
            className="w-full bg-[#0f172a] text-white px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="w-32 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <FaClock /> Interval (sec)
          </label>
          <input
            type="number"
            min="1"
            value={inputInterval}
            onChange={(e) => setInputInterval(Number(e.target.value))}
            disabled={isRecording}
            className="w-full bg-[#0f172a] text-white px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-cyan-500 transition-colors text-center font-mono"
          />
        </div>

        <div>
          {!isRecording ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              <FaPlay /> Start
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
            >
              <FaStop /> Stop
            </button>
          )}
        </div>
      </div>

      {/* --- EXPERIMENTS TABLE --- */}
      <div className="bg-[#1a2332] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="bg-[#0f172a] p-4 border-b border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Saved Experiments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-4 border-b border-slate-700">Name</th>
                <th className="p-4 border-b border-slate-700">Date/Time</th>
                <th className="p-4 border-b border-slate-700">Data Points</th>
                <th className="p-4 border-b border-slate-700">Status</th>
                <th className="p-4 border-b border-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No experiments recorded yet.</td>
                </tr>
              ) : (
                experiments.map((exp) => (
                  <tr key={exp.name} className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${selectedExp === exp.name ? 'bg-cyan-900/10' : ''}`}>
                    <td className="p-4 font-mono text-slate-200">{exp.name}</td>
                    <td className="p-4 text-xs text-slate-400">{new Date(exp.timestamp).toLocaleString()}</td>
                    <td className="p-4 font-mono text-cyan-400">{exp.datapointsCount}</td>
                    <td className="p-4">
                      {exp.status === 'recording' ? (
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1 animate-pulse"><div className="w-2 h-2 rounded-full bg-red-500"></div> Recording...</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-500">Completed</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleDownloadCSV(exp.name)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" title="Download CSV">
                        <FaFileDownload />
                      </button>
                      <button onClick={() => handleDelete(exp.name)} className="p-2 rounded-lg bg-slate-800 hover:bg-red-900/50 text-red-400 transition-colors" title="Delete">
                        <FaTrashAlt />
                      </button>
                      <button onClick={() => handleVisualize(exp.name)} className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors ${selectedExp === exp.name ? 'bg-cyan-600 text-white' : 'bg-cyan-900/30 text-cyan-400 hover:bg-cyan-800/50'}`}>
                        <FaChartLine className="inline mr-2"/> Visualize
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- VISUALIZATION SECTION --- */}
      {selectedExp && (
        <div className="bg-[#1a2332] rounded-2xl border border-slate-700 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-[#0f172a] p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-3">
                <FaChartLine className="text-cyan-500" /> Visualization
              </h3>
              <p className="text-xs text-cyan-400 mt-1 font-mono">{selectedExp} - {flatData.length} data points</p>
            </div>
          </div>

          <div className="p-6">
            
            {/* Column Selector */}
            <div className="mb-8">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Select Columns to Visualize</h4>
              <div className="flex flex-wrap gap-2">
                {allAvailableColumns.map(col => {
                  const isActive = activeColumns.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() => toggleColumn(col)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all border 
                      ${isActive
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "bg-slate-800/40 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Charts Grid */}
            {activeColumns.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                {activeColumns.map(col => (
                  <div key={col} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 h-64">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">{col}</h5>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={flatData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="timeLabel" stroke="#475569" fontSize={10} tickMargin={10} />
                        <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px" }}
                          itemStyle={{ color: "#e2e8f0" }}
                          labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                        />
                        <Line
                          type="monotone"
                          dataKey={col}
                          stroke={stringToColor(col)}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                          isAnimationActive={false} // Disable animation for performance on live update
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-32 bg-[#0f172a] rounded-xl border border-slate-800 border-dashed mb-8">
                <span className="text-slate-500 text-sm">Select columns above to display graphs</span>
              </div>
            )}

            {/* Paginated Raw Data Table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Raw Data ({flatData.length} total)</h4>
                
                <div className="flex gap-2">
                  <button 
                    disabled={page === 0} 
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded disabled:opacity-50"
                  >Prev</button>
                  <span className="text-xs text-slate-400 py-1">Page {page + 1} of {Math.max(1, totalPages)}</span>
                  <button 
                    disabled={page >= totalPages - 1} 
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded disabled:opacity-50"
                  >Next</button>
                </div>
              </div>
              
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-900 text-[10px] uppercase tracking-widest text-slate-400">
                      <th className="p-3 border-b border-slate-700 sticky left-0 bg-slate-900">Timestamp</th>
                      {activeColumns.map(col => (
                        <th key={col} className="p-3 border-b border-slate-700">{col}</th>
                      ))}
                      {activeColumns.length === 0 && (
                        <th className="p-3 border-b border-slate-700">Select columns to view data</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-[11px] text-slate-400 sticky left-0 bg-[#1a2332]">{row.timeLabel}</td>
                        {activeColumns.map(col => (
                          <td key={col} className="p-3 font-mono text-[11px] text-cyan-400">{(row[col] as number)?.toFixed(3) ?? '-'}</td>
                        ))}
                        {activeColumns.length === 0 && <td></td>}
                      </tr>
                    ))}
                    {paginatedData.length === 0 && (
                      <tr><td colSpan={activeColumns.length + 1} className="p-4 text-center text-slate-500">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}