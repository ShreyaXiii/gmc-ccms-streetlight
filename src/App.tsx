import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CCMSProvider, useCCMS } from './context/CCMSContext';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DemoControlBar } from './components/layout/DemoControlBar';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { MonitoringPage } from './pages/MonitoringPage';
import { Streetlights } from './pages/Streetlights';
import { StreetlightDetails } from './pages/StreetlightDetails';
import { MapPage } from './pages/MapPage';
import { FaultsPage } from './pages/FaultsPage';
import { EnergyPage } from './pages/EnergyPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { ControllersPage } from './pages/ControllersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { faults } = useCCMS();

  const [activePage, setActivePage] = useState<PageId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedLightId, setSelectedLightId] = useState<string>('SL-GMC-001');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">
            INITIALIZING MUNICIPAL CCMS CONTROL ROOM...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const unackFaultCount = faults.filter((f) => f.status === 'UNACKNOWLEDGED').length;

  const handleNavigateToDetails = (lightId: string) => {
    setSelectedLightId(lightId);
    setActivePage('details');
  };

  const handleNavigateToMap = (lightId?: string) => {
    if (lightId) setSelectedLightId(lightId);
    setActivePage('map');
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <Overview
            onNavigate={(page, extraId) => {
              if (extraId) setSelectedLightId(extraId);
              setActivePage(page);
            }}
          />
        );
      case 'monitoring':
        return <MonitoringPage />;
      case 'streetlights':
        return <Streetlights onNavigateToDetails={handleNavigateToDetails} />;
      case 'details':
        return (
          <StreetlightDetails
            lightId={selectedLightId}
            onBack={() => setActivePage('streetlights')}
            onNavigateToMap={handleNavigateToMap}
          />
        );
      case 'map':
        return (
          <MapPage
            onNavigateToDetails={handleNavigateToDetails}
            focusedLightId={selectedLightId}
          />
        );
      case 'faults':
        return <FaultsPage onNavigateToMaintenance={() => setActivePage('maintenance')} />;
      case 'energy':
        return <EnergyPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'controllers':
        return <ControllersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <Overview
            onNavigate={(page, extraId) => {
              if (extraId) setSelectedLightId(extraId);
              setActivePage(page);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100">
      {/* Top Demo Simulation Rig (Interactive Hardware Slider & Fault Switches) */}
      <DemoControlBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Municipal Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          unresolvedFaultCount={unackFaultCount}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Header */}
          <Header
            activePage={activePage}
            onOpenSidebar={() => setSidebarOpen(true)}
            onNavigateToFaults={() => setActivePage('faults')}
          />

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderActivePage()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CCMSProvider>
        <MainLayout />
      </CCMSProvider>
    </AuthProvider>
  );
}

