-- Employees table
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'worker' CHECK (role IN ('worker', 'manager', 'super_admin')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Punches table
CREATE TABLE punches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('clock_in', 'clock_out')),
  timestamp TIMESTAMPTZ DEFAULT now(),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  gps_available BOOLEAN DEFAULT false
);

-- Work tickets table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'closed'))
);

-- Admin users table
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'manager' CHECK (role IN ('manager', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow service role full access (our API routes use service role key)
CREATE POLICY "Service role full access" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON punches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON admins FOR ALL USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_punches_employee_id ON punches(employee_id);
CREATE INDEX idx_punches_timestamp ON punches(timestamp);
CREATE INDEX idx_tickets_employee_id ON tickets(employee_id);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
