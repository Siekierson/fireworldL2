-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
    messageid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userid UUID NOT NULL REFERENCES users(userid) ON DELETE CASCADE,
    message TEXT NOT NULL,
    towhoid UUID NOT NULL REFERENCES users(userid) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_userid ON messages(userid);
CREATE INDEX IF NOT EXISTS idx_messages_towhoid ON messages(towhoid);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable realtime for the messages table
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE messages;

-- Add RLS (Row Level Security) policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to view messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to send messages" ON messages;
DROP POLICY IF EXISTS "Allow users to delete their own messages" ON messages;

-- Policy for viewing messages - allow all authenticated requests
CREATE POLICY "Allow authenticated users to view messages"
    ON messages FOR SELECT
    USING (true);

-- Policy for inserting messages - allow all authenticated requests
CREATE POLICY "Allow authenticated users to send messages"
    ON messages FOR INSERT
    WITH CHECK (true);

-- Policy for deleting messages - allow users to delete their own messages
CREATE POLICY "Allow users to delete their own messages"
    ON messages FOR DELETE
    USING (userid::text = (current_setting('request.jwt.claims', true)::json->>'userID'));

-- Grant necessary permissions to authenticated users
GRANT ALL ON messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permission to use set_config
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO authenticated;

-- Enable realtime for the messages table
ALTER TABLE messages REPLICA IDENTITY FULL; 