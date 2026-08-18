export const REFERRAL_REPORT_VERSION = 1;
export const MIN_REFERRAL_SAMPLE = 20;

const clean = (value, max = 80) => String(value ?? '').trim().slice(0, max);
const pct = (numerator, denominator) => denominator ? Math.round((numerator / denominator) * 1000) / 10 : null;
const eventProps = (event) => event?.properties && typeof event.properties === 'object' ? event.properties : {};

export function validReferralToken(value) {
  return /^[a-z0-9]{8,64}$/i.test(clean(value, 64));
}

export function successfulShareOutcome(value) {
  return value === 'shared' || value === 'copied';
}

export function referralAggregate(events = [], { minimum = MIN_REFERRAL_SAMPLE } = {}) {
  const rows = Array.isArray(events) ? events.filter((event) => event && typeof event === 'object') : [];
  const createdTokens = new Set();
  const openedTokens = new Set();
  const completedTokens = new Set();
  const recipientSessions = new Set();
  const attributedRecipientSessions = new Set();
  const secondaryShareSessions = new Set();
  const outcomes = { shared: 0, copied: 0, show: 0, cancelled: 0, other: 0 };

  let challengeActions = 0;
  let recipientOpens = 0;
  let recipientCompletions = 0;
  let matchUnlocks = 0;
  let attributedOpens = 0;
  let successfulShareActions = 0;

  for (const event of rows) {
    const name = clean(event.event_name, 80);
    const referralId = clean(event.referral_id, 64);
    const sessionId = clean(event.session_id, 80);
    const properties = eventProps(event);

    if (name === 'challenge_create') {
      challengeActions += 1;
      const token = clean(properties.referral_token, 64);
      if (validReferralToken(token)) createdTokens.add(token);
    }

    if (name === 'challenge_share_outcome') {
      const outcome = clean(properties.outcome, 24).toLowerCase();
      if (Object.prototype.hasOwnProperty.call(outcomes, outcome)) outcomes[outcome] += 1;
      else outcomes.other += 1;
      if (successfulShareOutcome(outcome)) {
        successfulShareActions += 1;
        if (validReferralToken(referralId) && sessionId) secondaryShareSessions.add(sessionId);
      }
    }

    if (name === 'challenge_receive') {
      recipientOpens += 1;
      if (sessionId) recipientSessions.add(sessionId);
      if (validReferralToken(referralId)) {
        attributedOpens += 1;
        openedTokens.add(referralId);
        if (sessionId) attributedRecipientSessions.add(sessionId);
      }
    }

    if (name === 'challenge_complete' && validReferralToken(referralId)) {
      recipientCompletions += 1;
      completedTokens.add(referralId);
    }

    if (name === 'remote_match_unlock' && validReferralToken(referralId)) {
      matchUnlocks += 1;
    }
  }

  const knownOpenedTokens = [...openedTokens].filter((token) => createdTokens.has(token));
  const knownCompletedTokens = [...completedTokens].filter((token) => createdTokens.has(token));
  const sampleSize = createdTokens.size;
  const sampleReady = sampleSize >= minimum;

  return {
    report_version: REFERRAL_REPORT_VERSION,
    minimum,
    sample_ready: sampleReady,
    challenge_actions: challengeActions,
    creator_tokens: sampleSize,
    successful_share_actions: successfulShareActions,
    share_outcomes: outcomes,
    recipient_opens: recipientOpens,
    attributed_opens: attributedOpens,
    unique_recipient_sessions: recipientSessions.size,
    attributed_recipient_sessions: attributedRecipientSessions.size,
    recipient_completions: recipientCompletions,
    match_unlocks: matchUnlocks,
    tokens_opened: knownOpenedTokens.length,
    tokens_completed: knownCompletedTokens.length,
    secondary_share_sessions: secondaryShareSessions.size,
    attribution_coverage_pct: pct(attributedOpens, recipientOpens),
    token_activation_pct: sampleReady ? pct(knownOpenedTokens.length, sampleSize) : null,
    completion_producing_token_pct: sampleReady ? pct(knownCompletedTokens.length, sampleSize) : null,
    recipient_completion_pct: attributedOpens >= minimum ? pct(recipientCompletions, attributedOpens) : null,
    same_session_reshare_pct: attributedRecipientSessions.size >= minimum ? pct(secondaryShareSessions.size, attributedRecipientSessions.size) : null
  };
}

export function referralHealth(report = {}) {
  if (!report.creator_tokens) return {
    state: 'No loop data yet',
    copy: 'Create and send friend challenges to start measuring the referral loop.'
  };
  if (!report.sample_ready) return {
    state: 'Collecting a stable sample',
    copy: `Tasteprint has ${report.creator_tokens} creator token${report.creator_tokens === 1 ? '' : 's'}. Rate claims stay hidden until ${report.minimum || MIN_REFERRAL_SAMPLE}.`
  };
  if ((report.token_activation_pct || 0) < 20) return {
    state: 'Opening is the bottleneck',
    copy: 'The invite is being created, but too few creator tokens are producing a recipient open. Improve the share message or destination context before touching quiz scoring.'
  };
  if (report.recipient_completion_pct === null || report.recipient_completion_pct === undefined) return {
    state: 'Creator loop measured; recipient conversion still collecting',
    copy: 'There are enough creator tokens to inspect invite activation, but not enough attributed recipient opens yet to make a completion-rate claim.'
  };
  if ((report.token_activation_pct || 0) >= 35 && report.recipient_completion_pct >= 55) return {
    state: 'Healthy invite loop',
    copy: 'A meaningful share of creator sessions produce opens, and recipients are converting into completed comparisons.'
  };
  if (report.recipient_completion_pct < 45) return {
    state: 'Recipient completion is the bottleneck',
    copy: 'People are opening challenges but too many drop before finishing. The recipient flow is a better target than increasing share prompts.'
  };
  return {
    state: 'Loop has room to improve',
    copy: 'The invite loop is functioning, but no single metric is strong enough yet to call it self-propelling.'
  };
}
