/**
 * One-time database setup script.
 * Creates business_ideas and profiles tables + RLS policies.
 * Run: node setup-db.js
 */
const https = require('https');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Use service key if available, otherwise anon key (may lack DDL permissions)
const AUTH_KEY = SERVICE_KEY || ANON_KEY;

const SQL = `
-- ===== profiles table =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  bio        TEXT,
  website    TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ===== business_ideas table =====
CREATE TABLE IF NOT EXISTS public.business_ideas (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  title       TEXT NOT NULL,
  description TEXT,
  difficulty  TEXT,
  budget      TEXT,
  time        TEXT,
  category    TEXT DEFAULT 'AI Generated',
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan        TEXT DEFAULT 'free'
);

ALTER TABLE public.business_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ideas"   ON public.business_ideas;
DROP POLICY IF EXISTS "Users can insert own ideas" ON public.business_ideas;
DROP POLICY IF EXISTS "Users can delete own ideas" ON public.business_ideas;

CREATE POLICY "Users can view own ideas"
  ON public.business_ideas FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON public.business_ideas FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own ideas"
  ON public.business_ideas FOR DELETE USING (auth.uid() = user_id);

-- ===== avatars storage bucket =====
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 3145728, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users can upload their own avatar"   ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible"     ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"   ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"   ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
`;

function runSQL(sql) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/sql`);

        // Use the pg REST endpoint directly
        const postUrl = new URL(`${SUPABASE_URL}/rest/v1/`);

        // Use the direct SQL via postgres endpoint
        const sqlUrl = SUPABASE_URL.replace('https://', '');
        const projectRef = sqlUrl.split('.')[0];

        console.log('Project ref:', projectRef);
        console.log('Attempting SQL via Supabase Management API fallback...');

        // Actually use the REST /query endpoint that's available on all projects
        const reqOptions = {
            hostname: `${sqlUrl.split('.supabase.co')[0]}.supabase.co`,
            port: 443,
            path: `/rest/v1/?apikey=${AUTH_KEY}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_KEY}`,
                'apikey': AUTH_KEY,
            }
        };

        console.log('\nConnecting to:', SUPABASE_URL);
        console.log('Note: Cannot run raw DDL via anon/service key through REST API.');
        console.log('\nPlease run this SQL in your Supabase Dashboard SQL Editor:');
        console.log('='.repeat(60));
        console.log(sql);
        console.log('='.repeat(60));
        resolve();
    });
}

runSQL(SQL).then(() => {
    console.log('\nSetup script complete.');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
