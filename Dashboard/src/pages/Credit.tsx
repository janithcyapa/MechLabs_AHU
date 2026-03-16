import { FaGithub, FaBook, FaUserTie, FaUniversity, FaMicrochip } from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function ProjectCredits() {

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8 animate-in fade-in duration-700">
      <div className="max-w-4xl w-full bg-[#1a2332] rounded-3xl border border-slate-700 shadow-2xl overflow-hidden relative">
        
        {/* Top Decorative Banner */}
        <div className="h-2 bg-linear-to-r from-cyan-500 via-emerald-500 to-purple-500"></div>

        <div className="p-10 md:p-16 flex flex-col items-center text-center">
          
          {/* Engineering Crest / Icon */}
          <div className="w-20 h-20 rounded-2xl bg-[#111827] border border-slate-700 flex items-center justify-center mb-8 shadow-xl">
             <HiOutlineAcademicCap className="text-4xl text-cyan-400" />
          </div>

          {/* Project Title */}
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase mb-4">
            Decentralized Control Architecture <br /> 
            <span className="text-cyan-500">for Multi-Zone HVAC Systems</span>
          </h1>
          
          <p className="text-slate-400 font-mono text-sm max-w-2xl mb-12 leading-relaxed">
            A research project focused on distributed intelligence, multi-agent coordination, 
            and real-time environmental optimization for large-scale building automation.
          </p>

          {/* Primary Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
            
            {/* Student Info */}
            <div className="bg-[#111827]/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                <FaMicrochip className="text-cyan-500" /> Developed By
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">W.S.P.Y. Janith c. Yapa</h2>
              <span className="text-cyan-400 font-mono text-sm mt-1">E/20/452</span>
            </div>

            {/* Supervisor Info */}
            <div className="bg-[#111827]/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                <FaUserTie className="text-emerald-500" /> Supervised By
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">Dr. D.H.S. Maithripala</h2>
              <span className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Faculty of Engineering</span>
            </div>

          </div>

          {/* Department Footer */}
          <div className="flex items-center gap-3 text-slate-500 mb-12">
            <FaUniversity />
            <span className="text-xs font-bold uppercase tracking-widest">
              Dept. of Mechanical Engineering • University of Peradeniya
            </span>
          </div>

          {/* Documentation Links */}
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://github.com/your-username/hvac-decentralized" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-[#0d1117] border border-slate-700 rounded-xl hover:border-cyan-500 text-slate-300 hover:text-white transition-all group"
            >
              <FaGithub className="text-xl group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Source Code</div>
                <div className="text-xs font-mono">github.com/hvac-data</div>
              </div>
            </a>

            <a 
              href="/user-guide.pdf" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-[#0d1117] border border-slate-700 rounded-xl hover:border-emerald-500 text-slate-300 hover:text-white transition-all group"
            >
              <FaBook className="text-xl group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Documentation</div>
                <div className="text-xs font-mono">User Guide • v1.0</div>
              </div>
            </a>
          </div>

        </div>

        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[120px] pointer-events-none"></div>
      </div>
    </div>
  );
}