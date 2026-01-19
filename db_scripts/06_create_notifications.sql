-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Policies
-- 1. Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR
SELECT USING (auth.uid() = user_id);
-- 2. Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update own notifications" ON notifications FOR
UPDATE USING (auth.uid() = user_id);
-- 3. Service Role / Admins can insert notifications
CREATE POLICY "Admins can insert notifications" ON notifications FOR
INSERT WITH CHECK (
        exists (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin_uk', 'manager')
        )
        OR auth.uid() = user_id -- Allow self-notifications? Maybe not needed.
    );
-- Note: Most notifications will be created by API via Service Key or Admin role.