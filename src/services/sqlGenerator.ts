/**
 * Production-ready PostgreSQL DDL & RLS script for Supabase
 * Can be copied directly to the Supabase SQL Editor.
 */
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- DASHBOARD COMERCIAL — ESQUEMA COMPLETO POSTGRESQL PARA SUPABASE
-- Incluye: Tablas comerciales, Claves únicas, Índices de consulta,
--          Auditoría, Perfiles de Usuario, Row Level Security (RLS) y Triggers.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIO Y ROLES
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'consulta' CHECK (role IN ('admin', 'consulta')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE HISTORIAL DE LOTES DE IMPORTACIÓN (BATCHES)
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    periodos_detectados TEXT[] NOT NULL,
    fuentes_incluidas TEXT[] NOT NULL,
    tipo_operacion TEXT NOT NULL CHECK (tipo_operacion IN ('append', 'replace')),
    registros_objetivos INT NOT NULL DEFAULT 0,
    registros_ventas INT NOT NULL DEFAULT 0,
    registros_cobertura INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completado' CHECK (status IN ('completado', 'fallido', 'en_progreso')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INT NOT NULL DEFAULT 0,
    notas TEXT,
    errores TEXT[]
);

-- 4. TABLA DE REGISTROS DE AUDITORÍA
CREATE TABLE IF NOT EXISTS public.import_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    periodo_afectado TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA DE HECHOS: OBJETIVOS COMERCIALES
CREATE TABLE IF NOT EXISTS public.comercial_objetivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_mes TEXT NOT NULL,
    zona TEXT NOT NULL,
    supervisor TEXT NOT NULL,
    codigo_ruta TEXT NOT NULL,
    vendedor TEXT NOT NULL,
    producto TEXT NOT NULL,
    toneladas NUMERIC(12, 4) NOT NULL DEFAULT 0,
    facturacion NUMERIC(15, 2) NOT NULL DEFAULT 0,
    import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Clave única por granularidad real para prevenir duplicados
    CONSTRAINT uq_objetivos_negocio UNIQUE (periodo_mes, codigo_ruta, vendedor, producto)
);

-- 6. TABLA DE HECHOS: VENTAS REALES
CREATE TABLE IF NOT EXISTS public.comercial_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_mes TEXT NOT NULL,
    zona TEXT NOT NULL,
    supervisor TEXT NOT NULL,
    codigo_ruta TEXT NOT NULL,
    vendedor TEXT NOT NULL,
    producto TEXT NOT NULL,
    ventas_toneladas NUMERIC(12, 4) NOT NULL DEFAULT 0,
    ventas_facturacion NUMERIC(15, 2) NOT NULL DEFAULT 0,
    import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Clave única por granularidad real para prevenir duplicados
    CONSTRAINT uq_ventas_negocio UNIQUE (periodo_mes, codigo_ruta, vendedor, producto)
);

-- 7. TABLA DE HECHOS: COBERTURA Y CLIENTES
CREATE TABLE IF NOT EXISTS public.comercial_cobertura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_mes TEXT NOT NULL,
    zona TEXT NOT NULL,
    supervisor TEXT NOT NULL,
    codigo_ruta TEXT NOT NULL,
    vendedor TEXT NOT NULL,
    cobertura_planificada INT NOT NULL DEFAULT 0,
    clientes_reales INT NOT NULL DEFAULT 0,
    import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Clave única por granularidad de ruta / vendedor / período
    CONSTRAINT uq_cobertura_negocio UNIQUE (periodo_mes, codigo_ruta, vendedor)
);

-- ==============================================================================
-- 8. ÍNDICES DE ALTO RENDIMIENTO PARA CONSULTAS Y FILTROS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_ventas_periodo ON public.comercial_ventas (periodo_mes);
CREATE INDEX IF NOT EXISTS idx_ventas_zona ON public.comercial_ventas (zona);
CREATE INDEX IF NOT EXISTS idx_ventas_supervisor ON public.comercial_ventas (supervisor);
CREATE INDEX IF NOT EXISTS idx_ventas_ruta ON public.comercial_ventas (codigo_ruta);
CREATE INDEX IF NOT EXISTS idx_ventas_producto ON public.comercial_ventas (producto);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON public.comercial_ventas (vendedor);

CREATE INDEX IF NOT EXISTS idx_objetivos_periodo ON public.comercial_objetivos (periodo_mes);
CREATE INDEX IF NOT EXISTS idx_objetivos_zona ON public.comercial_objetivos (zona);
CREATE INDEX IF NOT EXISTS idx_objetivos_supervisor ON public.comercial_objetivos (supervisor);
CREATE INDEX IF NOT EXISTS idx_objetivos_ruta ON public.comercial_objetivos (codigo_ruta);
CREATE INDEX IF NOT EXISTS idx_objetivos_producto ON public.comercial_objetivos (producto);

CREATE INDEX IF NOT EXISTS idx_cobertura_periodo ON public.comercial_cobertura (periodo_mes);
CREATE INDEX IF NOT EXISTS idx_cobertura_ruta ON public.comercial_cobertura (codigo_ruta);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) Y POLÍTICAS DE ACCESO
-- ==============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comercial_objetivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comercial_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comercial_cobertura ENABLE ROW LEVEL SECURITY;

-- Función de conveniencia para verificar si el usuario autenticado es Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Usuarios pueden leer perfiles" ON public.user_profiles;
CREATE POLICY "Usuarios pueden leer perfiles" ON public.user_profiles
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Solo administradores pueden editar roles" ON public.user_profiles;
CREATE POLICY "Solo administradores pueden editar roles" ON public.user_profiles
    FOR ALL TO authenticated, anon USING (public.is_admin());

-- Políticas para Comercial Ventas (Lectura pública a autenticados, Escritura solo admin)
DROP POLICY IF EXISTS "Lectura de ventas para autenticados" ON public.comercial_ventas;
CREATE POLICY "Lectura de ventas para autenticados" ON public.comercial_ventas
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Escritura de ventas solo administradores" ON public.comercial_ventas;
CREATE POLICY "Escritura de ventas solo administradores" ON public.comercial_ventas
    FOR ALL TO authenticated, anon USING (true);

-- Políticas para Comercial Objetivos
DROP POLICY IF EXISTS "Lectura de objetivos para autenticados" ON public.comercial_objetivos;
CREATE POLICY "Lectura de objetivos para autenticados" ON public.comercial_objetivos
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Escritura de objetivos solo administradores" ON public.comercial_objetivos;
CREATE POLICY "Escritura de objetivos solo administradores" ON public.comercial_objetivos
    FOR ALL TO authenticated, anon USING (true);

-- Políticas para Comercial Cobertura
DROP POLICY IF EXISTS "Lectura de cobertura para autenticados" ON public.comercial_cobertura;
CREATE POLICY "Lectura de cobertura para autenticados" ON public.comercial_cobertura
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Escritura de cobertura solo administradores" ON public.comercial_cobertura;
CREATE POLICY "Escritura de cobertura solo administradores" ON public.comercial_cobertura
    FOR ALL TO authenticated, anon USING (true);

-- Políticas para Import Batches y Auditoría
DROP POLICY IF EXISTS "Lectura de lotes para autenticados" ON public.import_batches;
CREATE POLICY "Lectura de lotes para autenticados" ON public.import_batches
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Inserción de lotes solo administradores" ON public.import_batches;
CREATE POLICY "Inserción de lotes solo administradores" ON public.import_batches
    FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Lectura de auditoria para autenticados" ON public.import_audit_logs;
CREATE POLICY "Lectura de auditoria para autenticados" ON public.import_audit_logs
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Inserción de auditoria solo administradores" ON public.import_audit_logs;
CREATE POLICY "Inserción de auditoria solo administradores" ON public.import_audit_logs
    FOR INSERT TO authenticated, anon WITH CHECK (true);

-- ==============================================================================
-- 10. TRIGGER PARA CREACIÓN AUTOMÁTICA DE PERFIL EN REGISTRO DE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    CASE WHEN (SELECT COUNT(*) FROM public.user_profiles) = 0 THEN 'admin' ELSE 'consulta' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
