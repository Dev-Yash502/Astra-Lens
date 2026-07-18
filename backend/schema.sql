-- Create scans table to store user scan history
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    prediction TEXT NOT NULL CHECK (prediction IN ('REAL', 'FAKE')),
    confidence DOUBLE PRECISION NOT NULL,
    image_url TEXT NOT NULL,
    heatmap_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own scans
CREATE POLICY "Users can insert their own scans" 
ON public.scans 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to read only their own scans
CREATE POLICY "Users can view their own scans" 
ON public.scans 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
