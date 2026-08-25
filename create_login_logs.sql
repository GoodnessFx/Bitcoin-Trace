-- Create login_logs table
CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    ip_address TEXT,
    device_info TEXT,
    login_time TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to read all logs
CREATE POLICY "Admins can view login logs" ON public.login_logs
    FOR SELECT TO authenticated
    USING (true); -- Note: Adjust this in production to check for admin role

-- Create policy to allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own logs" ON public.login_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
