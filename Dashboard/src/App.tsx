import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SplashScreen from './components/SplashScreen';
import AHUDashboard from './pages/LiveMonitor';
import Header from './components/Header';
import Taskbar from './components/TaskBar';

const DataRecording = () => <div className="p-8 text-slate-300"><h2>Data Recording Module (Placeholder)</h2><p>Live dash and graphs go here.</p></div>;
const ControlLogic = () => <div className="p-8 text-slate-300"><h2>Custom Python Control Logics (Placeholder)</h2><p>Logic upload and execution interface goes here.</p></div>;
const Credits = () => <div className="p-8 text-slate-300"><h2>Credits & Documentation</h2><p>Developed by: W.S.P.Y.J.C.Yapa</p><p>Supervised by: Dr. DHS Maithreepala</p></div>;


const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-[#111827] overflow-hidden">
      <Header />
      
      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        {children}
      </main>

      <Taskbar />
    </div>
  );
};


export default function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const bootSequence = setTimeout(() => {
      setIsBooting(false);
    }, 3500);
    return () => clearTimeout(bootSequence);
  }, []);

  if (isBooting) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<AHUDashboard />} />
          <Route path="/recording" element={<DataRecording />} />
          <Route path="/logic" element={<ControlLogic />} />
          <Route path="/credits" element={<Credits />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}