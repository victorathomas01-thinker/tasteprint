import fs from 'node:fs';
import { EVENT_NAMES } from '../analytics-contract.js';
import { MIN_REFERRAL_SAMPLE, referralAggregate, referralHealth } from '../referral-core.js';

const makeEvent = ({ name, token = null, referral = null, session = '11111111-1111-4111-8111-111111111111', outcome = null }) => ({
  event_name: name,
  referral_id: referral,
  session_id: session,
  properties: {
    ...(token ? { referral_token: token } : {}),
    ...(outcome ? { outcome } : {})
  }
});

const events = [];
for (let i = 0; i < MIN_REFERRAL_SAMPLE; i += 1) {
  const token = `token${String(i).padStart(4, '0')}abc`;
  events.push(makeEvent({ name: 'challenge_create', token, session: `creator-${i}` }));
  events.push(makeEvent({ name: 'challenge_share_outcome', token, session: `creator-${i}`, outcome: i % 5 === 0 ? 'copied' : 'shared' }));
  if (i < 12) {
    events.push(makeEvent({ name: 'challenge_receive', referral: token, session: `recipient-${i}` }));
  }
  if (i < 8) {
    events.push(makeEvent({ name: 'challenge_complete', referral: token, session: `recipient-${i}` }));
  }
  if (i < 6) {
    events.push(makeEvent({ name: 'remote_match_unlock', referral: token, session: `recipient-${i}` }));
  }
  if (i < 4) {
    events.push(makeEvent({ name: 'challenge_share_outcome', token: `child${i}token`, referral: token, session: `recipient-${i}`, outcome: 'copied' }));
  }
}

const report = referralAggregate(events);
if (!report.sample_ready) throw new Error('Referral reporting should unlock creator-token rate review at the configured sample minimum.');
if (report.creator_tokens !== MIN_REFERRAL_SAMPLE) throw new Error(`Expected ${MIN_REFERRAL_SAMPLE} creator tokens, got ${report.creator_tokens}.`);
if (report.tokens_opened !== 12 || report.tokens_completed !== 8) throw new Error('Referral token attribution did not connect creator tokens to downstream outcomes.');
if (report.recipient_completions !== 8 || report.match_unlocks !== 6) throw new Error('Recipient funnel counts are incorrect.');
if (report.secondary_share_sessions !== 4) throw new Error('Same-session downstream resharing was not attributed.');
if (report.token_activation_pct !== 60) throw new Error(`Expected 60% token activation, got ${report.token_activation_pct}.`);
if (report.recipient_completion_pct !== null || report.same_session_reshare_pct !== null) {
  throw new Error('Recipient conversion/reshare rates must stay hidden until enough attributed recipient samples exist.');
}

const below = referralAggregate(events.filter((event) => {
  if (event.event_name !== 'challenge_create') return true;
  const match = event.properties?.referral_token?.match(/\d+/)?.[0];
  return Number(match || 0) < MIN_REFERRAL_SAMPLE - 1;
}));
if (below.sample_ready) throw new Error('Referral rate gate must not unlock below the minimum creator-token sample.');

const health = referralHealth(report);
if (!health.state || !health.copy) throw new Error('Referral health summary must produce a state and explanation.');
if (!/recipient conversion still collecting/i.test(health.state)) {
  throw new Error('Loop health must not call recipient conversion a bottleneck before its own sample threshold is met.');
}

if (!EVENT_NAMES.includes('challenge_share_outcome')) throw new Error('Analytics contract is missing challenge_share_outcome.');

const referralRuntime = fs.readFileSync(new URL('../referral.js', import.meta.url), 'utf8');
for (const marker of ['challenge_share_outcome', 'referral_token', 'outcome']) {
  if (!referralRuntime.includes(marker)) throw new Error(`Referral runtime is missing ${marker}.`);
}

const sql = fs.readFileSync(new URL('../supabase/referrals.sql', import.meta.url), 'utf8');
for (const marker of ['tasteprint_referral_stats', 'creator_tokens', 'tokens_opened', 'attributed_unique_sessions', 'secondary_share_sessions', 'grant execute', 'to anon']) {
  if (!sql.includes(marker)) throw new Error(`Referral SQL is missing ${marker}.`);
}
for (const forbidden of ['owner_hash', 'install_id', "'token', c.token", 'session_ids']) {
  if (sql.includes(forbidden)) throw new Error(`Public referral reporting must not expose raw identity/referral details: ${forbidden}.`);
}

const growth = fs.readFileSync(new URL('../growth.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint_referral_stats', 'referralAggregate', 'token_activation_pct', 'same_session_reshare_pct', 'Backend needed']) {
  if (!growth.includes(marker)) throw new Error(`Growth dashboard is missing ${marker}.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['growth.js', 'growth.css']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

console.log(`Referral attribution OK — privacy-safe cross-device aggregate scaffold, ${MIN_REFERRAL_SAMPLE}-token creator gate, independent recipient-rate gates, share outcomes and downstream resharing metrics wired.`);
