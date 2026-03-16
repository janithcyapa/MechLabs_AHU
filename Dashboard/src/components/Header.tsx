import { NavLink } from 'react-router-dom';


const Header = () => {
  // Modern pill-style navigation links with a subtle neon glow when active
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `relative px-5 py-2 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded-full flex items-center gap-2 ${
      isActive 
        ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
    }`;

  return (
    <header className="h-16 bg-[#0f172a]/80 backdrop-blur-md  flex items-center justify-between px-8 shrink-0 z-50 shadow-lg relative overflow-hidden">
      
      {/* Brand & Logo */}
      <div className="flex items-center gap-5 relative z-10">
        {/* Logo with the splash screen glow effect */}
        <div className="w-14 h-14 bg-slate-800/60 rounded-full flex items-center justify-center border border-slate-700 shadow-[0_0_20px_rgba(6,182,212,0.2)] p-1.5">
          <img src="/uop.png" alt="UoP Logo" className="w-full h-full object-contain drop-shadow-md" />
        </div>
        
        <div className="flex flex-col justify-center">
          <h1 className="text-white font-bold text-xl uppercase drop-shadow-md">
            HVAC Control System
          </h1>
          <span className="text-cyan-500 text-xs tracking-widest uppercase opacity-90">
            Dept. of Mechanical Engineering
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-3 relative z-10">
        <NavLink to="/" className={navLinkClass}>
          Live Monitor
        </NavLink>
        <NavLink to="/recording" className={navLinkClass}>
          Data Recording
        </NavLink>
        <NavLink to="/logic" className={navLinkClass}>
          Control Logics
        </NavLink>
        <NavLink to="/credits" className={navLinkClass}>
          Credits
        </NavLink>
      </nav>

    </header>
  );
};


export default Header;