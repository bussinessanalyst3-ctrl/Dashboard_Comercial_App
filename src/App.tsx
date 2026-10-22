import React, { useState, useEffect, useMemo } from 'react';
import {
  DatabaseState,
  FilterState,
  UserRole,
  VentaRecord,
  ObjetivoRecord
} from './types/commercial';
import {
  loadDatabase,
  switchUserRole
} from './services/dbStore';
import {
  filterVentas,
  filterObjetivos,
  filterCobertura,
  calculateKPIs,
  aggregateByDimension,
  getHistoricalTimeline
} from './services/calculations';
import { testSupabaseConnection } from './services/supabaseClient';
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

export default function App() {
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

  // Toggle user role between 'admin' and 'consulta'
  const handleToggleRole = () => {
    const nextRole: UserRole = dbState.currentUser.role === 'admin' ? 'consulta' : 'admin';
    const updated = switchUserRole(dbState, nextRole);
    setDbState(updated);
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

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'light' ? 'theme-light bg-[#F8FAFC] text-[#0F172A]' : 'bg-[#0B0D10] text-[#F1F5F9]'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={dbState.currentUser.role}
        onToggleRole={handleToggleRole}
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
          userRole={dbState.currentUser.role}
          onToggleRole={handleToggleRole}
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

            {/* TAB 7: DATA MANAGEMENT / IMPORT */}
            {activeTab === 'import' && (
              <DataManagement
                dbState={dbState}
                onUpdateDbState={setDbState}
                userRole={dbState.currentUser.role}
                onSwitchToAudit={() => setActiveTab('audit')}
              />
            )}

            {/* TAB 8: AUDITORÍA */}
            {activeTab === 'audit' && (
              <AuditLogView
                batches={dbState.batches}
                auditLogs={dbState.auditLogs}
              />
            )}

            {/* TAB 9: SUPABASE & SQL */}
            {activeTab === 'supabase' && (
              <SupabaseConfigView
                onConnectionStatusChange={setSupabaseConnected}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
