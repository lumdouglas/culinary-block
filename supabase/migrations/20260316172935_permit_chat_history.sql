-- Create table for storing Permit Assistant chat sessions
CREATE TABLE IF NOT EXISTS permit_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE permit_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (from the client form submission before they chat)
CREATE POLICY "Allow anonymous inserts to chat sessions" 
ON permit_chat_sessions FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow admins to read all sessions
CREATE POLICY "Allow admins to read all chat sessions" 
ON permit_chat_sessions FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Note: The Next.js API route will use the Service Role key to update the `messages` JSONB array during server-to-server AI streams, bypassing RLS.

-- Add updated_at trigger
CREATE TRIGGER update_permit_chat_sessions_modtime
BEFORE UPDATE ON permit_chat_sessions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
