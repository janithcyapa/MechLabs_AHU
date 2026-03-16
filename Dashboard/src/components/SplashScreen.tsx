
import { useState, useEffect } from 'react';

const SplashScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 15 + 5;
        return Math.min(oldProgress + diff, 100);
      });
    }, 250);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center relative text-slate-200 font-sans">

      <div className="flex flex-col items-center z-10 w-full max-w-2xl px-6">
        
        <div className="w-32 h-32 mb-8 bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-slate-700 shadow-[0_0_30px_rgba(6,182,212,0.15)] p-2">
          <img 
            src="/uop.png" 
            alt="University of Peradeniya Logo" 
            className="w-full h-full object-contain"
            // Fallback text if image isn't found yet
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
          <span className="hidden text-xs text-slate-500 text-center">Add uop-logo.png to public folder</span>
        </div>

        {/* TITLES */}
        <h1 className="text-4xl md:text-4xl font-bold text-white tracking-widest text-center mb-3 drop-shadow-lg">
          HVAC CONTROL AND <br/> MONITORING SYSTEM
        </h1>

        <h2 className="text-lg md:text-xl text-cyan-500 uppercase tracking-widest text-center font-semibold mb-1">
          Department of Mechanical Engineering
        </h2>
        <h3 className="text-sm md:text-base text-slate-400 uppercase tracking-wider text-center mb-12">
          Faculty of Engineering • University of Peradeniya
        </h3>

        {/* LOADING BAR */}
        <div className="w-full max-w-md h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-cyan-500 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-4 text-xs text-slate-500 font-mono tracking-widest uppercase flex justify-between w-full max-w-md">
          <span>Initializing System...</span>
          <span>{Math.floor(progress)}%</span>
        </div>
      </div>

      {/* FOOTER CREDITS */}
      <div className="absolute bottom-8 flex flex-col items-center text-[11px] sm:text-xs text-slate-500 font-mono tracking-wider gap-1.5 z-10">
        <p className="border-b border-slate-800 pb-1">Developed by: W.S.P.Y.J.C. Yapa</p>
        <p>Supervised by: Dr. D.H.S. Maithripala</p>
      </div>
    </div>
  );
};

export default SplashScreen;
