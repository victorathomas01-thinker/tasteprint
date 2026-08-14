import { EVENT_NAMES, MIN_PERCENTILE_SAMPLE } from '../analytics-contract.js';
import fs from 'node:fs';

const requiredEvents = [
  'page_view',
  'quiz_start',
  'quiz_complete',
  'challenge_create',
  'challenge_receive',
  'challenge_complete',
  'remote_match_unlock'
];

const unique = new Set(EVENT_NAMES);
if (unique.size !== EVENT_NAMES.length) {
  throw new Error('Analytics event names must be unique.');
}

for (const event of requiredEvents) {
  if (!unique.has(event)) throw new Error(`Missing required analytics event: ${event}`);
}

if (!Number.isInteger(MIN_PERCENTILE_SAMPLE) || MIN_PERCENTILE_SAMPLE < 30) {
  throw new Error('Percentile minimum sample must be a conservative integer threshold.');
}

const schema = fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
for (const table of ['tasteprint_profiles', 'tasteprint_events']) {
  if (!schema.includes(table)) throw new Error(`Supabase schema is missing ${table}.`);
}

if (!schema.includes('tasteprint_percentiles') || !schema.includes('tasteprint_public_stats')) {
  throw new Error('Aggregate stats / percentile functions are missing from the data schema.');
}

if (!schema.includes(`total.n < ${MIN_PERCENTILE_SAMPLE}`)) {
  throw new Error('SQL percentile threshold does not match analytics-contract.js.');
}

console.log(`Data contract OK — ${EVENT_NAMES.length} events, percentile minimum ${MIN_PERCENTILE_SAMPLE}.`);
