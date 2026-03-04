-- TemOS Database Setup
-- Run this ONCE in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jsinmznfwucgappzbtkt/editor

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  bio        TEXT,
  website    TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_own_profile"   ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

CREATE POLICY "view_own_profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own_profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow service role to upsert profiles (backend writes)
DROP POLICY IF EXISTS "service_upsert_profile" ON public.profiles;
CREATE POLICY "service_upsert_profile"
  ON public.profiles FOR ALL TO service_role USING (true);

-- ============================================================
-- 2. BUSINESS IDEAS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_ideas (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  title       TEXT NOT NULL,
  description TEXT,
  difficulty  TEXT,
  budget      TEXT,
  time        TEXT,
  category    TEXT DEFAULT 'AI Generated',
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan        TEXT DEFAULT 'free'
);

ALTER TABLE public.business_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_own_ideas"   ON public.business_ideas;
DROP POLICY IF EXISTS "delete_own_ideas" ON public.business_ideas;
DROP POLICY IF EXISTS "service_all_ideas" ON public.business_ideas;

-- Users can read their own ideas
CREATE POLICY "view_own_ideas"
  ON public.business_ideas FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own ideas
CREATE POLICY "delete_own_ideas"
  ON public.business_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (backend) can do everything
CREATE POLICY "service_all_ideas"
  ON public.business_ideas FOR ALL
  TO service_role USING (true);

-- ============================================================
-- 3. AVATARS STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 3145728, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users upload own avatar"   ON storage.objects;
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar"   ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar"   ON storage.objects;

CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatars publicly readable" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
