import { readFileSync, writeFileSync } from 'node:fs';

const content = readFileSync('.env.local', 'utf-8');
const lines = content.split('\n');
const newLines = lines.map((l) => {
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    const raw = l.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
    try {
      const origin = new URL(raw).origin;
      return `NEXT_PUBLIC_SUPABASE_URL=${origin}`;
    } catch {
      return l;
    }
  }
  return l;
});

writeFileSync('.env.local', newLines.join('\n'));
console.log('[PASS] .env.local URL normalized successfully');
