import {
  EAT_ARCHETYPES,
  EAT_BADGES,
  EAT_DIMENSIONS,
  EAT_DIMENSION_COPY,
  EAT_MODES,
  EAT_QUESTIONS
} from './eat-data.js';

const params = new URL(location.href).searchParams;
const ACTIVE = params.get('module') === 'eat';
const app = document.querySelector('#app');
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const freshScores = () => Object.fromEntries(EAT_DIMENSIONS.map((key) => [key, 50]));

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
  return Math.sqrt(EAT_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / EAT_DIMENSIONS.length);
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
  const candidates = EAT_BADGES
    .filter(([, , key, threshold]) => scores[key] >= threshold)
    .sort((a, b) => scores[b[2]] - scores[a[2]]);
  const fallbacks = [
    ['🍽️', 'Knows What Hits', 'comfort'],
    ['🔎', 'Taste Curious', 'curiosity'],
    ['🫶', 'Meal Memory', 'nostalgia'],
    ['✨', 'Dinner Has a Mood', 'presentation']
  ];
  for (const badge of fallbacks) {
    if (candidates.length >= 3) break;
    if (!candidates.some((item) => item[2] === badge[2])) candidates.push(badge);
  }
  return candidates.slice(0, 3);
}

function strongest(scores) {
  return EAT_DIMENSIONS
    .map((key) => ({ key, value: scores[key], distance: Math.abs(scores[key] - 50) }))
    .sort((a, b) => b.distance - a.distance)[0];
}

function tension(scores) {
  if (scores.adventure >= 78 && scores.comfort >= 78) {
    return ['New, but with something to hold onto.', 'You like discovery more when the meal still gives you one recognizable anchor. Comfort and curiosity are not opposites for you.'];
  }
  if (scores.presentation >= 78 && scores.intensity >= 78) {
    return ['Pretty cannot be quiet.', 'You appreciate presentation, but the plate still has to deliver a sensory point of view. Looking considered is not enough by itself.'];
  }
  if (scores.ritual >= 76 && scores.spontaneity >= 72) {
    return ['A ritual with room to wander.', 'You can enjoy traditions and favorite places without wanting every meal planned in advance. The ritual is the anchor, not the cage.'];
  }
  if (scores.sharing >= 78 && scores.ease >= 76) {
    return ['Social, not exhausting.', 'You like a table with people around it, but the meal works best when the room still leaves enough space to actually enjoy them.'];
  }
  if (scores.nostalgia >= 78 && scores.curiosity >= 78) {
    return ['Memory and discovery can share a menu.', 'You respond to food history without wanting your taste frozen in the past. Familiar stories can make unfamiliar food more interesting.'];
  }
  if (scores.intensity >= 78 && scores.ease >= 72) {
    return ['Bold food, easy night.', 'You may want the flavor turned up without wanting the entire dining experience to feel high-pressure.'];
  }
  return ['More mixed than one label.', 'Your archetype is the center of gravity, not a cuisine rule. The mode, badges and strongest pulls catch the parts of your food taste that do not fit one neat box.'];
}

function definingCopy(key, value) {
  const high = {
    adventure: 'You are willing to spend a meal discovering something rather than only confirming what you already know.',
    ritual: 'The way a meal unfolds can matter almost as much as the food itself.',
    sharing: 'Food gets more rewarding when other people are part of the experience.',
    presentation: 'Visual detail and atmosphere can change how intentional a meal feels to you.',
    comfort: 'There is real value in food that lets you relax into the experience quickly.',
    intensity: 'You notice food that makes a strong sensory argument instead of whispering.',
    ease: 'A meal is easier to love when the experience leaves some breathing room.',
    nostalgia: 'Flavor can carry memory, people and place in a way few other things can.',
    curiosity: 'Knowing what is happening in the dish can deepen the pleasure rather than spoil the mystery.',
    spontaneity: 'You like leaving enough space for the meal to change once the night starts.'
  };
  const low = {
    adventure: 'You do not need novelty for novelty’s sake. A known pleasure can still be the smartest order.',
    ritual: 'You care more about the meal landing than following a whole ceremony around it.',
    sharing: 'A great plate does not need a crowd to validate it.',
    presentation: 'You will forgive an ugly plate fast if the food itself is excellent.',
    comfort: 'You are more willing to tolerate a little friction when the food experience feels worth the challenge.',
    intensity: 'Subtlety can be a strength when the details are precise enough to reward attention.',
    ease: 'Some energy, noise or theatricality can be fun when the meal earns it.',
    nostalgia: 'Food does not need a personal history to matter. The present-tense experience can be enough.',
    curiosity: 'You do not need to reverse-engineer every plate before you enjoy it.',
    spontaneity: 'A good reservation and a clear plan can make anticipation part of the pleasure.'
  };
  return value >= 50 ? high[key] : low[key];
}

function makeResult() {
  const archetypes = rank(state.scores, EAT_ARCHETYPES);
  const modes = rank(state.scores, EAT_MODES);
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
  window.TasteprintAnalytics?.track?.(name, { module: 'eat', ...properties });
}

function signatureFor(result) {
  return `eat:${EAT_DIMENSIONS.map((key) => result.scores[key]).join('.')}:${result.archetype.name}:${result.mode.name}`;
}

function recordResult(result) {
  const signature = signatureFor(result);
  if (state.recordedSignature === signature) return;
  state.recordedSignature = signature;
  window.dispatchEvent(new CustomEvent('tasteprint:module-complete', {
    detail: {
      moduleId: 'eat',
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
  return `<section class="panel eat-shell">
    <div class="eat-hero">
      <div class="eyebrow">Tasteprint · Eat</div>
      <h1>What makes a meal feel actually worth it?</h1>
      <p class="lede">Choose between real dining tradeoffs. Eat turns them into a food archetype, a dining mode, and the preferences underneath the cuisines you happen to order now.</p>
      <div class="row eat-start-row">
        <button class="primary" type="button" data-eat-start>Find my Eat Tasteprint</button>
        <span class="small">8 choices · about 45 seconds · no signup</span>
      </div>
      <div class="eat-home-links"><a href="?modules=1">All modules</a><a href="?profile=1">My Passport</a></div>
    </div>
    <div class="eat-board" aria-hidden="true"><div><span>01</span><strong>TASTE</strong></div><div><span>02</span><strong>MEMORY</strong></div><div><span>03</span><strong>TABLE</strong></div><div><span>04</span><strong>DISCOVER</strong></div></div>
  </section>`;
}

function quizView() {
  const question = EAT_QUESTIONS[state.step];
  const pct = state.step / EAT_QUESTIONS.length * 100;
  return `<section class="panel pad eat-shell">
    <div class="row spread"><div><div class="eyebrow">Tasteprint · Eat</div><div class="small">Choice ${state.step + 1} of ${EAT_QUESTIONS.length}</div></div><a class="small eat-exit" href="?modules=1">Exit</a></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <h2 class="eat-question">${esc(question.title)}</h2>
    <p class="small">${esc(question.subtitle)}</p>
    <div class="choice-grid eat-choice-grid">${question.options.map((option, index) => `<button class="choice eat-choice" type="button" data-eat-option="${index}"><span class="icon">${option[0]}</span><strong>${esc(option[1])}</strong><span>${esc(option[2])}</span></button>`).join('')}</div>
  </section>`;
}

function analyzeView() {
  return `<section class="panel pad eat-analyze"><div class="eyebrow">Reading the table</div><h2>Your food taste is doing more than picking cuisines.</h2><p class="small">Good. The same person can want comfort, discovery, ritual and chaos on different nights. Eat looks for the pattern underneath.</p><div class="progress"><div style="width:94%"></div></div></section>`;
}

function resultView() {
  const result = state.result;
  const scores = result.scores;
  const defining = strongest(scores);
  const [tensionTitle, tensionCopy] = tension(scores);
  const fingerprint = [...result.history].sort((a, b) => b.impact - a.impact).slice(0, 3);
  const curveball = result.modeRanks[1].item;
  const inverse = result.modeRanks.at(-1).item;
  const axes = ['adventure', 'comfort', 'intensity', 'curiosity', 'sharing', 'ritual'];

  return `<section class="panel pad eat-result eat-shell">
    <div class="eat-result-head">
      <div><div class="eyebrow">Your Eat archetype</div><div class="row eat-title-row"><h2>${esc(result.archetype.name)}</h2><span class="badge">${esc(result.fit)}</span></div><p class="lede">${esc(result.archetype.copy)}</p></div>
      <a class="secondary" href="?profile=1">Open Passport</a>
    </div>
    <div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div>

    <div class="eat-result-grid">
      <div class="eat-axes"><div class="eyebrow">Your dining shape</div><p class="small">Continuums, not grades.</p>${axes.map((key) => {
        const [left, right, label] = EAT_DIMENSION_COPY[key];
        return `<div class="continuum"><div class="continuum-labels"><span>${esc(left)}</span><strong>${esc(label)}</strong><span>${esc(right)}</span></div><div class="track"><div class="track-fill" style="width:${scores[key]}%"></div><div class="marker" style="left:${scores[key]}%"></div></div></div>`;
      }).join('')}</div>
      <div class="eat-insights">
        <div class="callout"><div class="eyebrow">Your dining mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><p class="small">${esc(result.mode.copy)}</p></div>
        <div class="card"><div class="eyebrow">Your contradiction</div><h3>${esc(tensionTitle)}</h3><p class="small">${esc(tensionCopy)}</p></div>
        <div class="card"><div class="eyebrow">Most defining pull</div><h3>${esc(EAT_DIMENSION_COPY[defining.key][2])}</h3><p class="small">${esc(definingCopy(defining.key, defining.value))}</p></div>
      </div>
    </div>

    <div class="eat-section"><div class="eyebrow">What tends to fit</div><h2>Dining signals, not a restaurant cage.</h2><div class="grid-3">${result.mode.anchors.map((anchor, index) => `<div class="card eat-anchor"><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(anchor)}</h3></div>`).join('')}</div><p class="small eat-disclaimer">Eat describes preference patterns. It does not account for allergies, dietary restrictions, nutrition needs or medical considerations.</p></div>

    <div class="eat-section"><div class="eyebrow">Decision fingerprint</div><div class="grid-3">${fingerprint.map((item) => `<div class="card"><div class="eat-fingerprint-icon">${item.icon}</div><h3>${esc(item.label)}</h3><p class="small">${esc(item.note)}</p></div>`).join('')}</div></div>

    <div class="eat-result-grid eat-mode-pair">
      <div class="card"><div class="eyebrow">Curveball mode</div><h3>${curveball.icon} ${esc(curveball.name)}</h3><p class="small">Close enough to match part of your food taste, different enough to get you outside the same dining loop.</p></div>
      <div class="card"><div class="eyebrow">Probably not your default</div><h3>${inverse.icon} ${esc(inverse.name)}</h3><p class="small">The least aligned dining mode for this result. Not bad food, just a meal built around rewards you seem to value less.</p></div>
    </div>

    <div class="eat-result-grid eat-share-grid">
      <div><div class="eyebrow">Story card preview</div><div class="story eat-story"><div><div class="eyebrow">Tasteprint · Eat</div><h2>${esc(result.archetype.name)}</h2><div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div></div><div><div class="small">My dining mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><div class="small">Strongest pull: ${esc(EAT_DIMENSION_COPY[defining.key][2])}</div><div class="small">Passport can compare how I eat with how I travel, dress, watch and train.</div></div></div></div>
      <div class="callout eat-next"><div class="eyebrow">Five domains now</div><h3>The throughlines are getting harder to fake.</h3><p class="small">When Eat joins Escape, Wear, Watch and Move, the master Tasteprint can separate something that follows you everywhere from something you only want at the dinner table.</p><a class="secondary" href="?profile=1">See my Passport</a><a class="secondary" href="?modules=1">Explore modules</a></div>
    </div>

    <div class="row eat-bottom-actions"><button class="secondary" type="button" data-eat-retake>Retake Eat</button><a class="secondary" href="?module=move">Take Move</a><a class="secondary" href="?module=watch">Take Watch</a><a class="secondary" href="?module=wear">Take Wear</a><a class="secondary" href="?">Take Escape</a></div>
  </section>`;
}

function render() {
  if (!ACTIVE) return;
  document.documentElement.dataset.module = 'eat';
  document.title = 'Tasteprint Eat';
  if (state.screen === 'home') app.innerHTML = homeView();
  else if (state.screen === 'quiz') app.innerHTML = quizView();
  else if (state.screen === 'analyze') app.innerHTML = analyzeView();
  else app.innerHTML = resultView();

  app.querySelector('[data-eat-start]')?.addEventListener('click', () => {
    state = { ...state, screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
    track('quiz_start');
    render();
  });

  app.querySelectorAll('[data-eat-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const option = EAT_QUESTIONS[state.step].options[Number(button.dataset.eatOption)];
      state.scores = applyDelta(state.scores, option[3]);
      state.history.push({ icon: option[0], label: option[1], note: option[2], impact: influence(option[3]) });
      track('quiz_step', { step: state.step + 1, total: EAT_QUESTIONS.length });
      state.step += 1;
      if (state.step >= EAT_QUESTIONS.length) {
        state.screen = 'analyze';
        render();
        setTimeout(() => {
          state.result = makeResult();
          state.screen = 'result';
          render();
          recordResult(state.result);
          announce(`Your Eat archetype is ${state.result.archetype.name}.`);
        }, 650);
      } else render();
    });
  });

  app.querySelector('[data-eat-retake]')?.addEventListener('click', () => {
    state = { ...state, screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
    track('quiz_start', { retake: true });
    render();
  });
}

render();
