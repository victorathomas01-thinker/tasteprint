import {
  MOVE_ARCHETYPES,
  MOVE_BADGES,
  MOVE_DIMENSIONS,
  MOVE_DIMENSION_COPY,
  MOVE_MODES,
  MOVE_QUESTIONS
} from './move-data.js';

const params = new URL(location.href).searchParams;
const ACTIVE = params.get('module') === 'move';
const app = document.querySelector('#app');
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const freshScores = () => Object.fromEntries(MOVE_DIMENSIONS.map((key) => [key, 50]));

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
  return Math.sqrt(MOVE_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / MOVE_DIMENSIONS.length);
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
  const candidates = MOVE_BADGES
    .filter(([, , key, threshold]) => scores[key] >= threshold)
    .sort((a, b) => scores[b[2]] - scores[a[2]]);
  const fallbacks = [
    ['🏋️', 'Shows Up', 'identity'],
    ['🧠', 'Training Curious', 'learning'],
    ['🎛️', 'Adjusts the Session', 'flexibility'],
    ['🎯', 'Purposeful Reps', 'craft']
  ];
  for (const badge of fallbacks) {
    if (candidates.length >= 3) break;
    if (!candidates.some((item) => item[2] === badge[2])) candidates.push(badge);
  }
  return candidates.slice(0, 3);
}

function strongest(scores) {
  return MOVE_DIMENSIONS
    .map((key) => ({ key, value: scores[key], distance: Math.abs(scores[key] - 50) }))
    .sort((a, b) => b.distance - a.distance)[0];
}

function tension(scores) {
  if (scores.intensity >= 78 && scores.recovery >= 78) {
    return ['Push hard, recover on purpose.', 'You are not choosing between ambition and sustainability. The ideal training rhythm gives hard efforts enough space to actually stay hard.'];
  }
  if (scores.structure >= 76 && scores.flexibility >= 72) {
    return ['A plan with an escape hatch.', 'You like knowing what the week is trying to do, but you do not want one missed day to turn the whole program into a failure state.'];
  }
  if (scores.craft >= 78 && scores.intensity >= 76) {
    return ['Technical, not timid.', 'You enjoy effort more when the rep still has standards. Harder is satisfying when execution remains part of the challenge.'];
  }
  if (scores.variety >= 78 && scores.structure >= 70) {
    return ['Novelty inside a system.', 'You want new stimuli without losing the ability to tell whether anything is improving. Variety works best when it still has a thread.'];
  }
  if (scores.social >= 76 && scores.calm >= 74) {
    return ['People, not chaos.', 'Shared energy can help you, but the session still needs enough focus to feel like training instead of a loud hangout with equipment.'];
  }
  if (scores.learning >= 80 && scores.identity >= 74) {
    return ['You train with a theory of yourself.', 'Understanding the process is part of the identity payoff. You are more likely to commit when the training makes sense, not just when it is difficult.'];
  }
  return ['More mixed than one label.', 'Your archetype is a center of gravity, not a training prescription. The mode, badges and strongest pulls show where your preferences refuse to collapse into one philosophy.'];
}

function definingCopy(key, value) {
  const high = {
    variety: 'New exercises, formats or challenges can make showing up feel easier rather than distracting.',
    structure: 'You trust training more when the week has a visible purpose and progression.',
    social: 'Other people can add motivation, accountability or energy that you do not fully reproduce alone.',
    craft: 'Execution matters. You notice the quality of the rep, not just whether the rep happened.',
    recovery: 'A plan that ignores your ability to come back tomorrow is missing part of the problem for you.',
    intensity: 'Some sessions need enough challenge that the effort itself becomes memorable.',
    calm: 'Movement can organize your attention instead of competing for more of it.',
    identity: 'Training means more when it feels connected to who you are becoming or how you see yourself.',
    learning: 'Understanding why something works can make the work itself more satisfying.',
    flexibility: 'You prefer a plan that can survive real life instead of needing perfect conditions.'
  };
  const low = {
    variety: 'You do not need constant novelty. Repetition can be reassuring when the reason for it is clear.',
    structure: 'You are less attached to a fixed program than to having a useful session in front of you.',
    social: 'You can get more out of training when nobody else needs your attention.',
    craft: 'You care more about the session doing its job than turning every movement into a technical project.',
    recovery: 'You are more willing to tolerate short-term fatigue when the challenge feels worth it.',
    intensity: 'A session does not have to become a test to feel legitimate.',
    calm: 'You may actually prefer some stimulation, noise or pressure when it helps you switch on.',
    identity: 'Training can simply be something useful you do without needing to become part of your personality.',
    learning: 'You do not need a lecture before every set. Clear action can be enough.',
    flexibility: 'Once the plan makes sense, you would rather follow it than renegotiate it every day.'
  };
  return value >= 50 ? high[key] : low[key];
}

function makeResult() {
  const archetypes = rank(state.scores, MOVE_ARCHETYPES);
  const modes = rank(state.scores, MOVE_MODES);
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
  window.TasteprintAnalytics?.track?.(name, { module: 'move', ...properties });
}

function signatureFor(result) {
  return `move:${MOVE_DIMENSIONS.map((key) => result.scores[key]).join('.')}:${result.archetype.name}:${result.mode.name}`;
}

function recordResult(result) {
  const signature = signatureFor(result);
  if (state.recordedSignature === signature) return;
  state.recordedSignature = signature;
  window.dispatchEvent(new CustomEvent('tasteprint:module-complete', {
    detail: {
      moduleId: 'move',
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
  return `<section class="panel move-shell">
    <div class="move-hero">
      <div class="eyebrow">Tasteprint · Move</div>
      <h1>What makes training feel worth coming back to?</h1>
      <p class="lede">Choose between real training tradeoffs. Move turns them into a training archetype, a session mode, and the preferences underneath the exercises you happen to do now.</p>
      <div class="row move-start-row">
        <button class="primary" type="button" data-move-start>Find my Move Tasteprint</button>
        <span class="small">8 choices · about 45 seconds · no signup</span>
      </div>
      <div class="move-home-links"><a href="?modules=1">All modules</a><a href="?profile=1">My Passport</a></div>
    </div>
    <div class="move-board" aria-hidden="true"><div><span>01</span><strong>BUILD</strong></div><div><span>02</span><strong>LEARN</strong></div><div><span>03</span><strong>PUSH</strong></div><div><span>04</span><strong>RESET</strong></div></div>
  </section>`;
}

function quizView() {
  const question = MOVE_QUESTIONS[state.step];
  const pct = state.step / MOVE_QUESTIONS.length * 100;
  return `<section class="panel pad move-shell">
    <div class="row spread"><div><div class="eyebrow">Tasteprint · Move</div><div class="small">Choice ${state.step + 1} of ${MOVE_QUESTIONS.length}</div></div><a class="small move-exit" href="?modules=1">Exit</a></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <h2 class="move-question">${esc(question.title)}</h2>
    <p class="small">${esc(question.subtitle)}</p>
    <div class="choice-grid move-choice-grid">${question.options.map((option, index) => `<button class="choice move-choice" type="button" data-move-option="${index}"><span class="icon">${option[0]}</span><strong>${esc(option[1])}</strong><span>${esc(option[2])}</span></button>`).join('')}</div>
  </section>`;
}

function analyzeView() {
  return `<section class="panel pad move-analyze"><div class="eyebrow">Reading the session</div><h2>Your idea of a “good workout” is more specific than hard versus easy.</h2><p class="small">Good. Training preference is partly about what makes the work repeatable, meaningful and interesting to you.</p><div class="progress"><div style="width:94%"></div></div></section>`;
}

function resultView() {
  const result = state.result;
  const scores = result.scores;
  const defining = strongest(scores);
  const [tensionTitle, tensionCopy] = tension(scores);
  const fingerprint = [...result.history].sort((a, b) => b.impact - a.impact).slice(0, 3);
  const curveball = result.modeRanks[1].item;
  const inverse = result.modeRanks.at(-1).item;
  const axes = ['structure', 'intensity', 'recovery', 'craft', 'variety', 'flexibility'];

  return `<section class="panel pad move-result move-shell">
    <div class="move-result-head">
      <div><div class="eyebrow">Your Move archetype</div><div class="row move-title-row"><h2>${esc(result.archetype.name)}</h2><span class="badge">${esc(result.fit)}</span></div><p class="lede">${esc(result.archetype.copy)}</p></div>
      <a class="secondary" href="?profile=1">Open Passport</a>
    </div>
    <div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div>

    <div class="move-result-grid">
      <div class="move-axes"><div class="eyebrow">Your training shape</div><p class="small">Continuums, not grades.</p>${axes.map((key) => {
        const [left, right, label] = MOVE_DIMENSION_COPY[key];
        return `<div class="continuum"><div class="continuum-labels"><span>${esc(left)}</span><strong>${esc(label)}</strong><span>${esc(right)}</span></div><div class="track"><div class="track-fill" style="width:${scores[key]}%"></div><div class="marker" style="left:${scores[key]}%"></div></div></div>`;
      }).join('')}</div>
      <div class="move-insights">
        <div class="callout"><div class="eyebrow">Your session mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><p class="small">${esc(result.mode.copy)}</p></div>
        <div class="card"><div class="eyebrow">Your contradiction</div><h3>${esc(tensionTitle)}</h3><p class="small">${esc(tensionCopy)}</p></div>
        <div class="card"><div class="eyebrow">Most defining pull</div><h3>${esc(MOVE_DIMENSION_COPY[defining.key][2])}</h3><p class="small">${esc(definingCopy(defining.key, defining.value))}</p></div>
      </div>
    </div>

    <div class="move-section"><div class="eyebrow">What tends to fit</div><h2>Session signals, not a training prescription.</h2><div class="grid-3">${result.mode.anchors.map((anchor, index) => `<div class="card move-anchor"><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(anchor)}</h3></div>`).join('')}</div><p class="small move-disclaimer">Move describes preference patterns. It does not determine what exercises, intensity or medical limitations are appropriate for you.</p></div>

    <div class="move-section"><div class="eyebrow">Decision fingerprint</div><div class="grid-3">${fingerprint.map((item) => `<div class="card"><div class="move-fingerprint-icon">${item.icon}</div><h3>${esc(item.label)}</h3><p class="small">${esc(item.note)}</p></div>`).join('')}</div></div>

    <div class="move-result-grid move-mode-pair">
      <div class="card"><div class="eyebrow">Curveball mode</div><h3>${curveball.icon} ${esc(curveball.name)}</h3><p class="small">Close enough to match part of your training taste, different enough to show another way the same preferences could be expressed.</p></div>
      <div class="card"><div class="eyebrow">Probably not your default</div><h3>${inverse.icon} ${esc(inverse.name)}</h3><p class="small">The least aligned session mode for this result. Not wrong, just built around rewards you seem to value less.</p></div>
    </div>

    <div class="move-result-grid move-share-grid">
      <div><div class="eyebrow">Story card preview</div><div class="story move-story"><div><div class="eyebrow">Tasteprint · Move</div><h2>${esc(result.archetype.name)}</h2><div class="badges">${result.badges.map((badge) => `<span class="badge">${badge[0]} ${esc(badge[1])}</span>`).join('')}</div></div><div><div class="small">My session mode</div><h3>${result.mode.icon} ${esc(result.mode.name)}</h3><div class="small">Strongest pull: ${esc(MOVE_DIMENSION_COPY[defining.key][2])}</div><div class="small">Passport can compare how I train with how I travel, dress and watch.</div></div></div></div>
      <div class="callout move-next"><div class="eyebrow">Four domains now</div><h3>Your throughlines have more places to prove themselves.</h3><p class="small">When Move joins Escape, Wear and Watch, a Passport badge has to survive very different decisions before it starts looking like a genuine cross-domain preference.</p><a class="secondary" href="?profile=1">See my Passport</a><a class="secondary" href="?modules=1">Explore modules</a></div>
    </div>

    <div class="row move-bottom-actions"><button class="secondary" type="button" data-move-retake>Retake Move</button><a class="secondary" href="?module=watch">Take Watch</a><a class="secondary" href="?module=wear">Take Wear</a><a class="secondary" href="?">Take Escape</a></div>
  </section>`;
}

function render() {
  if (!ACTIVE) return;
  document.documentElement.dataset.module = 'move';
  document.title = 'Tasteprint Move';
  if (state.screen === 'home') app.innerHTML = homeView();
  else if (state.screen === 'quiz') app.innerHTML = quizView();
  else if (state.screen === 'analyze') app.innerHTML = analyzeView();
  else app.innerHTML = resultView();

  app.querySelector('[data-move-start]')?.addEventListener('click', () => {
    state = { ...state, screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
    track('quiz_start');
    render();
  });

  app.querySelectorAll('[data-move-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const option = MOVE_QUESTIONS[state.step].options[Number(button.dataset.moveOption)];
      state.scores = applyDelta(state.scores, option[3]);
      state.history.push({ icon: option[0], label: option[1], note: option[2], impact: influence(option[3]) });
      track('quiz_step', { step: state.step + 1, total: MOVE_QUESTIONS.length });
      state.step += 1;
      if (state.step >= MOVE_QUESTIONS.length) {
        state.screen = 'analyze';
        render();
        setTimeout(() => {
          state.result = makeResult();
          state.screen = 'result';
          render();
          recordResult(state.result);
          announce(`Your Move archetype is ${state.result.archetype.name}.`);
        }, 650);
      } else render();
    });
  });

  app.querySelector('[data-move-retake]')?.addEventListener('click', () => {
    state = { ...state, screen: 'quiz', step: 0, scores: freshScores(), history: [], result: null, recordedSignature: '' };
    track('quiz_start', { retake: true });
    render();
  });
}

render();
