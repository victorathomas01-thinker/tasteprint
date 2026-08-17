import {
  LIVE_ARCHETYPES,
  LIVE_BADGES,
  LIVE_DIMENSIONS,
  LIVE_DIMENSION_COPY,
  LIVE_MODES,
  LIVE_QUESTIONS
} from './live-data.js';

const params = new URL(location.href).searchParams;
const ACTIVE = params.get('module') === 'live';
const app = document.querySelector('#app');
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const freshScores = () => Object.fromEntries(LIVE_DIMENSIONS.map((key) => [key, 50]));

let state = {
  screen: 'home',
  step: 0,
  scores: freshScores(),
  history: [],
  result: null,
  recordedSignature: ''
};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function applyDelta(scores, delta = {}) {
  const next = { ...scores };
  for (const [key, value] of Object.entries(delta)) {
    if (key in next) next[key] = clamp(next[key] + value);
  }
  return next;
}

function influence(delta = {}) {
  return Object.values(delta).reduce((sum, value) => sum + Math.abs(value), 0);
}

function distance(scores, vector) {
  return Math.sqrt(LIVE_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / LIVE_DIMENSIONS.length);
}

function rank(scores, list) {
  return list
    .map((item) => ({ item, distance: distance(scores, item.vector) }))
    .sort((a, b) => a.distance - b.distance);
}

function fitLabel(ranked) {
  const first = ranked[0]?.distance ?? 0;
  const second = ranked[1]?.distance ?? first;
  const margin = second - first;
  const ratio = margin / Math.max(second, 1);
  return ratio > 0.14 ? 'Very clear fit' : ratio > 0.07 ? 'Clear fit' : 'Blended fit';
}

function dynamicBadges(scores) {
  const candidates = LIVE_BADGES
    .filter(([, , key, threshold]) => scores[key] >= threshold)
    .sort((a, b) => scores[b[2]] - scores[a[2]]);
  const fallbacks = [
    ['🏡', 'Home Base', 'comfort'],
    ['🧭', 'Place Curious', 'discovery'],
    ['🔑', 'Everyday Fit', 'access'],
    ['🌿', 'Lifestyle Aware', 'quiet']
  ];
  for (const badge of fallbacks) {
    if (candidates.length >= 3) break;
    if (!candidates.some((item) => item[2] === badge[2])) candidates.push(badge);
  }
  return candidates.slice(0, 3);
}

function strongest(scores) {
  return LIVE_DIMENSIONS
    .map((key) => ({ key, value: scores[key], distance: Math.abs(scores[key] - 50) }))
    .sort((a, b) => b.distance - a.distance)[0];
}

function tension(scores) {
  if (scores.access >= 78 && scores.quiet >= 78) {
    return ['Connected, not consumed.', 'You want easy access to the wider world without bringing all of its noise into the place where you recover. Convenience and calm are both real requirements for you.'];
  }
  if (scores.discovery >= 78 && scores.rootedness >= 76) {
    return ['Explore without becoming anonymous.', 'Newness matters, but so does belonging somewhere long enough for routines and recognition to accumulate. You want discovery from a base, not permanent detachment.'];
  }
  if (scores.community >= 78 && scores.quiet >= 74) {
    return ['Neighborly, not nonstop.', 'You like people woven into everyday life, but you still need enough quiet that connection feels available rather than mandatory.'];
  }
  if (scores.aesthetic >= 80 && scores.comfort >= 78) {
    return ['Beautiful enough to use.', 'You are not looking for a showroom. Design matters most when it makes ordinary living feel better, easier or more personal.'];
  }
  if (scores.routine >= 76 && scores.flexibility >= 72) {
    return ['Anchors without handcuffs.', 'You like dependable rhythms, but the ideal environment still lets your plans and circumstances change without breaking the whole setup.'];
  }
  if (scores.pace >= 76 && scores.rootedness >= 72) {
    return ['Energy with a home field.', 'You enjoy visible momentum around you, but the best version still has regular places and familiar people that keep the environment from feeling interchangeable.'];
  }
  return ['More mixed than one address.', 'Your archetype is a center of gravity, not a relocation verdict. The mode, badges and strongest pulls show the different jobs you want an everyday environment to do.'];
}

function definingCopy(key, value) {
  const high = {
    discovery: 'You like an environment that keeps revealing new corners, routines and reasons to leave the house.',
    routine: 'Familiar rhythms make a place more useful and emotionally legible over time.',
    community: 'Everyday proximity to people can make the week feel richer even when no major social plan is happening.',
    aesthetic: 'Light, layout, materials and visual character affect how much you enjoy the space more than they do for some people.',
    comfort: 'The home base itself needs to give something back. Comfort is not merely a luxury layer for you.',
    pace: 'Some visible motion around you makes ordinary life feel more alive.',
    quiet: 'Low noise and enough mental breathing room meaningfully change how restorative a place feels.',
    rootedness: 'Attachment grows through recognition, repeated places and the sense that your life has left a small imprint there.',
    access: 'Being able to reach people, errands, culture or activity with little friction changes the value of the whole environment.',
    flexibility: 'You prefer a living setup that can bend when work, relationships, interests or plans change.'
  };
  const low = {
    discovery: 'You do not need constant novelty from your neighborhood. Familiarity can deepen rather than become boring.',
    routine: 'You are less attached to one fixed rhythm and more comfortable rebuilding the shape of a week as needed.',
    community: 'A good home does not have to come with an active neighborhood social layer. Privacy can be part of the fit.',
    aesthetic: 'You can forgive plain surroundings when the practical parts of everyday life work well.',
    comfort: 'You are more willing to trade some home comfort for access, activity or another priority outside the front door.',
    pace: 'A place does not need visible motion to feel alive to you. Slower can be a feature.',
    quiet: 'Some ambient stimulation, street life or background activity can feel energizing rather than intrusive.',
    rootedness: 'You do not need a place to become part of your identity before it can work well for this phase of life.',
    access: 'You can tolerate more distance from activity when the home base itself gives you enough of what you need.',
    flexibility: 'Once the environment fits, you may prefer committing to it instead of keeping every future option open.'
  };
  return value >= 50 ? high[key] : low[key];
}

function makeResult() {
  const archetypes = rank(state.scores, LIVE_ARCHETYPES);
  const modes = rank(state.scores, LIVE_MODES);
  return {
    scores: { ...state.scores },
    archetype: archetypes[0].item,
    archetypeRanks: archetypes,
    mode: modes[0].item,
    modeRanks: modes,
    badges: dynamicBadges(state.scores),
    fit: fitLabel(archetypes),
    history: [...state.history]
  };
}

function track(name, properties = {}) {
  window.TasteprintAnalytics?.track?.(name, { module: 'live', ...properties });
}

function signatureFor(result) {
  return `live:${LIVE_DIMENSIONS.map((key) => result.scores[key]).join('.')}:${result.archetype.name}:${result.mode.name}`;
}

function recordResult(result) {
  const signature = signatureFor(result);
  if (state.recordedSignature === signature) return;
  state.recordedSignature = signature;
  window.dispatchEvent(new CustomEvent('tasteprint:module-complete', {
    detail: {
      moduleId: 'live',
      scores: result.scores,
      archetype: result.archetype.name,
      mode: result.mode.name,
      source: 'quiz',
      signature
    }
  }));
  track('quiz_complete', { archetype: result.archetype.name, mode: result.mode.name });
  track('result_view', { archetype: result.archetype.name, mode: result.mode.name });
}

function announce(message) {
  const live = document.querySelector('#a11y-status');
  if (live) live.textContent = message;
}

function homeView() {
  return `<section class="panel live-shell">
    <div class="live-hero">
      <div class="eyebrow">Tasteprint · Live</div>
      <h1>What kind of everyday environment actually fits you?</h1>
      <p class="lede">Choose between real home-and-neighborhood tradeoffs. Live turns them into an environment archetype, a living mode, and the preferences hiding underneath labels like city person or homebody.</p>
      <div class="row live-start-row">
        <button class="primary" type="button" data-live-start>Find my Live Tasteprint</button>
        <span class="small">8 choices · about 45 seconds · no signup</span>
      </div>
      <div class="live-home-links"><a href="?modules=1">All modules</a><a href="?profile=1">My Passport</a></div>
    </div>
    <div class="live-gridmark" aria-hidden="true"><div><span>01</span><strong>HOME</strong></div><div><span>02</span><strong>PEOPLE</strong></div><div><span>03</span><strong>PACE</strong></div><div><span>04</span><strong>PLACE</strong></div></div>
  </section>`;
}

function quizView() {
  const question = LIVE_QUESTIONS[state.step];
  const pct = state.step / LIVE_QUESTIONS.length * 100;
  return `<section class="panel pad live-shell">
    <div class="row spread"><div><div class="eyebrow">Tasteprint · Live</div><div class="small">Choice ${state.step + 1} of ${LIVE_QUESTIONS.length}</div></div><a class="small live-exit" href="?modules=1">Exit</a></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <h2 class="live-question">${esc(question.title)}</h2>
    <p class="small">${esc(question.subtitle)}</p>
    <div class="choice-grid live-choice-grid">${question.options.map((option, index) => `<button class="choice live-choice" type="button" data-live-option="${index}"><span class="icon">${option[0]}</span><strong>${esc(option[1])}</strong><span>${esc(option[2])}</span></button>`).join('')}</div>
  </section>`;
}

function analyzeView() {
  return `<section class="panel pad live-analyze"><div class="eyebrow">Reading the environment</div><h2>Your ideal place is doing more jobs than “city versus suburbs.”</h2><p class="small">Good. Everyday fit is usually a bundle of access, quiet, people, pace, comfort and attachment.</p><div class="progress"><div style="width:94%"></div></div></section>`;
}

function resultView() {
  const result = state.result;
  const scores = result.scores;
  const defining = strongest(scores);
  const [tensionTitle, tensionCopy] = tension(scores);
  const fingerprint = [...result.history].sort((a, b) => b.impact - a.impact).slice(0, 3);
  const curveball = result.modeRanks[1].item;
  const inverse = result.modeRanks.at(-1).item;
  const axes = ['access', 'quiet', 'community', 'aesthetic', 'routine', 'flexibility'];

  return `<section class="panel pad live-result live-shell">
    <div class="live-result-head">
      <div><div class="eyebrow">Your Live archetype</div><div class="row live-title-row"><h2>${esc(result.archetype.name)}</h2><span class="badge">${esc(result.fit)}</span></div><p class="lede">${esc(result.archetype.copy)}</p></div>
      <a class="secondary" href="?profile=1">Open Passport</a>
    </div>
    <div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div>

    <div class="live-result-grid">
      <div class="live-axes"><div class="eyebrow">Your environment shape</div><p class="small">Continuums, not grades.</p>${axes.map((key) => {
        const [left, right, label] = LIVE_DIMENSION_COPY[key];
        return `<div class="continuum"><div class="continuum-labels"><span>${esc(left)}</span><strong>${esc(label)}</strong><span>${esc(right)}</span></div><div class="track"><div class="track-fill" style="width:${scores[key]}%"></div><div class="marker" style="left:${scores[key]}%"></div></div></div>`;
      }).join('')}</div>
      <div class="live-insights">
        <div class="callout"><div class="eyebrow">Your living mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><p class="small">${esc(result.mode.copy)}</p></div>
        <div class="card"><div class="eyebrow">Your contradiction</div><h3>${esc(tensionTitle)}</h3><p class="small">${esc(tensionCopy)}</p></div>
        <div class="card"><div class="eyebrow">Most defining pull</div><h3>${esc(LIVE_DIMENSION_COPY[defining.key][2])}</h3><p class="small">${esc(definingCopy(defining.key, defining.value))}</p></div>
      </div>
    </div>

    <div class="live-section"><div class="eyebrow">What tends to fit</div><h2>Environment signals, not a housing verdict.</h2><div class="grid-3">${result.mode.anchors.map((anchor, index) => `<div class="card live-anchor"><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(anchor)}</h3></div>`).join('')}</div><p class="small live-disclaimer">Live describes preference patterns. It does not evaluate housing cost, safety, accessibility needs, legal constraints, commute feasibility or whether a specific move is right for you.</p></div>

    <div class="live-section"><div class="eyebrow">Decision fingerprint</div><div class="grid-3">${fingerprint.map((item) => `<div class="card"><div class="live-fingerprint-icon">${item.icon}</div><h3>${esc(item.label)}</h3><p class="small">${esc(item.note)}</p></div>`).join('')}</div></div>

    <div class="live-result-grid live-mode-pair">
      <div class="card"><div class="eyebrow">Curveball mode</div><h3>${curveball.icon} ${esc(curveball.name)}</h3><p class="small">Close enough to match part of your everyday taste, different enough to reveal another way those same preferences could be expressed.</p></div>
      <div class="card"><div class="eyebrow">Probably not your default</div><h3>${inverse.icon} ${esc(inverse.name)}</h3><p class="small">The least aligned living mode for this result. Not a bad environment, just organized around rewards you seem to value less.</p></div>
    </div>

    <div class="live-result-grid live-share-grid">
      <div><div class="eyebrow">Story card preview</div><div class="story live-story"><div><div class="eyebrow">Tasteprint · Live</div><h2>${esc(result.archetype.name)}</h2><div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div></div><div><div class="small">My living mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><div class="small">Strongest pull: ${esc(LIVE_DIMENSION_COPY[defining.key][2])}</div><div class="small">Passport can now compare all six Tasteprint domains.</div></div></div></div>
      <div class="callout live-next"><div class="eyebrow">Six domains complete</div><h3>Your Passport can finally use the full original Tasteprint lineup.</h3><p class="small">Escape, Wear, Watch, Move, Eat and Live each contribute one equal vote. A cross-domain pattern now has six very different places to survive or disappear.</p><a class="secondary" href="?profile=1">See my Passport</a><a class="secondary" href="?modules=1">Explore all modules</a></div>
    </div>

    <div class="row live-bottom-actions"><button class="secondary" type="button" data-live-retake>Retake Live</button><a class="secondary" href="?module=eat">Take Eat</a><a class="secondary" href="?module=move">Take Move</a><a class="secondary" href="?module=watch">Take Watch</a></div>
  </section>`;
}

function render() {
  if (!ACTIVE) return;
  document.documentElement.dataset.module = 'live';
  document.title = 'Tasteprint Live';
  if (state.screen === 'home') app.innerHTML = homeView();
  else if (state.screen === 'quiz') app.innerHTML = quizView();
  else if (state.screen === 'analyze') app.innerHTML = analyzeView();
  else app.innerHTML = resultView();

  app.querySelector('[data-live-start]')?.addEventListener('click', () => {
    state = { ...state, screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
    track('quiz_start');
    render();
  });

  app.querySelectorAll('[data-live-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const option = LIVE_QUESTIONS[state.step].options[Number(button.dataset.liveOption)];
      state.scores = applyDelta(state.scores, option[3]);
      state.history.push({ icon: option[0], label: option[1], note: option[2], impact: influence(option[3]) });
      track('quiz_step', { step: state.step + 1, total: LIVE_QUESTIONS.length });
      state.step += 1;
      if (state.step >= LIVE_QUESTIONS.length) {
        state.screen = 'analyze';
        render();
        setTimeout(() => {
          state.result = makeResult();
          state.screen = 'result';
          render();
          recordResult(state.result);
          announce(`Your Live archetype is ${state.result.archetype.name}.`);
        }, 650);
      } else render();
    });
  });

  app.querySelector('[data-live-retake]')?.addEventListener('click', () => {
    state = { ...state, screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
    track('quiz_start', { retake: true });
    render();
  });
}

render();
