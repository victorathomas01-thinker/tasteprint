import { EVENT_NAMES, MIN_PERCENTILE_SAMPLE, RAW_DATA_RETENTION_DAYS } from '../analytics-contract.js';
import fs from 'node:fs';

const requiredEvents = [
  'page_view',
  'quiz_start',
  'quiz_complete',
  'challenge_create',
  'challenge_share_outcome',
  'challenge_receive',
  'challenge_complete',
  'remote_match_unlock',
  'recommendation_intelligence_view',
  'recommendation_feedback',
  'recommendation_lane_select'
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

if (!Number.isInteger(RAW_DATA_RETENTION_DAYS) || RAW_DATA_RETENTION_DAYS < 30 || RAW_DATA_RETENTION_DAYS > 365) {
  throw new Error('Raw data retention must be an explicit conservative day count.');
}

const schema = fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
for (const table of ['tasteprint_profiles', 'tasteprint_events']) {
  if (!schema.includes(table)) throw new Error(`Supabase schema is missing ${table}.`);
}

const requiredFunctions = [
  'tasteprint_percentiles',
  'tasteprint_public_stats',
  'tasteprint_create_profile',
  'tasteprint_shared_profile',
  'tasteprint_delete_my_data',
  'tasteprint_prune_old_data'
];
for (const fn of requiredFunctions) {
  if (!schema.includes(fn)) throw new Error(`Data schema is missing ${fn}.`);
}

if (!schema.includes(`total.n < ${MIN_PERCENTILE_SAMPLE}`)) {
  throw new Error('SQL percentile threshold does not match analytics-contract.js.');
}

if (!schema.includes(`interval '${RAW_DATA_RETENTION_DAYS} days'`)) {
  throw new Error('SQL retention period does not match analytics-contract.js.');
}

for (const privacyField of ['owner_hash', 'short_code']) {
  if (!schema.includes(privacyField)) throw new Error(`Data schema is missing ${privacyField}.`);
}

const analytics = fs.readFileSync(new URL('../analytics.js', import.meta.url), 'utf8');
if (!analytics.includes('deleteMyData') || !analytics.includes('resolveSharedProfile')) {
  throw new Error('Frontend privacy/short-profile APIs are missing.');
}
if (!analytics.includes("crypto.subtle.digest('SHA-256'")) {
  throw new Error('Deletion ownership token must be hashed before storage.');
}

const privacy = fs.readFileSync(new URL('../privacy.js', import.meta.url), 'utf8');
for (const marker of ['Delete anonymous browser data', 'Export local activity', 'Delete account + synced Passport', 'recommendation_intelligence']) {
  if (!privacy.includes(marker)) throw new Error(`In-product privacy controls are missing required marker: ${marker}`);
}

const shortLinks = fs.readFileSync(new URL('../short-links.js', import.meta.url), 'utf8');
for (const requirement of ['resolveSharedProfile', "shortURL('p'", "shortURL('c'", 'tasteprint:profile-persisted']) {
  if (!shortLinks.includes(requirement)) throw new Error(`Short-link progressive enhancement is missing: ${requirement}`);
}

const referrals = fs.readFileSync(new URL('../supabase/referrals.sql', import.meta.url), 'utf8');
if (!referrals.includes('tasteprint_referral_stats')) throw new Error('Referral aggregate RPC scaffold is missing.');

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['privacy.js', 'privacy.css', 'short-links.js', 'intelligence.js', 'intelligence.css', 'growth.js', 'growth.css']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

console.log(`Data contract OK — ${EVENT_NAMES.length} events, percentile minimum ${MIN_PERCENTILE_SAMPLE}, raw retention ${RAW_DATA_RETENTION_DAYS} days, referral aggregate wired.`);
