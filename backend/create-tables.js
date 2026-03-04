/**
 * Run once: Creates all tables + RLS policies via Supabase pg endpoint
 * node create-tables.js
 */
require('dotenv').config({ path: './.env' });
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
console.log('Project:', projectRef);
console.log('URL:', SUPABASE_URL);

// Use the postgres REST extension if available, otherwise show SQL
const SQL = `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, avatar_url TEXT, bio TEXT, website TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "view_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "insert_own_profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.business_ideas (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT,
  budget TEXT,
  time TEXT,
  category TEXT DEFAULT 'AI Generated',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan TEXT DEFAULT 'free'
);
ALTER TABLE public.business_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "view_own_ideas" ON public.business_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "insert_own_ideas" ON public.business_ideas FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "delete_own_ideas" ON public.business_ideas FOR DELETE USING (auth.uid() = user_id);
`;

// Try calling via postgres function
const body = JSON.stringify({ query: SQL });
const urlObj = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

const req = https.request({
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Length': Buffer.byteLength(body)
    }
}, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', e => console.error(e));
req.write(body);
req.end();
