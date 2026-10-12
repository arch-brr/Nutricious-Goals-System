import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

if (!existsSync(envPath)) {
  console.log('[FAIL] .env.local not found');
  process.exit(1);
}

const env = {};
const lines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of lines) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Testing Supabase Connection ===');
if (!url || !key) {
  console.log('[FAIL] URL or anon key missing');
  process.exit(1);
}

const supabase = createClient(url, key);
console.log('Supabase Client: Initialized');

async function testConnection() {
  // Test profiles table
  const { error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (profilesError) {
    console.log(`[WARN] profiles query: ${profilesError.message} (${profilesError.code})`);
  } else {
    console.log('[PASS] public.profiles accessible');
  }

  // Test foods table
  const { error: foodsError } = await supabase
    .from('foods')
    .select('id')
    .limit(1);

  if (foodsError) {
    console.log(`[WARN] foods query: ${foodsError.message} (${foodsError.code})`);
  } else {
    console.log('[PASS] public.foods accessible');
  }

  // Test meal_plans table
  const { error: plansError } = await supabase
    .from('meal_plans')
    .select('id')
    .limit(1);

  if (plansError) {
    console.log(`[WARN] meal_plans query: ${plansError.message} (${plansError.code})`);
  } else {
    console.log('[PASS] public.meal_plans accessible');
  }

  // Test meal_plan_items table
  const { error: itemsError } = await supabase
    .from('meal_plan_items')
    .select('id')
    .limit(1);

  if (itemsError) {
    console.log(`[WARN] meal_plan_items query: ${itemsError.message} (${itemsError.code})`);
  } else {
    console.log('[PASS] public.meal_plan_items accessible');
  }

  // Test consumption_logs table
  const { error: logsError } = await supabase
    .from('consumption_logs')
    .select('id')
    .limit(1);

  if (logsError) {
    console.log(`[WARN] consumption_logs query: ${logsError.message} (${logsError.code})`);
  } else {
    console.log('[PASS] public.consumption_logs accessible');
  }
}

await testConnection();
