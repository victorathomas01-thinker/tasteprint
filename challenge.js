import { DIMENSIONS, QUESTIONS, ARCHETYPES, TRAVEL_MODES } from './data.js';

const VERSION = '1';
const VALUE_WIDTH = 2;
const PAYLOAD_LENGTH = 1 + DIMENSIONS.length * VALUE_WIDTH + 2;
const app = document.querySelector('#app');

let trackedScores = freshScores();
let multiSelections = new Set();
let challengerScores = readScoresParam('challenge');
let sharedResultScores = readScoresParam('result');

function freshScores() {
  return Object.fromEntries(DIMENSIONS.map((key) => [key, 50]));
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function applyDelta(scores, delta) {
  const next = { ...scores };
  for (const [key, value] of Object.entries(delta || {})) {
    if (key in next) next[key] = clamp(next[key] + value);
  }
  return next;
}

function distance(a, b) {
  return Math.sqrt(
    DIMENSIONS.reduce((sum, key) => sum + (a[key] - b[key]) ** 2, 0) /
      DIMENSIONS.length
  );
}

function nearest(scores, collection) {
  return collection
    .map((item) => ({ item, distance: distance(scores, item.vector) }))
    .sort((a, b) => a.distance - b.distance)[0].item;
}

function profileFor(scores) {
  return {
    scores,
    archetype: nearest(scores, ARCHETYPES),
    mode: nearest(scores, TRAVEL_MODES)
  };
}

function checksum(body) {
  let value = 0;
  for (let i = 0; i < body.length; i += 1) {
    value = (value * 31 + body.charCodeAt(i)) % 1296;
  }
  return value.toString(36).padStart(2, '0');
}

function encodeScores(scores) {
  const body =
    VERSION +
    DIMENSIONS.map((key) => clamp(scores[key]).toString(36).padStart(VALUE_WIDTH, '0')).join('');
  return body + checksum(body);
}

function decodeScores(payload) {
  if (!payload || payload.length !== PAYLOAD_LENGTH || payload[0] !== VERSION) return null;

  const body = payload.slice(0, -2);
  if (checksum(body) !== payload.slice(-2)) return null;

  const values = [];
  for (let index = 1; index < body.length; index += VALUE_WIDTH) {
    const value = Number.parseInt(body.slice(index, index + VALUE_WIDTH), 36);
    if (!Number.isFinite(value) || value < 0 || value > 100) return null;
    values.push(value);
  }

  if (values.length !== DIMENSIONS.length) return null;
  return Object.fromEntries(DIMENSIONS.map((key, index) => [key, values[index]]));
}

function readScoresParam(name) {
  const url = new URL(window.location.href);
  return decodeScores(url.searchParams.get(name));
}

function cleanBaseURL() {
  const url = new URL(window.location.href);
  url.searchParams.delete('challenge');
  url.searchParams.delete('result');
  url.hash = '';
  return url;
}

function makeURL(type, scores) {
  const url = cleanBaseURL();
  url.searchParams.set(type, encodeScores(scores));
  return url.toString();
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function currentQuestionIndex() {
  const node = [...document.querySelectorAll('.small')].find((element) =>
    /Choice\s+\d+\s+of\s+\d+/i.test(element.textContent || '')
  );
  const match = node?.textContent?.match(/Choice\s+(\d+)\s+of/i);
  return match ? Number(match[1]) - 1 : -1;
}

function resetTracker() {
  trackedScores = freshScores();
  multiSelections = new Set();
}

function trackOptionClick(button) {
  const questionIndex = currentQuestionIndex();
  const optionIndex = Number(button.dataset.option);
  const question = QUESTIONS[questionIndex];
  const option = question?.options?.[optionIndex];
  if (!question || !option) return;

  if (!question.multi) {
    trackedScores = applyDelta(trackedScores, option[3]);
    return;
  }

  if (multiSelections.has(optionIndex)) {
    multiSelections.delete(optionIndex);
  } else if (multiSelections.size < question.multi) {
    multiSelections.add(optionIndex);
  }
}

function commitTrackedMulti() {
  const questionIndex = currentQuestionIndex();
  const question = QUESTIONS[questionIndex];
  if (!question?.multi || multiSelections.size !== question.multi) return;

  for (const optionIndex of multiSelections) {
    trackedScores = applyDelta(trackedScores, question.options[optionIndex][3]);
  }
  multiSelections = new Set();
}

function compatibility(a, b) {
  const averageDifference =
    DIMENSIONS.reduce((sum, key) => sum + Math.abs(a[key] - b[key]), 0) /
    DIMENSIONS.length;
  return Math.max(43, Math.min(98, Math.round(100 - averageDifference * 1.2)));
}

function sharedTrait(a, b) {
  return DIMENSIONS
    .map((key) => ({
      key,
      difference: Math.abs(a[key] - b[key]),
      average: (a[key] + b[key]) / 2
    }))
    .sort((x, y) => x.difference - y.difference || y.average - x.average)[0];
}

function frictionTrait(a, b) {
  return DIMENSIONS
    .map((key) => ({
      key,
      difference: Math.abs(a[key] - b[key]),
      friend: a[key],
      you: b[key]
    }))
    .sort((x, y) => y.difference - x.difference)[0];
}

function averageProfile(a, b) {
  return Object.fromEntries(DIMENSIONS.map((key) => [key, (a[key] + b[key]) / 2]));
}

function pairType(avg, pct) {
  if (pct < 62) return 'Opposites on PTO';
  if (avg.romance > 80 && avg.serenity > 78) return 'Soft-Life Sweethearts';
  if (avg.social > 82 && avg.novelty > 86) return 'Beautiful Chaos Duo';
  if (avg.culture > 78) return 'Culture Co-Conspirators';
  if (avg.activity > 78) return 'Adventure Pact';
  if (avg.comfort > 82 && avg.serenity > 80) return 'Soft-Life Alliance';
  if (avg.spontaneity > 75) return 'Loose-Itinerary Legends';
  if (avg.structure > 66) return 'Booked & Busy';
  return 'Compatible Escapists';
}

function frictionCopy(friction) {
  const friendHigher = friction.friend > friction.you;
  const high = friendHigher ? 'Your friend' : 'You';
  const low = friendHigher ? 'you' : 'your friend';
  const copy = {
    structure: `${high} wants more of a plan. ${low} is more likely to ask why vacation suddenly has a project manager.`,
    social: `${high} wants more shared energy. ${low} will eventually begin plotting an escape back to the hotel.`,
    comfort: `${high} cares more about comfort and polish. ${low} is more willing to say “it’s fine” about a suspicious room.`,
    novelty: `${high} needs the trip to feel new. ${low} is more willing to repeat something that already works.`,
    activity: `${high} is trying to DO something. ${low} may consider walking to breakfast sufficient physical activity.`,
    romance: `${high} wants more atmosphere. ${low} is more likely to ask whether the sunset requires a reservation.`,
    culture: `${high} wants more context. ${low} may eventually beg to leave the third museum.`,
    serenity: `${high} needs more breathing room. ${low} is more willing to stack the day until the itinerary becomes a threat.`,
    aesthetic: `${high} cares more about how the place feels visually. ${low} will tolerate ugly if the experience is good.`,
    spontaneity: `${high} wants more blank space. ${low} would prefer that at least somebody knows what is happening.`
  };
  return copy[friction.key];
}

function compromiseCopy(key) {
  return {
    structure: 'Book the things that can sell out, then deliberately leave the rest unfinished.',
    social: 'Build in one social anchor and one guilt-free period where nobody has to entertain anybody.',
    comfort: 'Spend on the shared base, then let the more flexible person win on activities.',
    novelty: 'Choose a reliable home base with unfamiliar neighborhoods or day trips.',
    activity: 'Alternate one genuinely active day with one day where doing less is allowed.',
    romance: 'Plan one deliberately special moment and let the rest earn its feelings naturally.',
    culture: 'Choose one cultural anchor per day rather than turning the trip into a field trip.',
    serenity: 'Protect one empty block every day before adding another reservation.',
    aesthetic: 'Spend on one visually memorable part instead of requiring everything to look perfect.',
    spontaneity: 'Use anchor points instead of a full itinerary: where you sleep, one major plan, freedom between them.'
  }[key];
}

function addChallengeIntro() {
  if (!challengerScores || sharedResultScores) return;
  const hero = document.querySelector('.hero');
  if (!hero || hero.dataset.challengeIntro === 'true') return;
  hero.dataset.challengeIntro = 'true';

  const friendProfile = profileFor(challengerScores);
  const banner = document.createElement('div');
  banner.className = 'challenge-banner';
  banner.innerHTML = `
    <div class="eyebrow">Friend challenge received</div>
    <h3>${escapeHTML(friendProfile.archetype.name)} is waiting for you.</h3>
    <p class="small">A friend sent you their travel Tasteprint. Take yours to unlock your match, biggest disagreement, and the destination that fits both of you.</p>
  `;

  const firstEyebrow = hero.querySelector('.eyebrow');
  firstEyebrow?.insertAdjacentElement('beforebegin', banner);
  const startButton = hero.querySelector('[data-action="start"]');
  if (startButton) startButton.textContent = 'Take mine & compare';
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
}

async function shareURL(url, title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }

  try {
    if (await copyText(url)) return 'copied';
  } catch (error) {
    console.warn('Clipboard unavailable', error);
  }

  return 'show';
}

function addLinkTools() {
  const soloStory = [...document.querySelectorAll('.story')].find((story) =>
    !/together/i.test(story.querySelector('.eyebrow')?.textContent || '')
  );
  if (!soloStory || soloStory.dataset.challengeReady === 'true') return;
  soloStory.dataset.challengeReady = 'true';

  const challengeURL = makeURL('challenge', trackedScores);
  const resultURL = makeURL('result', trackedScores);
  const tools = document.createElement('div');
  tools.className = 'challenge-tools';
  tools.innerHTML = `
    <div class="eyebrow">Send the interactive version</div>
    <h3>Compare without handing over your phone.</h3>
    <p class="small">The challenge link contains only this Tasteprint score vector. No account, name, or email is included.</p>
    <div class="challenge-actions">
      <button type="button" class="primary send-challenge">Send friend challenge</button>
      <button type="button" class="secondary copy-result">Copy result link</button>
    </div>
    <input class="challenge-link hidden" readonly aria-label="Tasteprint share link" />
    <p class="small challenge-status" aria-live="polite"></p>
  `;

  const shareTools = soloStory.nextElementSibling?.classList.contains('share-tools')
    ? soloStory.nextElementSibling
    : soloStory;
  shareTools.insertAdjacentElement('afterend', tools);

  tools.querySelector('.send-challenge').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const previous = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparing challenge…';
    const result = await shareURL(
      challengeURL,
      'Compare Tasteprints',
      'Take Tasteprint Escape and see whether we should actually travel together.'
    );
    button.disabled = false;
    button.textContent = previous;
    showLinkOutcome(tools, challengeURL, result, 'Challenge link copied.');
  });

  tools.querySelector('.copy-result').addEventListener('click', async () => {
    let result = 'show';
    try {
      result = (await copyText(resultURL)) ? 'copied' : 'show';
    } catch (error) {
      console.warn(error);
    }
    showLinkOutcome(tools, resultURL, result, 'Result link copied.');
  });
}

function showLinkOutcome(tools, url, result, copiedMessage) {
  const input = tools.querySelector('.challenge-link');
  const status = tools.querySelector('.challenge-status');
  if (result === 'cancelled') {
    status.textContent = '';
    return;
  }
  if (result === 'shared') {
    status.textContent = 'Challenge ready to send.';
    return;
  }
  if (result === 'copied') {
    status.textContent = copiedMessage;
    return;
  }
  input.value = url;
  input.classList.remove('hidden');
  input.focus();
  input.select();
  status.textContent = 'Copy this link and send it to a friend.';
}

function addRemoteComparison() {
  if (!challengerScores) return;
  const soloStory = [...document.querySelectorAll('.story')].find((story) =>
    !/together/i.test(story.querySelector('.eyebrow')?.textContent || '')
  );
  const panel = soloStory?.closest('.panel');
  if (!soloStory || !panel || panel.dataset.remoteMatch === 'true') return;
  panel.dataset.remoteMatch = 'true';

  const friendProfile = profileFor(challengerScores);
  const yourProfile = profileFor(trackedScores);
  const pct = compatibility(challengerScores, trackedScores);
  const shared = sharedTrait(challengerScores, trackedScores);
  const friction = frictionTrait(challengerScores, trackedScores);
  const average = averageProfile(challengerScores, trackedScores);
  const sharedMode = nearest(average, TRAVEL_MODES);
  const pairName = pairType(average, pct);
  const destination = sharedMode.places[0];

  const section = document.createElement('section');
  section.className = 'remote-match';
  section.innerHTML = `
    <div class="eyebrow">Remote Tasteprint match unlocked</div>
    <div class="remote-match-head">
      <div class="remote-score">${pct}%</div>
      <div>
        <div class="eyebrow">${escapeHTML(pairName)}</div>
        <h2>You actually compared.</h2>
        <p class="small">${escapeHTML(friendProfile.archetype.name)} × ${escapeHTML(yourProfile.archetype.name)}</p>
      </div>
    </div>
    <div class="grid-3 remote-grid">
      <div class="card">
        <div class="eyebrow">Closest agreement</div>
        <h3>${escapeHTML(titleCase(shared.key))}</h3>
        <p class="small">Only ${Math.round(shared.difference)} points apart on this preference.</p>
      </div>
      <div class="card">
        <div class="eyebrow">Likely argument</div>
        <h3>${escapeHTML(titleCase(friction.key))}</h3>
        <p class="small">${escapeHTML(frictionCopy(friction))}</p>
      </div>
      <div class="card">
        <div class="eyebrow">Book together</div>
        <h3>${escapeHTML(destination[0])}</h3>
        <p class="small">${escapeHTML(destination[1])}</p>
      </div>
    </div>
    <div class="callout remote-compromise">
      <div class="eyebrow">The compromise</div>
      <p>${escapeHTML(compromiseCopy(friction.key))}</p>
    </div>
    <div class="story remote-story">
      <div>
        <div class="eyebrow">Tasteprint · Together</div>
        <h2>${pct}% MATCH</h2>
        <h3>${escapeHTML(pairName)}</h3>
        <div class="badges">
          <span class="badge">${escapeHTML(sharedMode.icon)} ${escapeHTML(sharedMode.name)}</span>
          <span class="badge">🤝 ${escapeHTML(shared.key)} aligned</span>
          <span class="badge">⚡ ${escapeHTML(friction.key)} friction</span>
        </div>
      </div>
      <div>
        <div class="small">Friend: ${escapeHTML(friendProfile.archetype.name)}</div>
        <div class="small">You: ${escapeHTML(yourProfile.archetype.name)}</div>
        <div class="small">Book together: ${escapeHTML(destination[0])}</div>
        <div class="small">Biggest friction: ${escapeHTML(friction.key)}</div>
      </div>
    </div>
  `;

  panel.appendChild(section);
}

function renderSharedResult() {
  if (!sharedResultScores) return false;
  if (app.dataset.sharedResult === 'true') return true;
  app.dataset.sharedResult = 'true';

  const profile = profileFor(sharedResultScores);
  const mode = profile.mode;
  const strongest = Object.entries(sharedResultScores)
    .sort((a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50))[0];

  app.innerHTML = `
    <section class="panel pad shared-result-view">
      <div class="eyebrow">Shared Tasteprint · Escape</div>
      <h1>${escapeHTML(profile.archetype.name)}</h1>
      <p class="lede">${escapeHTML(profile.archetype.copy)}</p>
      <div class="result-grid">
        <div class="callout">
          <div class="eyebrow">Travel mode</div>
          <h3>${escapeHTML(mode.icon)} ${escapeHTML(mode.name)}</h3>
          <p class="small">${escapeHTML(mode.copy)}</p>
        </div>
        <div class="card">
          <div class="eyebrow">Most defining pull</div>
          <h3>${escapeHTML(titleCase(strongest[0]))}</h3>
          <p class="small">This was the strongest deviation from the neutral midpoint in the shared profile.</p>
        </div>
      </div>
      <div class="grid-3" style="margin-top:18px">
        ${mode.places.slice(0, 3).map((place, index) => `
          <div class="card">
            <div class="eyebrow">${index === 0 ? 'Best fit' : index === 1 ? 'Same energy' : 'Also fits'}</div>
            <h3>${escapeHTML(place[0])}</h3>
            <p class="small">${escapeHTML(place[1])}</p>
          </div>
        `).join('')}
      </div>
      <div class="story" style="margin-top:22px">
        <div>
          <div class="eyebrow">Tasteprint · Escape</div>
          <h2>${escapeHTML(profile.archetype.name)}</h2>
          <div class="badges"><span class="badge">${escapeHTML(mode.icon)} ${escapeHTML(mode.name)}</span></div>
        </div>
        <div>
          <div class="small">Best fit: ${escapeHTML(mode.places[0][0])}</div>
          <div class="small">Shared result link</div>
        </div>
      </div>
      <div class="challenge-actions" style="margin-top:18px">
        <a class="primary button-link" href="${escapeHTML(makeURLForFreshStart())}">Take your own Tasteprint</a>
        <a class="secondary button-link" href="${escapeHTML(makeURL('challenge', sharedResultScores))}">Compare with this person</a>
      </div>
    </section>
  `;
  return true;
}

function makeURLForFreshStart() {
  return cleanBaseURL().toString();
}

function scan() {
  if (renderSharedResult()) return;
  addChallengeIntro();
  addLinkTools();
  addRemoteComparison();
}

document.addEventListener('click', (event) => {
  const option = event.target.closest('[data-option]');
  if (option) trackOptionClick(option);

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'start' || action === 'retake' || action === 'friend-start') resetTracker();
  if (action === 'continue') commitTrackedMulti();
}, true);

window.TasteprintLinks = {
  encodeScores,
  decodeScores,
  challengeURL: () => makeURL('challenge', trackedScores),
  resultURL: () => makeURL('result', trackedScores)
};

const observer = new MutationObserver(scan);
observer.observe(app, { childList: true, subtree: true });
scan();
