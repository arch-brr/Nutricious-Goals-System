import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Load .env.local if present
const envLocalPath = resolve(rootDir, '.env.local');
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, 'utf-8');
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      const val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Database Verification Check ===');
console.log(`NEXT_PUBLIC_SUPABASE_URL configured: ${supabaseUrl ? 'YES' : 'NO'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY configured: ${anonKey ? 'YES' : 'NO'}`);
console.log(`DATABASE_URL configured: ${dbUrl ? 'YES' : 'NO'}`);

const migrationsDir = resolve(rootDir, 'supabase', 'migrations');
const migrationFiles = existsSync(migrationsDir)
  ? readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  : [];

console.log(`\nFound ${migrationFiles.length} migration file(s):`);
migrationFiles.forEach((f) => console.log(` - ${f}`));

if (!dbUrl) {
  console.log('\n[INFO] DATABASE_URL not set. Direct Postgres migration check skipped.');
  process.exit(0);
}

const { Client } = pg;
const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('\n[PASS] Connected to PostgreSQL successfully.');

  // Check required tables
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  const existingTables = tablesRes.rows.map((r) => r.table_name);
  console.log('Public tables in database:', existingTables.join(', '));

  const requiredTables = ['profiles', 'foods', 'meal_plans', 'meal_plan_items', 'consumption_logs'];
  const missingTables = requiredTables.filter((t) => !existingTables.includes(t));

  if (missingTables.length === 0) {
    console.log('[PASS] All required public schema tables exist.');
  } else {
    console.log('[WARN] Missing tables:', missingTables.join(', '));
  }
} catch (err) {
  console.error('[ERROR] Database connection failed:', err.message);
} finally {
  await client.end();
}
