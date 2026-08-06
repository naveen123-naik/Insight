-- ====================================================================
-- ⚡ INSIGHTAI PLATFORM - COMPLETE SUPABASE POSTGRESQL SUITE
-- ====================================================================
-- Copy and paste this entire script into your Supabase SQL Editor.
-- Executable out-of-the-box with zero UUID errors!

-- ====================================================================
-- SECTION 1: DATABASE TABLES (DDL)
-- ====================================================================

-- 1.1 User Profiles Table (Synced with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'Analyst',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Datasets Table (File Upload Metadata)
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    original_name TEXT NOT NULL,
    storage_path TEXT,
    file_type TEXT NOT NULL, -- 'csv' or 'xlsx'
    file_size_bytes BIGINT,
    row_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Sales Records Table (Transactional Data)
CREATE TABLE IF NOT EXISTS public.sales_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID,
    transaction_date DATE DEFAULT CURRENT_DATE,
    product_name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    unit_cost NUMERIC(12, 2) DEFAULT 0.00,
    net_profit NUMERIC(12, 2) DEFAULT 0.00,
    city TEXT DEFAULT 'Unassigned',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Analytics KPIs Table (Cached Aggregations)
CREATE TABLE IF NOT EXISTS public.analytics_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID UNIQUE REFERENCES public.datasets(id) ON DELETE CASCADE,
    total_revenue NUMERIC(14, 2) DEFAULT 0.00,
    total_profit NUMERIC(14, 2) DEFAULT 0.00,
    total_volume_units INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_order_value NUMERIC(12, 2) DEFAULT 0.00,
    profit_margin_pct NUMERIC(5, 2) DEFAULT 0.00,
    best_selling_product TEXT,
    top_city TEXT,
    top_category TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Decision Scenarios Table (What-If Simulations)
CREATE TABLE IF NOT EXISTS public.decision_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID,
    scenario_name TEXT NOT NULL,
    price_change_pct NUMERIC(5, 2) DEFAULT 0.00,
    marketing_change_pct NUMERIC(5, 2) DEFAULT 0.00,
    sales_target_pct NUMERIC(5, 2) DEFAULT 0.00,
    cost_change_pct NUMERIC(5, 2) DEFAULT 0.00,
    projected_revenue NUMERIC(14, 2),
    projected_profit NUMERIC(14, 2),
    projected_volume INTEGER,
    confidence_score INTEGER DEFAULT 90,
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Anomaly Alerts Table (ML Outliers)
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.sales_records(id) ON DELETE CASCADE,
    anomaly_score NUMERIC(6, 4),
    risk_severity TEXT CHECK (risk_severity IN ('Low', 'Medium', 'High', 'Critical')),
    reason TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 Chat Messages Table (RAG Conversational History)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID,
    question TEXT NOT NULL,
    ai_answer TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ====================================================================
-- SECTION 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid duplicate errors
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can manage own sales records" ON public.sales_records;
DROP POLICY IF EXISTS "Users can view own kpis" ON public.analytics_kpis;
DROP POLICY IF EXISTS "Users can manage own scenarios" ON public.decision_scenarios;
DROP POLICY IF EXISTS "Users can view own anomalies" ON public.anomaly_alerts;
DROP POLICY IF EXISTS "Users can manage own chat" ON public.chat_messages;

-- RLS Policies (Allow access if auth.uid() matches OR if user_id is null/sample)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own datasets" ON public.datasets FOR ALL USING (auth.uid() = user_id OR user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can manage own sales records" ON public.sales_records FOR ALL USING (auth.uid() = user_id OR user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can view own kpis" ON public.analytics_kpis FOR ALL USING (TRUE);

CREATE POLICY "Users can manage own scenarios" ON public.decision_scenarios FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own anomalies" ON public.anomaly_alerts FOR ALL USING (TRUE);

CREATE POLICY "Users can manage own chat" ON public.chat_messages FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);


-- ====================================================================
-- SECTION 3: SEED SAMPLE TEST DATA (VALID UUIDs)
-- ====================================================================

-- 3.1 Insert Sample Dataset (Using valid UUID '00000000-0000-0000-0000-000000000001')
INSERT INTO public.datasets (id, user_id, original_name, file_type, row_count, status)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'sales.csv', 'csv', 34, 'processed')
ON CONFLICT (id) DO NOTHING;

-- 3.2 Insert Sample Sales Records
INSERT INTO public.sales_records 
    (dataset_id, user_id, transaction_date, product_name, category, quantity, unit_price, unit_cost, net_profit, city)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-01-01', 'Laptop', 'Electronics', 5, 50000.00, 40000.00, 10000.00, 'Hyderabad'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-01-02', 'Mouse', 'Accessories', 20, 700.00, 400.00, 300.00, 'Delhi'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-01-03', 'Keyboard', 'Accessories', 15, 1500.00, 900.00, 600.00, 'Hyderabad'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-01-04', 'Monitor', 'Electronics', 8, 15000.00, 11000.00, 4000.00, 'Bangalore'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-01-05', 'Desk', 'Furniture', 3, 25000.00, 18000.00, 7000.00, 'Hyderabad'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-01-06', 'Chair', 'Furniture', 4, 12000.00, 8000.00, 4000.00, 'Delhi')
ON CONFLICT DO NOTHING;


-- ====================================================================
-- SECTION 4: EXECUTABLE ANALYTICAL QUERIES
-- ====================================================================

-- 4.1 Executive Dashboard Metrics Query
SELECT 
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue_inr,
    SUM(net_profit) AS total_profit_inr,
    SUM(quantity) AS total_units_sold,
    ROUND(AVG(total_amount), 2) AS avg_order_value,
    ROUND((SUM(net_profit) / NULLIF(SUM(total_amount), 0)) * 100, 2) AS profit_margin_pct
FROM public.sales_records;


-- 4.2 Product Performance & AI Decision Ranking Query
SELECT 
    product_name,
    category,
    SUM(quantity) AS units_sold,
    SUM(total_amount) AS total_revenue_inr,
    SUM(net_profit) AS total_profit_inr,
    ROUND((SUM(net_profit) / NULLIF(SUM(total_amount), 0)) * 100, 1) AS margin_pct
FROM public.sales_records
GROUP BY product_name, category
ORDER BY total_revenue_inr DESC;


-- 4.3 Regional City Sales Breakdown Query
SELECT 
    city,
    COUNT(*) AS transaction_count,
    SUM(total_amount) AS city_revenue_inr,
    SUM(net_profit) AS city_profit_inr,
    ROUND((SUM(total_amount) * 100.0) / NULLIF((SELECT SUM(total_amount) FROM public.sales_records), 0), 1) AS city_market_share_pct
FROM public.sales_records
GROUP BY city
ORDER BY city_revenue_inr DESC;


-- 4.4 What-If Scenario Price & Demand Simulation Query
WITH Baseline AS (
    SELECT 
        SUM(total_amount) AS base_rev,
        SUM(net_profit) AS base_profit,
        SUM(quantity) AS base_vol
    FROM public.sales_records
),
SimulationParams AS (
    SELECT 
        base_rev,
        base_profit,
        base_vol,
        10.0 AS price_change_pct,      -- +10% price increase
        25.0 AS marketing_change_pct,  -- +25% marketing budget
        (1.0 + ((25.0 * 0.45 - 10.0 * 1.1) / 100.0)) AS volume_multiplier
    FROM Baseline
)
SELECT 
    ROUND(base_rev, 2) AS baseline_revenue_inr,
    ROUND(base_profit, 2) AS baseline_profit_inr,
    ROUND(base_rev * 1.10 * volume_multiplier, 2) AS projected_revenue_inr,
    ROUND(base_profit * 1.30 * volume_multiplier, 2) AS projected_profit_inr,
    ROUND((base_rev * 1.10 * volume_multiplier) - base_rev, 2) AS revenue_growth_delta_inr
FROM SimulationParams;
