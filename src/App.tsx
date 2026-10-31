import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CCMSProvider, useCCMS } from './context/CCMSContext';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DemoControlBar } from './components/layout/DemoControlBar';
import { LandingPage } from './pages/LandingPage';
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
import { ShieldAlert } from 'lucide-react';
import { UserRole } from './types/auth';

const ALLOWED_OPERATOR_PAGES: PageId[] = ['map', 'streetlights', 'details', 'faults'];

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const { faults } = useCCMS();

  // Root view mode: 'landing' (the official public landing page) or 'dashboard'
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== 'home' && hash !== 'landing') {
      return 'dashboard';
    }
    return 'landing';
  });

  // Initial dashboard page: Admin starts at Overview, Operator starts at Gandhidham Map
  const [activePage, setActivePage] = useState<PageId>(() => (isAdmin ? 'overview' : 'map'));
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedLightId, setSelectedLightId] = useState<string>('SL-GMC-001');

  // Enforce role-based route guard and URL sync
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageId | 'home' | 'landing' | 'dashboard';
      if (!hash || hash === 'home' || hash === 'landing') {
        setViewMode('landing');
      } else {
        setViewMode('dashboard');
        const targetPage = hash === 'dashboard' ? (isAdmin ? 'overview' : 'map') : (hash as PageId);
        if (!isAdmin && !ALLOWED_OPERATOR_PAGES.includes(targetPage)) {
          setActivePage('map');
          window.location.hash = 'map';
        } else {
          setActivePage(targetPage);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdmin]);

  // Synchronize active page when authentication state or role updates
  useEffect(() => {
    if (viewMode === 'dashboard') {
      if (!isAdmin && !ALLOWED_OPERATOR_PAGES.includes(activePage)) {
        setActivePage('map');
        window.location.hash = 'map';
      }
    }
  }, [isAdmin, viewMode]);

  // Handle dashboard page navigation
  const handlePageChange = (newPage: PageId) => {
    if (!isAdmin && !ALLOWED_OPERATOR_PAGES.includes(newPage)) {
      setActivePage('map');
      window.location.hash = 'map';
      return;
    }
    setActivePage(newPage);
    window.location.hash = newPage;
  };

  const handleEnterDashboard = (roleOverride?: UserRole) => {
    setViewMode('dashboard');
    const role = roleOverride || (isAdmin ? 'administrator' : (user?.role || 'operator'));
    const defaultPage = role === 'administrator' ? 'overview' : 'map';
    setActivePage(defaultPage);
    window.location.hash = defaultPage;
  };

  const handleOpenMapFromLanding = () => {
    setViewMode('dashboard');
    setActivePage('map');
    window.location.hash = 'map';
  };

  const handleReturnToLanding = () => {
    setViewMode('landing');
    window.location.hash = 'home';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#03152D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-300 font-mono tracking-wider">
            INITIALIZING MUNICIPAL CCMS CONTROL ROOM...
          </p>
        </div>
      </div>
    );
  }

  // 1. If currently in Landing Page mode, render the exact GMC CCMS Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onEnterDashboard={handleEnterDashboard}
        onOpenMap={handleOpenMapFromLanding}
      />
    );
  }

  // 2. If in Dashboard mode but unauthenticated, render the full Login / Registration portal
  if (!isAuthenticated) {
    return <Login onReturnToLanding={handleReturnToLanding} />;
  }

  const unackFaultCount = faults.filter((f) => f.status === 'UNACKNOWLEDGED').length;

  const handleNavigateToDetails = (lightId: string) => {
    setSelectedLightId(lightId);
    handlePageChange('details');
  };

  const handleNavigateToMap = (lightId?: string) => {
    if (lightId) setSelectedLightId(lightId);
    handlePageChange('map');
  };

  const renderActivePage = () => {
    // Role-based authorization gate: operators cannot view admin pages
    if (!isAdmin && !ALLOWED_OPERATOR_PAGES.includes(activePage)) {
      return (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-8 text-center my-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Administrator Privileges Required</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Your current account ({user?.email}) has the <span className="font-semibold text-cyan-400">Field Operator</span> role. Access to municipal settings, analytics, reports, maintenance, and hardware management is restricted to Administrators.
          </p>
          <button
            onClick={() => handlePageChange('map')}
            className="mt-5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all"
          >
            Return to Gandhidham Map
          </button>
        </div>
      );
    }

    switch (activePage) {
      case 'overview':
        return (
          <Overview
            onNavigate={(page, extraId) => {
              if (extraId) setSelectedLightId(extraId);
              handlePageChange(page);
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
            onBack={() => handlePageChange('streetlights')}
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
        return <FaultsPage onNavigateToMaintenance={() => handlePageChange(isAdmin ? 'maintenance' : 'faults')} />;
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
        return isAdmin ? (
          <Overview
            onNavigate={(page, extraId) => {
              if (extraId) setSelectedLightId(extraId);
              handlePageChange(page);
            }}
          />
        ) : (
          <MapPage
            onNavigateToDetails={handleNavigateToDetails}
            focusedLightId={selectedLightId}
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
          setActivePage={handlePageChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          unresolvedFaultCount={unackFaultCount}
          onNavigateToLanding={handleReturnToLanding}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Header */}
          <Header
            activePage={activePage}
            onOpenSidebar={() => setSidebarOpen(true)}
            onNavigateToFaults={() => handlePageChange('faults')}
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
