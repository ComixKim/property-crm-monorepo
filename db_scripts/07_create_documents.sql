-- Create Document Category Enum
CREATE TYPE document_category AS ENUM ('lease', 'id', 'photo', 'other');
-- Create Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    category document_category NOT NULL DEFAULT 'other',
    property_id UUID REFERENCES properties(id) ON DELETE
    SET NULL,
        tenant_id UUID REFERENCES profiles(id) ON DELETE
    SET NULL,
        is_shared BOOLEAN NOT NULL DEFAULT false,
        uploaded_by UUID NOT NULL REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- Policies
-- 1. Managers/Admins can do anything
CREATE POLICY "Managers and admins have full access to documents" ON documents FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin_uk', 'manager')
    )
);
-- 2. Tenants can see documents shared with them
CREATE POLICY "Tenants can view documents shared with them" ON documents FOR
SELECT TO authenticated USING (
        (
            tenant_id = auth.uid()
            AND is_shared = true
        )
        OR (uploaded_by = auth.uid())
    );
-- 3. Owners can see documents for their properties
CREATE POLICY "Owners can view documents for their properties" ON documents FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM properties
            WHERE properties.id = documents.property_id
                AND properties.owner_id = auth.uid()
        )
    );