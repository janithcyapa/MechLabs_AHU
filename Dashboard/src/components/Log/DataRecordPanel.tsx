import { useState, useEffect } from 'react';
import { FaDatabase, FaPlay, FaStop, FaFileDownload, FaChartLine, FaTrashAlt, FaClock } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Types & Categories ---
const CATEGORIES = {
    ambient: { label: "Ambient", sensors: ["amb_t", "amb_h", "amb_co2", "amb_p"] },
    return: { label: "Return Air", sensors: ["ret_t", "ret_h", "ret_p"] },
    mixed: { label: "Mixed Air", sensors: ["mix_t", "mix_h", "mix_p"] },
    cooled: { label: "Cooled Air", sensors: ["cool_t", "cool_h"] },
    heated: { label: "Heated Air", sensors: ["heat_t", "heat_h"] },
    release: { label: "Release Air", sensors: ["rel_t", "rel_h", "rel_co2"] },
    rooms: { label: "Zones/Rooms", sensors: ["r1_t", "r1_co2", "r2_t", "r2_co2"] },
    controls: { label: "Control Signals", sensors: ["fan_cmd", "cool_cmd", "heat_cmd", "vav1_cmd", "vav2_cmd"] }
};

export default function DataRecorderPanel() {
    const [isRecording, setIsRecording] = useState(false);
    const [timeStep, setTimeStep] = useState(10); // Default to 10 seconds
    const [activeCategories, setActiveCategories] = useState<string[]>(['ambient', 'controls']);
    const [chartData, setChartData] = useState<any[]>([]);

    const toggleCategory = (cat: string) => {
        setActiveCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const resetData = () => {
        if (window.confirm("Clear all recorded buffer?")) setChartData([]);
    };

    // Recording Logic
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                const timestamp = new Date().toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                });

                setChartData(prev => {
                    const newData = [...prev, {
                        time: timestamp,
                        ...Object.values(CATEGORIES).flatMap(c => c.sensors).reduce((acc, s) => ({
                            ...acc, [s]: Math.floor(Math.random() * 100) // Replace with real sensor state
                        }), {})
                    }];
                    // Optional: Keep only last 50 points to prevent browser lag during long runs
                    return newData.slice(-50);
                });
            }, timeStep * 1000); // Seconds to ms
        }
        return () => clearInterval(interval);
    }, [isRecording, timeStep]);

    const saveToCSV = () => {
        if (chartData.length === 0) return;
        const headers = ["Time", ...Object.values(CATEGORIES).flatMap(c => c.sensors)].join(",");
        const rows = chartData.map(d => [d.time, ...Object.values(CATEGORIES).flatMap(c => c.sensors).map(s => d[s])].join(","));
        const blob = new Blob([[headers, ...rows].join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HVAC_Log_${new Date().toISOString()}.csv`;
        a.click();
    };

    return (
        <div className="flex flex-col gap-6 mt-8 animate-in fade-in duration-500">

            {/* CONFIGURATION BAR */}
            <div className="flex flex-col xl:flex-row gap-4 w-full ">

                {/* Category Selection */}
                <div className="flex flex-col xl:flex-row gap-4 w-full ">

                    {/* Category Selection (Same as before) */}
                    <div className="flex-1 bg-[#1a2332] p-4 rounded-xl border border-slate-700 shadow-lg">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FaDatabase className="text-cyan-500" /> Sensor Groups
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(CATEGORIES).map(([key, cat]) => (
                                <button
                                    key={key}
                                    onClick={() => toggleCategory(key)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border 
                  ${activeCategories.includes(key)
                                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                            : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Step (Input Box) & Actions */}
                    <div className="bg-[#1a2332] p-4 rounded-xl border border-slate-700 shadow-lg flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <FaClock /> Interval (sec)
                            </span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={timeStep}
                                    onChange={(e) => setTimeStep(Math.max(1, Number(e.target.value)))}
                                    className="no-spinner w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-400 outline-none focus:border-cyan-500/50 transition-colors text-center"
                                />
                                {isRecording && (
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping ml-1" />
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 h-9 items-center mt-4">
                            <button
                                onClick={() => setIsRecording(!isRecording)}
                                className={`px-4 h-full rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg
                ${!isRecording ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}
                            >
                                {isRecording ? <><FaStop className="text-[8px]" /> Stop</> : <><FaPlay className="text-[8px]" /> Start</>}
                            </button>

                            <button onClick={resetData} className="w-9 h-9 flex items-center justify-center bg-slate-800/50 hover:bg-red-900/20 text-slate-500 hover:text-red-400 rounded-lg border border-slate-700 transition-colors" title="Reset Buffer">
                                <FaTrashAlt size={12} />
                            </button>

                            <button onClick={saveToCSV} disabled={chartData.length === 0} className="w-9 h-9 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700 text-slate-400 rounded-lg border border-slate-700 disabled:opacity-30 transition-colors">
                                <FaFileDownload size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* GRAPH GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeCategories.map((catKey) => {
                    const cat = (CATEGORIES as any)[catKey];
                    return (
                        <div key={catKey} className="bg-[#1a2332] p-5 rounded-2xl border border-slate-700 shadow-xl min-h-75 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FaChartLine className="text-cyan-500" /> {cat.label} Trend
                                </h3>
                                <span className="text-[9px] font-mono text-slate-600 uppercase">Live Buffer: {chartData.length} pts</span>
                            </div>

                            <div className="flex-1 w-full min-h-50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="time" stroke="#475569" fontSize={9} tickMargin={10} hide={chartData.length === 0} />
                                        <YAxis stroke="#475569" fontSize={9} domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                        {cat.sensors.map((s: string, i: number) => (
                                            <Line
                                                key={s} type="monotone" dataKey={s}
                                                stroke={[`#06b6d4`, `#10b981`, `#f43f5e`, `#8b5cf6`, `#f59e0b`][i % 5]}
                                                strokeWidth={2} dot={false} isAnimationActive={false}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    );
                })}

                {activeCategories.length === 0 && (
                    <div className="col-span-full h-64 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 text-xs uppercase tracking-widest">
                        Select a sensor group to display charts
                    </div>
                )}
            </div>
        </div>
    );
}