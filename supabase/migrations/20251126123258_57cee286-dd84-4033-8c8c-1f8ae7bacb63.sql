-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create work_logs table
CREATE TABLE IF NOT EXISTS public.work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  departure_time TIME NOT NULL,
  work_hours NUMERIC(5,2) NOT NULL,
  unpaid_break_minutes INTEGER NOT NULL DEFAULT 20,
  unpaid_applied BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for work_logs
CREATE POLICY "Users can view their own work logs"
  ON public.work_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own work logs"
  ON public.work_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work logs"
  ON public.work_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work logs"
  ON public.work_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create hungarian_holidays table (2025-2026 holidays)
CREATE TABLE IF NOT EXISTS public.hungarian_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hungarian_holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can read holidays
CREATE POLICY "Anyone can view holidays"
  ON public.hungarian_holidays FOR SELECT
  TO authenticated
  USING (true);

-- Insert Hungarian holidays for 2025-2026
INSERT INTO public.hungarian_holidays (date, name) VALUES
  ('2025-01-01', 'Újév'),
  ('2025-03-15', '1848-as forradalom ünnepe'),
  ('2025-04-18', 'Nagypéntek'),
  ('2025-04-20', 'Húsvéthétfő'),
  ('2025-04-21', 'Húsvéthétfő'),
  ('2025-05-01', 'A munka ünnepe'),
  ('2025-06-08', 'Pünkösdhétfő'),
  ('2025-08-20', 'Az államalapítás ünnepe'),
  ('2025-10-23', '1956-os forradalom ünnepe'),
  ('2025-11-01', 'Mindenszentek'),
  ('2025-12-25', 'Karácsony (első nap)'),
  ('2025-12-26', 'Karácsony (második nap)'),
  ('2026-01-01', 'Újév'),
  ('2026-03-15', '1848-as forradalom ünnepe'),
  ('2026-04-03', 'Nagypéntek'),
  ('2026-04-05', 'Húsvéthétfő'),
  ('2026-04-06', 'Húsvéthétfő'),
  ('2026-05-01', 'A munka ünnepe'),
  ('2026-05-24', 'Pünkösdhétfő'),
  ('2026-08-20', 'Az államalapítás ünnepe'),
  ('2026-10-23', '1956-os forradalom ünnepe'),
  ('2026-11-01', 'Mindenszentek'),
  ('2026-12-25', 'Karácsony (első nap)'),
  ('2026-12-26', 'Karácsony (második nap)')
ON CONFLICT (date) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_work_logs_updated_at
  BEFORE UPDATE ON public.work_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();