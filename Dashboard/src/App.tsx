import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SplashScreen from './components/SplashScreen';
import AHUDashboard from './pages/LiveMonitor';
import Header from './components/Header';
import Taskbar from './components/TaskBar';
import SystemController from './pages/ControlPanel';
import DataRecorder from './pages/DataRecord';
import ProjectCredits from './pages/Credit';


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
          <Route path="/recording" element={<DataRecorder />} />
          <Route path="/control" element={<SystemController />} />
          <Route path="/credits" element={<ProjectCredits />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}