-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    user_id UUID NOT NULL,
    content JSONB,
    is_archived BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES documents(id),
    cover_image TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for users" ON documents
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable insert access for users" ON documents
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable update access for users" ON documents
    FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable delete access for users" ON documents
    FOR DELETE
    USING (auth.uid()::text = user_id::text); 