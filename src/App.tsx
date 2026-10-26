import React, { useState, useEffect, useMemo } from 'react';
import {
  DatabaseState,
  FilterState,
  UserRole,
  UserProfile,
  VentaRecord,
  ObjetivoRecord,
  AuditLog
} from './types/commercial';
import { loadDatabase } from './services/dbStore';
import {
  filterVentas,
  filterObjetivos,
  filterCobertura,
  calculateKPIs,
  aggregateByDimension,
  getHistoricalTimeline
} from './services/calculations';
import { testSupabaseConnection } from './services/supabaseClient';
import { getStoredSession, logoutUser } from './services/authService';
import { AppTheme } from './styles/theme';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalFilters } from './components/GlobalFilters';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { DimensionalAnalysis } from './components/DimensionalAnalysis';
import { SalesIntelligenceView } from './components/analytics/SalesIntelligenceView';
import { CoverageIntelligenceView } from './components/analytics/CoverageIntelligenceView';
import { RankingsView } from './components/RankingsView';
import { HistoricalComparison } from './components/HistoricalComparison';
import { DataManagement } from './components/DataManagement';
import { AuditLogView } from './components/AuditLogView';
import { SupabaseConfigView } from './components/SupabaseConfigView';
import { UserManagementView } from './components/UserManagementView';
import { LoginScreen } from './components/LoginScreen';
import { Shield } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getStoredSession());
  const [dbState, setDbState] = useState<DatabaseState>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [theme, setTheme] = useState<AppTheme>('dark');

  // Initial Filter State
  const [filters, setFilters] = useState<FilterState>({
    periodo: 'sept-26',
    zona: 'TODAS',
    supervisor: 'TODOS',
    codigoRuta: 'TODAS',
    producto: 'TODOS',
    vendedor: 'TODOS',
    busqueda: ''
  });

  // Check Supabase connection on mount
  useEffect(() => {
    testSupabaseConnection().then(res => {
      setSupabaseConnected(res.connected);
    });
  }, []);

  // Compute available filter options dynamically from data
  const {
    availablePeriods,
    availableZonas,
    availableSupervisores,
    availableRutas,
    availableProductos,
    availableVendedores
  } = useMemo(() => {
    const pSet = new Set<string>();
    const zSet = new Set<string>();
    const sSet = new Set<string>();
    const rSet = new Set<string>();
    const prSet = new Set<string>();
    const vSet = new Set<string>();

    dbState.ventas.forEach((v: VentaRecord) => {
      if (v.periodo_mes) pSet.add(v.periodo_mes);
      if (v.zona) zSet.add(v.zona);
      if (v.supervisor) sSet.add(v.supervisor);
      if (v.codigo_ruta) rSet.add(v.codigo_ruta);
      if (v.producto) prSet.add(v.producto);
      if (v.vendedor) vSet.add(v.vendedor);
    });

    dbState.objetivos.forEach((o: ObjetivoRecord) => {
      if (o.periodo_mes) pSet.add(o.periodo_mes);
      if (o.zona) zSet.add(o.zona);
      if (o.supervisor) sSet.add(o.supervisor);
      if (o.codigo_ruta) rSet.add(o.codigo_ruta);
      if (o.producto) prSet.add(o.producto);
      if (o.vendedor) vSet.add(o.vendedor);
    });

    return {
      availablePeriods: Array.from(pSet),
      availableZonas: Array.from(zSet).sort(),
      availableSupervisores: Array.from(sSet).sort(),
      availableRutas: Array.from(rSet).sort(),
      availableProductos: Array.from(prSet).sort(),
      availableVendedores: Array.from(vSet).sort()
    };
  }, [dbState]);

  // Filtered records
  const filteredVentas = useMemo(() => filterVentas(dbState.ventas, filters), [dbState.ventas, filters]);
  const filteredObjetivos = useMemo(() => filterObjetivos(dbState.objetivos, filters), [dbState.objetivos, filters]);
  const filteredCobertura = useMemo(() => filterCobertura(dbState.cobertura, filters), [dbState.cobertura, filters]);

  // Executive KPIs
  const isProductFiltered = filters.producto !== 'TODOS';
  const kpis = useMemo(
    () => calculateKPIs(filteredVentas, filteredObjetivos, filteredCobertura, isProductFiltered),
    [filteredVentas, filteredObjetivos, filteredCobertura, isProductFiltered]
  );

  // Dimensional Aggregations
  const zoneAggs = useMemo(
    () => aggregateByDimension('zona', filteredVentas, filteredObjetivos, filteredCobertura),
    [filteredVentas, filteredObjetivos, filteredCobertura]
  );

  const supervisorAggs = useMemo(
    () => aggregateByDimension('supervisor', filteredVentas, filteredObjetivos, filteredCobertura),
    [filteredVentas, filteredObjetivos, filteredCobertura]
  );

  const routeAggs = useMemo(
    () => aggregateByDimension('codigo_ruta', filteredVentas, filteredObjetivos, filteredCobertura),
    [filteredVentas, filteredObjetivos, filteredCobertura]
  );

  const productAggs = useMemo(
    () => aggregateByDimension('producto', filteredVentas, filteredObjetivos, filteredCobertura),
    [filteredVentas, filteredObjetivos, filteredCobertura]
  );

  const vendorAggs = useMemo(
    () => aggregateByDimension('vendedor', filteredVentas, filteredObjetivos, filteredCobertura),
    [filteredVentas, filteredObjetivos, filteredCobertura]
  );

  // Timeline
  const timeline = useMemo(
    () => getHistoricalTimeline(dbState.ventas, dbState.objetivos, dbState.cobertura, filters),
    [dbState.ventas, dbState.objetivos, dbState.cobertura, filters]
  );

  // Route Protection: If non-admin attempts to access admin tabs, redirect immediately to 'overview'
  useEffect(() => {
    const adminTabs: ActiveTab[] = ['import', 'users', 'audit', 'supabase'];
    if (currentUser && currentUser.role !== 'admin' && adminTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActiveTab('overview');
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Cross-filtering shortcuts
  const handleSelectZone = (zone: string) => {
    setFilters(prev => ({ ...prev, zona: zone }));
  };

  const handleSelectProduct = (product: string) => {
    setFilters(prev => ({ ...prev, producto: product }));
  };

  const handleSelectRoute = (route: string) => {
    setFilters(prev => ({ ...prev, codigoRuta: route }));
  };

  const handleSelectSupervisor = (supervisor: string) => {
    setFilters(prev => ({ ...prev, supervisor: supervisor }));
  };

  const handleSelectVendor = (vendor: string) => {
    setFilters(prev => ({ ...prev, vendedor: vendor }));
  };

  // Authentication gate: Render login screen if no authenticated user session
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        supabaseConnected={supabaseConnected}
      />
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'light' ? 'theme-light bg-[#F8FAFC] text-[#0F172A]' : 'bg-[#111827] text-[#F9FAFB]'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        supabaseConnected={supabaseConnected}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Analysis Surface */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          currentPeriod={filters.periodo}
          currentUser={currentUser}
          onLogout={handleLogout}
          supabaseConnected={supabaseConnected}
          ventas={filteredVentas}
          objetivos={filteredObjetivos}
          cobertura={filteredCobertura}
          onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
          isFiltersOpen={isFiltersOpen}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Collapsible Global Filters */}
            {['overview', 'sales', 'goals', 'coverage', 'rankings'].includes(activeTab) && isFiltersOpen && (
              <GlobalFilters
                filters={filters}
                onFilterChange={setFilters}
                availablePeriods={availablePeriods}
                availableZonas={availableZonas}
                availableSupervisores={availableSupervisores}
                availableRutas={availableRutas}
                availableProductos={availableProductos}
                availableVendedores={availableVendedores}
                totalRecordsMatching={{
                  ventas: filteredVentas.length,
                  objetivos: filteredObjetivos.length,
                  cobertura: filteredCobertura.length
                }}
              />
            )}

            {/* TAB 1: OVERVIEW / EXECUTIVE DASHBOARD */}
            {activeTab === 'overview' && (
              <ExecutiveDashboard
                kpis={kpis}
                filters={filters}
                zoneAggs={zoneAggs}
                supervisorAggs={supervisorAggs}
                productAggs={productAggs}
                routeAggs={routeAggs}
                timeline={timeline}
                totalVentasCount={filteredVentas.length}
                supabaseConnected={supabaseConnected}
                onSelectPeriod={p => setFilters({ ...filters, periodo: p })}
                onSelectZone={handleSelectZone}
                onSelectProduct={handleSelectProduct}
                onSelectRoute={handleSelectRoute}
                onSelectSupervisor={handleSelectSupervisor}
              />
            )}

            {/* TAB 2: SALES INTELLIGENCE STUDIO */}
            {activeTab === 'sales' && (
              <SalesIntelligenceView
                productAggs={productAggs}
                routeAggs={routeAggs}
                zoneAggs={zoneAggs}
                kpis={kpis}
                onSelectProduct={handleSelectProduct}
                onSelectRoute={handleSelectRoute}
              />
            )}

            {/* TAB 3: OBJETIVOS & CUMPLIMIENTO / DIMENSIONAL */}
            {activeTab === 'goals' && (
              <DimensionalAnalysis
                zoneAggs={zoneAggs}
                supervisorAggs={supervisorAggs}
                routeAggs={routeAggs}
                productAggs={productAggs}
                vendorAggs={vendorAggs}
              />
            )}

            {/* TAB 4: COBERTURA STUDIO */}
            {activeTab === 'coverage' && (
              <CoverageIntelligenceView
                routeAggs={routeAggs}
                supervisorAggs={supervisorAggs}
                zoneAggs={zoneAggs}
                kpis={kpis}
                onSelectRoute={handleSelectRoute}
              />
            )}

            {/* TAB 5: RANKINGS & PARETO */}
            {activeTab === 'rankings' && (
              <RankingsView
                vendorAggs={vendorAggs}
                routeAggs={routeAggs}
                productAggs={productAggs}
                supervisorAggs={supervisorAggs}
                onSelectVendor={handleSelectVendor}
                onSelectRoute={handleSelectRoute}
              />
            )}

            {/* TAB 6: HISTORIAL & COMPARATIVAS (MoM & YoY) */}
            {activeTab === 'history' && (
              <HistoricalComparison
                timeline={timeline}
                currentPeriod={filters.periodo}
                onSelectPeriod={p => setFilters({ ...filters, periodo: p })}
              />
            )}

            {/* TAB 7: DATA MANAGEMENT / IMPORT (ADMIN ONLY) */}
            {activeTab === 'import' && currentUser.role === 'admin' && (
              <DataManagement
                dbState={dbState}
                onUpdateDbState={setDbState}
                userRole={currentUser.role}
                onSwitchToAudit={() => setActiveTab('audit')}
                onSwitchToDashboard={(targetPeriod) => {
                  if (targetPeriod) {
                    setFilters(prev => ({ ...prev, periodo: targetPeriod }));
                  }
                  setActiveTab('overview');
                }}
              />
            )}

            {/* TAB: USER MANAGEMENT (ADMIN ONLY) */}
            {activeTab === 'users' && currentUser.role === 'admin' && (
              <UserManagementView
                currentUser={currentUser}
                onAuditAction={(action, details) => {
                  const newLog: AuditLog = {
                    id: `log-${Date.now()}`,
                    action: action as any,
                    details: details,
                    user_email: currentUser.email,
                    user_role: currentUser.role,
                    created_at: new Date().toISOString()
                  };
                  setDbState(prev => ({
                    ...prev,
                    auditLogs: [newLog, ...prev.auditLogs]
                  }));
                }}
              />
            )}

            {/* TAB 8: AUDITORÍA (ADMIN ONLY) */}
            {activeTab === 'audit' && currentUser.role === 'admin' && (
              <AuditLogView
                batches={dbState.batches}
                auditLogs={dbState.auditLogs}
              />
            )}

            {/* TAB 9: SUPABASE & SQL (ADMIN ONLY) */}
            {activeTab === 'supabase' && currentUser.role === 'admin' && (
              <SupabaseConfigView
                dbState={dbState}
                onUpdateDbState={setDbState}
                onConnectionStatusChange={setSupabaseConnected}
              />
            )}

            {/* Access Denied Guard for Commercial Role attempting restricted routes */}
            {['import', 'users', 'audit', 'supabase'].includes(activeTab) && currentUser.role !== 'admin' && (
              <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-8 text-center shadow-lg">
                <Shield className="mx-auto h-12 w-12 text-[#EF4444] mb-3" />
                <h2 className="text-lg font-bold text-[#F9FAFB]">ACCESO RESTRINGIDO (403)</h2>
                <p className="mt-2 text-xs text-[#9CA3AF] max-w-lg mx-auto leading-relaxed">
                  Este módulo requiere permisos administrativos. Tu cuenta actual (<span className="text-[#F9FAFB] font-mono">{currentUser.email}</span>) tiene perfil <span className="text-[#38BDF8] font-bold">Equipo Comercial</span>, con acceso exclusivo a consulta y visualización.
                </p>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2563EB] transition-colors shadow-sm cursor-pointer"
                >
                  Volver al Dashboard
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
