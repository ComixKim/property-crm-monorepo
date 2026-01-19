-- Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- Policies
-- 1. Tenants can view their own invoices
CREATE POLICY "Tenants can view own invoices" ON invoices FOR
SELECT USING (
        contract_id IN (
            SELECT id
            FROM contracts
            WHERE tenant_id = auth.uid()
        )
    );
-- 2. Owners can view invoices for their properties
CREATE POLICY "Owners can view invoices for their properties" ON invoices FOR
SELECT USING (
        contract_id IN (
            SELECT c.id
            FROM contracts c
                JOIN properties p ON c.property_id = p.id
            WHERE p.owner_id = auth.uid()
        )
    );
-- 3. Admins/Managers can view all
CREATE POLICY "Admins and Managers can view all invoices" ON invoices FOR
SELECT USING (
        exists (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin_uk', 'manager')
        )
    );
-- 4. Admins can insert/update invoices (Manager too?)
-- Allowing Managers/Admins to manage invoices
CREATE POLICY "Admins and Managers can insert invoices" ON invoices FOR
INSERT WITH CHECK (
        exists (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin_uk', 'manager')
        )
    );
CREATE POLICY "Admins and Managers can update invoices" ON invoices FOR
UPDATE USING (
        exists (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin_uk', 'manager')
        )
    );
-- 5. Tenants can "pay" (update status) - In reality this should be a stored proc or restricted column update,
-- but for simplicity we'll allow update if they own it.
-- Update: Better to not allow direct update via RLS for status to avoid fraud.
-- We will handle payments via a secure API endpoint `payAtInvoice` which uses Service Role or validates logic.
-- So NO RLS policy for Tenant Update.