import {
  WATCH_ARCHETYPES,
  WATCH_BADGES,
  WATCH_DIMENSIONS,
  WATCH_DIMENSION_COPY,
  WATCH_MODES,
  WATCH_QUESTIONS
} from './watch-data.js';

const params = new URL(location.href).searchParams;
const ACTIVE = params.get('module') === 'watch';
const app = document.querySelector('#app');
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const freshScores = () => Object.fromEntries(WATCH_DIMENSIONS.map((key) => [key, 50]));

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
  return Math.sqrt(WATCH_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / WATCH_DIMENSIONS.length);
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
  const candidates = WATCH_BADGES
    .filter(([, , key, threshold]) => scores[key] >= threshold)
    .sort((a, b) => scores[b[2]] - scores[a[2]]);
  const fallbacks = [
    ['🎬', 'Story Specific', 'coherence'],
    ['🔎', 'Taste Curious', 'complexity'],
    ['🫶', 'Character Responsive', 'emotion'],
    ['🌌', 'World Ready', 'visuality']
  ];
  for (const badge of fallbacks) {
    if (candidates.length >= 3) break;
    if (!candidates.some((item) => item[2] === badge[2])) candidates.push(badge);
  }
  return candidates.slice(0, 3);
}

function strongest(scores) {
  return WATCH_DIMENSIONS
    .map((key) => ({ key, value: scores[key], distance: Math.abs(scores[key] - 50) }))
    .sort((a, b) => b.distance - a.distance)[0];
}

function tension(scores) {
  if (scores.complexity >= 78 && scores.accessibility >= 78) {
    return ['Complex, not punishing.', 'You like layers and structure, but you still want the story to communicate. Confusion is not automatically sophistication.'];
  }
  if (scores.momentum >= 78 && scores.emotion >= 80) {
    return ['The rush has to mean something.', 'You enjoy speed more when the action is attached to people or stakes you actually care about.'];
  }
  if (scores.surprise >= 80 && scores.coherence >= 78) {
    return ['Surprise with receipts.', 'You want the story to catch you off guard and then prove it earned the move. Randomness alone is not the same pleasure.'];
  }
  if (scores.visuality >= 80 && scores.emotion >= 78) {
    return ['Images with a pulse.', 'A beautiful frame matters more when it carries feeling. Style is strongest when it changes what the scene means.'];
  }
  if (scores.gentleness >= 76 && scores.complexity >= 76) {
    return ['Soft does not mean simple.', 'You can want emotional gentleness and intellectual density at the same time. Comfort and depth are not opposites.'];
  }
  if (scores.discovery >= 78 && scores.accessibility >= 72) {
    return ['Adventurous, with an entry point.', 'You are open to unusual picks, especially when the premise gives you something solid to hold onto while the story gets stranger.'];
  }
  return ['More mixed than one label.', 'Your archetype is the center of gravity, not a genre prison. The mode, badges and strongest pulls catch the parts that refuse to fit neatly.'];
}

function definingCopy(key, value) {
  const high = {
    surprise: 'A story earns points for showing you something you did not already know how to want.',
    coherence: 'You notice when setup, structure and payoff actually talk to each other.',
    ensemble: 'Chemistry and relationships multiply the amount of story you can care about at once.',
    visuality: 'Images, sound and atmosphere are not decoration for you. They are part of the storytelling.',
    accessibility: 'You appreciate stories that invite you in instead of demanding a qualifying exam first.',
    momentum: 'Forward motion changes how alive a story feels to you.',
    gentleness: 'Warmth, mercy and emotional breathing room can be genuine artistic strengths.',
    emotion: 'If you do not feel something, technical competence alone may not be enough.',
    complexity: 'Layers, implication and reinterpretation make a story more rewarding, not less relaxing.',
    discovery: 'Part of the fun is finding something before it has been fully explained or culturally pre-approved.'
  };
  const low = {
    surprise: 'You do not need novelty to prove a story has value. Execution can matter more than unfamiliarity.',
    coherence: 'You can forgive looseness when the tone, people or moment-to-moment experience is strong enough.',
    ensemble: 'A singular point of view can be more compelling than keeping twelve arcs alive.',
    visuality: 'You will forgive plain presentation if the story underneath it works.',
    accessibility: 'You are willing to work for a story when the payoff justifies the friction.',
    momentum: 'You do not need constant movement to believe something is happening.',
    gentleness: 'You can tolerate stories that are rougher, colder or less interested in comforting you.',
    emotion: 'You can admire a story without needing it to reach directly for your heart.',
    complexity: 'Clarity and simplicity are not lesser forms when the core idea is strong.',
    discovery: 'You would rather have a trusted reason to click than gamble your night on pure novelty.'
  };
  return value >= 50 ? high[key] : low[key];
}

function makeResult() {
  const archetypes = rank(state.scores, WATCH_ARCHETYPES);
  const modes = rank(state.scores, WATCH_MODES);
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
  window.TasteprintAnalytics?.track?.(name, { module: 'watch', ...properties });
}

function signatureFor(result) {
  return `watch:${WATCH_DIMENSIONS.map((key) => result.scores[key]).join('.')}:${result.archetype.name}:${result.mode.name}`;
}

function recordResult(result) {
  const signature = signatureFor(result);
  if (state.recordedSignature === signature) return;
  state.recordedSignature = signature;
  window.dispatchEvent(new CustomEvent('tasteprint:module-complete', {
    detail: {
      moduleId: 'watch',
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
  return `<section class="panel watch-shell">
    <div class="watch-hero">
      <div class="eyebrow">Tasteprint · Watch</div>
      <h1>What kind of story actually keeps you there?</h1>
      <p class="lede">Choose between real viewing tradeoffs. Watch turns those decisions into a story archetype, a viewing mode, and the patterns hiding underneath your genre labels.</p>
      <div class="row watch-start-row">
        <button class="primary" type="button" data-watch-start>Find my Watch Tasteprint</button>
        <span class="small">8 choices · about 45 seconds · no signup</span>
      </div>
      <div class="watch-home-links"><a href="?modules=1">All modules</a><a href="?profile=1">My Passport</a></div>
    </div>
    <div class="watch-marquee" aria-hidden="true"><div class="watch-frame"><span>01</span><strong>FEEL</strong></div><div class="watch-frame"><span>02</span><strong>WORLD</strong></div><div class="watch-frame"><span>03</span><strong>PACE</strong></div><div class="watch-frame"><span>04</span><strong>WEIRD</strong></div></div>
  </section>`;
}

function quizView() {
  const question = WATCH_QUESTIONS[state.step];
  const pct = state.step / WATCH_QUESTIONS.length * 100;
  return `<section class="panel pad watch-shell">
    <div class="row spread"><div><div class="eyebrow">Tasteprint · Watch</div><div class="small">Choice ${state.step + 1} of ${WATCH_QUESTIONS.length}</div></div><a class="small watch-exit" href="?modules=1">Exit</a></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <h2 class="watch-question">${esc(question.title)}</h2>
    <p class="small">${esc(question.subtitle)}</p>
    <div class="choice-grid watch-choice-grid">${question.options.map((option, index) => `<button class="choice watch-choice" type="button" data-watch-option="${index}"><span class="icon">${option[0]}</span><strong>${esc(option[1])}</strong><span>${esc(option[2])}</span></button>`).join('')}</div>
  </section>`;
}

function analyzeView() {
  return `<section class="panel pad watch-analyze"><div class="eyebrow">Reading the queue</div><h2>Your taste is refusing to fit inside one genre label.</h2><p class="small">Good. “I like sci-fi” tells us less than what you need a story to actually do.</p><div class="progress"><div style="width:94%"></div></div></section>`;
}

function resultView() {
  const result = state.result;
  const scores = result.scores;
  const defining = strongest(scores);
  const [tensionTitle, tensionCopy] = tension(scores);
  const fingerprint = [...result.history].sort((a, b) => b.impact - a.impact).slice(0, 3);
  const curveball = result.modeRanks[1].item;
  const inverse = result.modeRanks.at(-1).item;
  const axes = ['complexity', 'momentum', 'emotion', 'surprise', 'visuality', 'accessibility'];

  return `<section class="panel pad watch-result watch-shell">
    <div class="watch-result-head">
      <div><div class="eyebrow">Your Watch archetype</div><div class="row watch-title-row"><h2>${esc(result.archetype.name)}</h2><span class="badge">${esc(result.fit)}</span></div><p class="lede">${esc(result.archetype.copy)}</p></div>
      <a class="secondary" href="?profile=1">Open Passport</a>
    </div>
    <div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div>

    <div class="watch-result-grid">
      <div class="watch-axes"><div class="eyebrow">Your story shape</div><p class="small">Continuums, not grades.</p>${axes.map((key) => {
        const [left, right, label] = WATCH_DIMENSION_COPY[key];
        return `<div class="continuum"><div class="continuum-labels"><span>${esc(left)}</span><strong>${esc(label)}</strong><span>${esc(right)}</span></div><div class="track"><div class="track-fill" style="width:${scores[key]}%"></div><div class="marker" style="left:${scores[key]}%"></div></div></div>`;
      }).join('')}</div>
      <div class="watch-insights">
        <div class="callout"><div class="eyebrow">Your viewing mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><p class="small">${esc(result.mode.copy)}</p></div>
        <div class="card"><div class="eyebrow">Your contradiction</div><h3>${esc(tensionTitle)}</h3><p class="small">${esc(tensionCopy)}</p></div>
        <div class="card"><div class="eyebrow">Most defining pull</div><h3>${esc(WATCH_DIMENSION_COPY[defining.key][2])}</h3><p class="small">${esc(definingCopy(defining.key, defining.value))}</p></div>
      </div>
    </div>

    <div class="watch-section"><div class="eyebrow">What to look for next</div><h2>Signals, not a genre cage.</h2><div class="grid-3">${result.mode.anchors.map((anchor, index) => `<div class="card watch-anchor"><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(anchor)}</h3></div>`).join('')}</div></div>

    <div class="watch-section"><div class="eyebrow">Decision fingerprint</div><div class="grid-3">${fingerprint.map((item) => `<div class="card"><div class="watch-fingerprint-icon">${item.icon}</div><h3>${esc(item.label)}</h3><p class="small">${esc(item.note)}</p></div>`).join('')}</div></div>

    <div class="watch-result-grid watch-mode-pair">
      <div class="card"><div class="eyebrow">Curveball lane</div><h3>${curveball.icon} ${esc(curveball.name)}</h3><p class="small">Close enough to fit your underlying taste, different enough to escape the same recommendation loop.</p></div>
      <div class="card"><div class="eyebrow">Probably not tonight</div><h3>${inverse.icon} ${esc(inverse.name)}</h3><p class="small">The least aligned viewing mode for this result. Not “bad,” just asking for pleasures you seem to value less right now.</p></div>
    </div>

    <div class="watch-result-grid watch-share-grid">
      <div><div class="eyebrow">Story card preview</div><div class="story watch-story"><div><div class="eyebrow">Tasteprint · Watch</div><h2>${esc(result.archetype.name)}</h2><div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div></div><div><div class="small">My viewing mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><div class="small">Strongest pull: ${esc(WATCH_DIMENSION_COPY[defining.key][2])}</div><div class="small">Passport can now compare stories with how you travel and dress.</div></div></div></div>
      <div class="callout watch-next"><div class="eyebrow">Three domains can disagree</div><h3>That is where Passport gets interesting.</h3><p class="small">Finish Escape, Wear and Watch and the master Tasteprint can separate a real throughline from something you only prefer in one context.</p><a class="secondary" href="?profile=1">See my Passport</a><a class="secondary" href="?modules=1">Explore modules</a></div>
    </div>

    <div class="row watch-bottom-actions"><button class="secondary" type="button" data-watch-retake>Retake Watch</button><a class="secondary" href="?module=wear">Take Wear</a><a class="secondary" href="?">Take Escape</a></div>
  </section>`;
}

function render() {
  if (!ACTIVE) return;
  document.documentElement.dataset.module = 'watch';
  document.title = 'Tasteprint Watch';
  if (state.screen === 'home') app.innerHTML = homeView();
  else if (state.screen === 'quiz') app.innerHTML = quizView();
  else if (state.screen === 'analyze') app.innerHTML = analyzeView();
  else app.innerHTML = resultView();

  app.querySelector('[data-watch-start]')?.addEventListener('click', () => {
    state = { ...state, screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
    track('quiz_start');
    render();
  });

  app.querySelectorAll('[data-watch-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const option = WATCH_QUESTIONS[state.step].options[Number(button.dataset.watchOption)];
      state.scores = applyDelta(state.scores, option[3]);
      state.history.push({ icon: option[0], label: option[1], note: option[2], impact: influence(option[3]) });
      track('quiz_step', { step: state.step + 1, total: WATCH_QUESTIONS.length });
      state.step += 1;
      if (state.step >= WATCH_QUESTIONS.length) {
        state.screen = 'analyze';
        render();
        setTimeout(() => {
          state.result = makeResult();
          state.screen = 'result';
          render();
          recordResult(state.result);
          announce(`Your Watch archetype is ${state.result.archetype.name}.`);
        }, 650);
      } else render();
    });
  });

  app.querySelector('[data-watch-retake]')?.addEventListener('click', () => {
    state = { ...state, screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
    track('quiz_start', { retake: true });
    render();
  });
}

render();
