-- Create activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS activities (
    activityid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
    postid UUID NOT NULL REFERENCES posts(postid) ON DELETE CASCADE,
    userid UUID NOT NULL REFERENCES users(userid) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, postid, userid)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_postid ON activities(postid);
CREATE INDEX IF NOT EXISTS idx_activities_userid ON activities(userid);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Add RLS (Row Level Security) policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy for viewing activities
CREATE POLICY "Anyone can view activities"
    ON activities FOR SELECT
    USING (true);

-- Policy for inserting activities
CREATE POLICY "Authenticated users can create activities"
    ON activities FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for deleting activities
CREATE POLICY "Users can delete their own activities"
    ON activities FOR DELETE
    TO authenticated
    USING (userid = auth.uid()); 