import {
  WEAR_ARCHETYPES,
  WEAR_BADGES,
  WEAR_DIMENSIONS,
  WEAR_DIMENSION_COPY,
  WEAR_MODES,
  WEAR_QUESTIONS
} from './wear-data.js';

const params = new URL(location.href).searchParams;
const ACTIVE = params.get('module') === 'wear';
const app = document.querySelector('#app');
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const freshScores = () => Object.fromEntries(WEAR_DIMENSIONS.map((key) => [key, 50]));

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
  return Math.sqrt(WEAR_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / WEAR_DIMENSIONS.length);
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
  const candidates = WEAR_BADGES
    .filter(([, , key, threshold]) => scores[key] >= threshold)
    .sort((a, b) => scores[b[2]] - scores[a[2]]);
  const fallbacks = [
    ['🪞', 'Intentional Enough', 'styling'],
    ['🧩', 'Wardrobe Translator', 'coordination'],
    ['🧶', 'Personal Reference', 'nostalgia'],
    ['👟', 'Wearability Matters', 'ease']
  ];
  for (const badge of fallbacks) {
    if (candidates.length >= 3) break;
    if (!candidates.some((item) => item[2] === badge[2])) candidates.push(badge);
  }
  return candidates.slice(0, 3);
}

function strongest(scores) {
  return WEAR_DIMENSIONS
    .map((key) => ({ key, value: scores[key], distance: Math.abs(scores[key] - 50) }))
    .sort((a, b) => b.distance - a.distance)[0];
}

function tension(scores) {
  if (scores.styling >= 76 && scores.ease >= 76) {
    return ['Polished, but not punished.', 'You want an outfit to look considered without making your body pay for the idea. Comfort is part of the styling brief.'];
  }
  if (scores.experimentation >= 76 && scores.coordination >= 72) {
    return ['Controlled experimentation.', 'You like risk more when the rest of the outfit gives it structure. Strange is good. Random is less convincing.'];
  }
  if (scores.nostalgia >= 74 && scores.experimentation >= 70) {
    return ['Old references, new combinations.', 'You are not trying to dress like a time capsule. The fun is pulling an older idea into a different context.'];
  }
  if (scores.visibility <= 46 && scores.styling >= 72) {
    return ['Understated is not accidental.', 'You can care a lot about clothes without wanting the room to notice first. Proportion and finish do the talking.'];
  }
  if (scores.ease >= 76 && scores.edge >= 70) {
    return ['Comfort with attitude.', 'You do not see ease and edge as opposites. The ideal piece feels good enough to live in and specific enough to remember.'];
  }
  if (scores.impulse >= 70 && scores.detail >= 72) {
    return ['A collector who improvises.', 'You notice tiny things, but you do not necessarily want a rigid formula. The outfit can come together by instinct.'];
  }
  return ['More mixed than one label.', 'Your archetype is the center of gravity, not a uniform. The mode, badges and strongest pulls catch the parts that do not fit neatly.'];
}

function definingCopy(key, value) {
  const high = {
    experimentation: 'New proportions, references or combinations make getting dressed more interesting.',
    coordination: 'You relax more when the pieces look like they belong in the same sentence.',
    visibility: 'Being noticed is not automatically a downside. Presence can be part of the point.',
    styling: 'Silhouette and composition matter enough that “technically fine” is not always good enough.',
    ease: 'You are much more likely to repeat clothes that cooperate with your body and your day.',
    edge: 'A little tension, attitude or sharpness keeps an outfit from feeling anonymous.',
    calm: 'Visual quiet makes clothes easier to live with and easier to combine.',
    nostalgia: 'References, memory and a sense of history make pieces feel richer.',
    detail: 'Small construction choices can matter more to you than obvious branding.',
    impulse: 'You like enough freedom to discover the outfit instead of fully pre-writing it.'
  };
  const low = {
    experimentation: 'You would rather refine a reliable language than chase novelty for its own sake.',
    coordination: 'Too much matching can make an outfit feel solved before you even put it on.',
    visibility: 'You do not need the outfit to enter the room before you do.',
    styling: 'Function and feel can outrank the need to make every outfit visually composed.',
    ease: 'You will tolerate some inconvenience when the visual payoff is worth it.',
    edge: 'You lean toward softness and longevity over clothes that need to prove a point.',
    calm: 'You can handle more visual information before an outfit starts feeling noisy.',
    nostalgia: 'You are less attached to the past than to whether a piece works right now.',
    detail: 'The overall impression matters more than obsessing over every small construction cue.',
    impulse: 'You prefer knowing the outfit works before the door is already closing behind you.'
  };
  return value >= 50 ? high[key] : low[key];
}

function makeResult() {
  const archetypes = rank(state.scores, WEAR_ARCHETYPES);
  const modes = rank(state.scores, WEAR_MODES);
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
  window.TasteprintAnalytics?.track?.(name, { module: 'wear', ...properties });
}

function signatureFor(result) {
  return `wear:${WEAR_DIMENSIONS.map((key) => result.scores[key]).join('.')}:${result.archetype.name}:${result.mode.name}`;
}

function recordResult(result) {
  const signature = signatureFor(result);
  if (state.recordedSignature === signature) return;
  state.recordedSignature = signature;
  window.dispatchEvent(new CustomEvent('tasteprint:module-complete', {
    detail: {
      moduleId: 'wear',
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
  return `<section class="panel wear-shell">
    <div class="wear-hero">
      <div class="eyebrow">Tasteprint · Wear</div>
      <h1>What does your closet think you like?</h1>
      <p class="lede">Choose between real wardrobe tradeoffs. Wear turns those decisions into a style archetype, a dressing mode, and the visual instincts you keep repeating.</p>
      <div class="row wear-start-row">
        <button class="primary" type="button" data-wear-start>Find my Wear Tasteprint</button>
        <span class="small">8 choices · about 45 seconds · no signup</span>
      </div>
      <div class="wear-home-links"><a href="?modules=1">All modules</a><a href="?profile=1">My Passport</a></div>
    </div>
    <div class="wear-hero-card" aria-hidden="true">
      <div class="wear-swatch wear-swatch-a"></div><div class="wear-swatch wear-swatch-b"></div><div class="wear-swatch wear-swatch-c"></div>
      <div class="wear-card-copy"><span>STYLE IS A PATTERN</span><strong>not a dress code.</strong></div>
    </div>
  </section>`;
}

function quizView() {
  const question = WEAR_QUESTIONS[state.step];
  const pct = state.step / WEAR_QUESTIONS.length * 100;
  return `<section class="panel pad wear-shell">
    <div class="row spread"><div><div class="eyebrow">Tasteprint · Wear</div><div class="small">Choice ${state.step + 1} of ${WEAR_QUESTIONS.length}</div></div><a class="small wear-exit" href="?modules=1">Exit</a></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <h2 class="wear-question">${esc(question.title)}</h2>
    <p class="small">${esc(question.subtitle)}</p>
    <div class="choice-grid wear-choice-grid">${question.options.map((option, index) => `<button class="choice wear-choice" type="button" data-wear-option="${index}"><span class="icon">${option[0]}</span><strong>${esc(option[1])}</strong><span>${esc(option[2])}</span></button>`).join('')}</div>
  </section>`;
}

function analyzeView() {
  return `<section class="panel pad wear-analyze"><div class="eyebrow">Reading the closet</div><h2>Your choices are arguing about whether style should behave.</h2><p class="small">Good. A wardrobe with no contradictions usually belongs to a mannequin.</p><div class="progress"><div style="width:94%"></div></div></section>`;
}

function resultView() {
  const result = state.result;
  const scores = result.scores;
  const defining = strongest(scores);
  const [tensionTitle, tensionCopy] = tension(scores);
  const fingerprint = [...result.history].sort((a, b) => b.impact - a.impact).slice(0, 3);
  const curveball = result.modeRanks[1].item;
  const inverse = result.modeRanks.at(-1).item;
  const axes = ['styling', 'experimentation', 'ease', 'coordination', 'visibility', 'nostalgia'];

  return `<section class="panel pad wear-result wear-shell">
    <div class="wear-result-head">
      <div><div class="eyebrow">Your Wear archetype</div><div class="row wear-title-row"><h2>${esc(result.archetype.name)}</h2><span class="badge">${esc(result.fit)}</span></div><p class="lede">${esc(result.archetype.copy)}</p></div>
      <a class="secondary" href="?profile=1">Open Passport</a>
    </div>
    <div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div>

    <div class="wear-result-grid">
      <div class="wear-axes"><div class="eyebrow">Your style shape</div><p class="small">Continuums, not grades.</p>${axes.map((key) => {
        const [left, right, label] = WEAR_DIMENSION_COPY[key];
        return `<div class="continuum"><div class="continuum-labels"><span>${esc(left)}</span><strong>${esc(label)}</strong><span>${esc(right)}</span></div><div class="track"><div class="track-fill" style="width:${scores[key]}%"></div><div class="marker" style="left:${scores[key]}%"></div></div></div>`;
      }).join('')}</div>
      <div class="wear-insights">
        <div class="callout"><div class="eyebrow">Your dressing mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><p class="small">${esc(result.mode.copy)}</p></div>
        <div class="card"><div class="eyebrow">Your contradiction</div><h3>${esc(tensionTitle)}</h3><p class="small">${esc(tensionCopy)}</p></div>
        <div class="card"><div class="eyebrow">Most defining pull</div><h3>${esc(WEAR_DIMENSION_COPY[defining.key][2])}</h3><p class="small">${esc(definingCopy(defining.key, defining.value))}</p></div>
      </div>
    </div>

    <div class="wear-section"><div class="eyebrow">Build around this</div><h2>A wardrobe direction, not a shopping list.</h2><div class="grid-3">${result.mode.anchors.map((anchor, index) => `<div class="card wear-anchor"><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(anchor)}</h3></div>`).join('')}</div></div>

    <div class="wear-section"><div class="eyebrow">Decision fingerprint</div><div class="grid-3">${fingerprint.map((item) => `<div class="card"><div class="wear-fingerprint-icon">${item.icon}</div><h3>${esc(item.label)}</h3><p class="small">${esc(item.note)}</p></div>`).join('')}</div></div>

    <div class="wear-result-grid wear-mode-pair">
      <div class="card"><div class="eyebrow">Curveball direction</div><h3>${curveball.icon} ${esc(curveball.name)}</h3><p class="small">Close enough to make sense, different enough to show another version of the same taste.</p></div>
      <div class="card"><div class="eyebrow">Probably not your closet</div><h3>${inverse.icon} ${esc(inverse.name)}</h3><p class="small">The least aligned dressing mode for this particular result. Not forbidden, just less naturally you.</p></div>
    </div>

    <div class="wear-result-grid wear-share-grid">
      <div><div class="eyebrow">Story card preview</div><div class="story wear-story"><div><div class="eyebrow">Tasteprint · Wear</div><h2>${esc(result.archetype.name)}</h2><div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div></div><div><div class="small">My dressing mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><div class="small">Strongest pull: ${esc(WEAR_DIMENSION_COPY[defining.key][2])}</div><div class="small">Tasteprint Passport: 2 modules can now build one cross-domain map.</div></div></div></div>
      <div class="callout wear-next"><div class="eyebrow">Your Passport gets smarter</div><h3>Wear is a second vote.</h3><p class="small">If you already completed Escape, your master Tasteprint now combines travel and style instead of pretending one category describes everything.</p><div class="row"><a class="primary" href="?profile=1">See my Passport</a><button class="secondary" type="button" data-wear-retake>Retake Wear</button></div></div>
    </div>
  </section>`;
}

function render() {
  if (!ACTIVE) return;
  if (state.screen === 'home') app.innerHTML = homeView();
  else if (state.screen === 'quiz') app.innerHTML = quizView();
  else if (state.screen === 'analyze') app.innerHTML = analyzeView();
  else if (state.screen === 'result') app.innerHTML = resultView();
  requestAnimationFrame(() => app.focus({ preventScroll: true }));
}

function start() {
  state = { screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
  track('quiz_start', { choices: WEAR_QUESTIONS.length });
  announce('Tasteprint Wear started. Choice 1 of 8.');
  render();
}

function choose(index) {
  const question = WEAR_QUESTIONS[state.step];
  const option = question?.options?.[index];
  if (!option) return;
  state.scores = applyDelta(state.scores, option[3]);
  state.history.push({ icon: option[0], label: option[1], note: option[2], impact: influence(option[3]) });
  track('quiz_step', { step: state.step + 1, total: WEAR_QUESTIONS.length });
  state.step += 1;
  if (state.step >= WEAR_QUESTIONS.length) {
    state.screen = 'analyze';
    render();
    setTimeout(() => {
      state.result = makeResult();
      state.screen = 'result';
      render();
      recordResult(state.result);
      announce(`Your Wear archetype is ${state.result.archetype.name}.`);
    }, 560);
  } else {
    announce(`Choice ${state.step + 1} of ${WEAR_QUESTIONS.length}.`);
    render();
  }
}

if (ACTIVE) {
  document.title = 'Tasteprint Wear';
  document.querySelector('meta[name="description"]')?.setAttribute('content', 'Tasteprint Wear — discover the style patterns behind what you actually reach for.');
  render();
  app.addEventListener('click', (event) => {
    if (event.target.closest('[data-wear-start]')) start();
    const option = event.target.closest('[data-wear-option]');
    if (option) choose(Number(option.dataset.wearOption));
    if (event.target.closest('[data-wear-retake]')) start();
  });
}
