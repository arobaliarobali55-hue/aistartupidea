// Quick RLS fix script - run once then delete
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkAndLogPolicies() {
    // Test select without RLS bypass
    const { data, error } = await supabase
        .from('business_ideas')
        .select('id, user_id')
        .limit(3);

    console.log('Current query test:');
    console.log('data:', data);
    console.log('error:', error?.message || 'none');
}

checkAndLogPolicies().then(() => process.exit(0));
