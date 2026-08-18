import { EVENTS } from './analytics-contract.js';
import {
  FEEDBACK_SCALE,
  buildLearningRecord,
  confidenceModel,
  diverseModeSet,
  feedbackSummary,
  learningReview,
  stableResultKey,
  topAdjustmentDimensions
} from './intelligence-core.js';
import { intelligenceModule } from './intelligence-registry.js';

const FEEDBACK_KEY = 'tasteprint.intelligence-feedback.v1';
const MAX_LOCAL_FEEDBACK = 100;
const params = new URL(location.href).searchParams;
const ACTIVE_MODULE = params.get('module')?.trim().toLowerCase() || 'escape';
const config = intelligenceModule(ACTIVE_MODULE);
const app = document.querySelector('#app');
const blockedRoute = params.get('profile') === '1'
  || params.get('modules') === '1'
  || params.get('campaignAdmin') === '1'
  || params.has('campaignReport')
  || params.get('stats') === '1'
  || params.has('campaign')
  || params.has('result')
  || params.has('p')
  || params.has('challenge')
  || params.has('c');

let lastInjectedKey = '';
const trackedViews = new Set();

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readLocalFeedback() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(-MAX_LOCAL_FEEDBACK) : [];
  } catch {
    return [];
  }
}

function writeLocalFeedback(records) {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify((Array.isArray(records) ? records : []).slice(-MAX_LOCAL_FEEDBACK)));
    window.dispatchEvent(new CustomEvent('tasteprint:intelligence-feedback'));
    return true;
  } catch {
    return false;
  }
}

function saveLocalFeedback(record) {
  if (!record?.result_key) return false;
  const records = readLocalFeedback();
  const index = records.findIndex((item) => item?.result_key === record.result_key);
  if (index >= 0) records[index] = record;
  else records.push(record);
  return writeLocalFeedback(records);
}

function clearLocalFeedback() {
  try { localStorage.removeItem(FEEDBACK_KEY); } catch {}
  window.dispatchEvent(new CustomEvent('tasteprint:intelligence-feedback'));
}

function resultVisible() {
  if (!config || blockedRoute) return false;
  if (ACTIVE_MODULE === 'escape') {
    return [...app.querySelectorAll('.eyebrow')].some((node) => /Your Escape archetype/i.test(node.textContent || ''))
      && Boolean(app.querySelector('.story'));
  }
  return Boolean(app.querySelector(`.${ACTIVE_MODULE}-result`))
    || [...app.querySelectorAll('.eyebrow')].some((node) => new RegExp(`Your ${config.name} archetype`, 'i').test(node.textContent || ''));
}

function currentSnapshot() {
  const history = window.TasteprintPassport?.history?.() || [];
  const candidates = history.filter((item) => item?.module_id === ACTIVE_MODULE);
  const latest = candidates.at(-1) || null;
  if (!latest) return null;
  const resultText = app.textContent || '';
  if (latest.archetype && !resultText.includes(latest.archetype)) return null;
  return latest;
}

function targetResultRoot() {
  if (ACTIVE_MODULE === 'escape') {
    return [...app.querySelectorAll('.panel')].find((panel) => [...panel.querySelectorAll('.eyebrow')].some((node) => /Your Escape archetype/i.test(node.textContent || ''))) || app.firstElementChild;
  }
  return app.querySelector(`.${ACTIVE_MODULE}-result`) || app.firstElementChild;
}

function experienceCopy(experience) {
  if (experience.kind === 'module_returning') {
    return `Returning ${config.name} read · ${experience.priorModuleCount} earlier ${config.name} result${experience.priorModuleCount === 1 ? '' : 's'} inform recommendation ranking lightly.`;
  }
  if (experience.kind === 'cross_domain_returning') {
    return `Returning Tasteprint · this is your first saved ${config.name} read, so the result stays domain-native while the recommendation mix gets a little broader.`;
  }
  return `First ${config.name} read · recommendations lean more heavily toward immediate fit until Tasteprint has your own history to compare.`;
}

function modeCard(recommendation, selectedId = '') {
  const selected = selectedId === recommendation.id;
  return `<article class="card intelligence-lane ${selected ? 'intelligence-selected' : ''}">
    <div class="eyebrow">${esc(recommendation.label)}</div>
    <h3>${esc(recommendation.icon)} ${esc(recommendation.name)}</h3>
    <p class="small">${esc(recommendation.copy || 'A different lane that still reflects this result.')}</p>
    <button class="secondary" type="button" data-intelligence-lane="${esc(recommendation.id)}" aria-pressed="${selected ? 'true' : 'false'}">${selected ? 'Marked interesting' : 'I’d try this'}</button>
  </article>`;
}

function adjustmentMarkup(snapshot, existing) {
  const dimensions = topAdjustmentDimensions(snapshot.module_scores, config.dimensions, 3);
  const selectedDimension = existing?.mismatch_dimension || '';
  const selectedDirection = existing?.mismatch_direction || '';
  return `<div class="intelligence-adjustments" aria-label="Optional recommendation adjustment">
    ${dimensions.map(({ key }) => {
      const [left, right, label] = config.dimensionCopy[key] || ['Lower', 'Higher', key];
      const lowSelected = selectedDimension === key && selectedDirection === 'lower';
      const highSelected = selectedDimension === key && selectedDirection === 'higher';
      return `<button type="button" data-intelligence-adjust="${esc(key)}:lower" aria-pressed="${lowSelected ? 'true' : 'false'}">More ${esc(left)} <span class="sr-only">for ${esc(label)}</span></button>
        <button type="button" data-intelligence-adjust="${esc(key)}:higher" aria-pressed="${highSelected ? 'true' : 'false'}">More ${esc(right)} <span class="sr-only">for ${esc(label)}</span></button>`;
    }).join('')}
  </div>`;
}

function track(name, properties = {}) {
  return window.TasteprintAnalytics?.track?.(name, { module: ACTIVE_MODULE, ...properties });
}

function makeRecord({ snapshot, confidence, recommendations, rating = null, stage = 'rating', mismatchDimension = null, mismatchDirection = null, selectedRecommendation = null }) {
  return buildLearningRecord({
    resultKey: stableResultKey(snapshot),
    module: ACTIVE_MODULE,
    stage,
    rating,
    archetype: snapshot.archetype,
    mode: snapshot.mode,
    confidenceLevel: confidence.level,
    experienceMode: confidence.experience.kind,
    mismatchDimension,
    mismatchDirection,
    selectedRecommendation,
    recommendationIds: recommendations.map((item) => item.id),
    scores: snapshot.module_scores
  }, config.dimensions);
}

function feedbackProperties(record) {
  return {
    intelligence_version: record.intelligence_version,
    result_key: record.result_key,
    feedback_stage: record.stage,
    rating: record.rating,
    archetype: record.archetype,
    mode: record.mode,
    confidence_level: record.confidence_level,
    experience_mode: record.experience_mode,
    mismatch_dimension: record.mismatch_dimension,
    mismatch_direction: record.mismatch_direction,
    selected_recommendation: record.selected_recommendation,
    recommendation_ids: record.recommendation_ids,
    module_scores: record.module_scores
  };
}

function renderPanel(snapshot) {
  const key = stableResultKey(snapshot);
  const history = window.TasteprintPassport?.history?.() || [];
  const confidence = confidenceModel({
    scores: snapshot.module_scores,
    dimensions: config.dimensions,
    archetypes: config.archetypes,
    history,
    moduleId: ACTIVE_MODULE,
    currentKey: key
  });
  const diverse = diverseModeSet({
    scores: snapshot.module_scores,
    dimensions: config.dimensions,
    modes: config.modes,
    history,
    moduleId: ACTIVE_MODULE,
    currentKey: key,
    count: 3
  });
  const existing = readLocalFeedback().find((item) => item?.result_key === key) || null;
  const selectedId = existing?.selected_recommendation || '';
  const rating = Number(existing?.rating || 0);

  const panel = document.createElement('section');
  panel.className = 'intelligence-panel';
  panel.dataset.intelligenceKey = key;
  panel.innerHTML = `
    <div class="intelligence-head">
      <div>
        <div class="eyebrow">Tasteprint · Recommendation intelligence</div>
        <h2>How much should this result steer what comes next?</h2>
        <p class="small">Tasteprint now separates the headline archetype from the certainty of that fit. Recommendations can stay close when the signal is mixed and spread out more when your own history supports it.</p>
        <span class="intelligence-returning">◎ ${esc(experienceCopy(confidence.experience))}</span>
      </div>
      <div class="intelligence-confidence">
        <div class="eyebrow">Fit confidence</div>
        <strong>${esc(confidence.level)}</strong>
        <p class="small">Internal model separation + your own consistency, not a population percentile.</p>
      </div>
    </div>

    <ul class="intelligence-reasons">${confidence.reasons.map((reason) => `<li>${esc(reason)}</li>`).join('')}</ul>

    <div>
      <div class="eyebrow">A more diverse next-step mix</div>
      <h3>Three lanes, not three copies of the same answer.</h3>
      <div class="intelligence-lanes">${diverse.recommendations.map((item) => modeCard(item, selectedId)).join('')}</div>
    </div>

    <div class="intelligence-feedback">
      <div class="eyebrow">Teach Tasteprint without writing an essay</div>
      <h3>Did this read feel like you?</h3>
      <div class="intelligence-rating-row">${FEEDBACK_SCALE.map((item) => `<button class="intelligence-rating" type="button" data-intelligence-rating="${item.value}" aria-pressed="${rating === item.value ? 'true' : 'false'}">${esc(item.label)}</button>`).join('')}</div>
      <div data-intelligence-adjustments>${rating && rating < 4 ? adjustmentMarkup(snapshot, existing) : ''}</div>
      <p class="small intelligence-feedback-note">Feedback is structured on purpose: no free-text box, no demographic questions, and no automatic self-modifying weights.</p>
      <p class="small intelligence-status" role="status" aria-live="polite">${rating ? 'Feedback saved on this device.' : ''}</p>
    </div>

    <div class="small intelligence-policy"><strong>What “confidence” means here</strong>${esc(confidence.scope)} Tasteprint does not use protected or sensitive attributes to rank these lanes.</div>`;

  panel.querySelectorAll('[data-intelligence-rating]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextRating = Number(button.dataset.intelligenceRating);
      panel.querySelectorAll('[data-intelligence-rating]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      const current = readLocalFeedback().find((item) => item?.result_key === key) || null;
      const record = makeRecord({
        snapshot,
        confidence,
        recommendations: diverse.recommendations,
        rating: nextRating,
        stage: 'rating',
        mismatchDimension: current?.mismatch_dimension || null,
        mismatchDirection: current?.mismatch_direction || null,
        selectedRecommendation: current?.selected_recommendation || null
      });
      if (nextRating === 4) {
        record.mismatch_dimension = null;
        record.mismatch_direction = null;
      }
      saveLocalFeedback(record);
      track(EVENTS.RECOMMENDATION_FEEDBACK, feedbackProperties(record));
      const adjustmentRoot = panel.querySelector('[data-intelligence-adjustments]');
      if (adjustmentRoot) adjustmentRoot.innerHTML = nextRating < 4 ? adjustmentMarkup(snapshot, record) : '';
      wireAdjustmentButtons(panel, snapshot, confidence, diverse.recommendations);
      panel.querySelector('.intelligence-status').textContent = nextRating === 4
        ? 'Saved. Strong matches are useful training signals too.'
        : 'Saved. You can optionally point Tasteprint toward the part that should move.';
    });
  });

  panel.querySelectorAll('[data-intelligence-lane]').forEach((button) => {
    button.addEventListener('click', () => {
      const selectedRecommendation = button.dataset.intelligenceLane;
      const current = readLocalFeedback().find((item) => item?.result_key === key) || null;
      const record = makeRecord({
        snapshot,
        confidence,
        recommendations: diverse.recommendations,
        rating: current?.rating || null,
        stage: 'lane',
        mismatchDimension: current?.mismatch_dimension || null,
        mismatchDirection: current?.mismatch_direction || null,
        selectedRecommendation
      });
      saveLocalFeedback(record);
      track(EVENTS.RECOMMENDATION_LANE_SELECT, feedbackProperties(record));
      panel.querySelectorAll('[data-intelligence-lane]').forEach((other) => {
        const selected = other.dataset.intelligenceLane === selectedRecommendation;
        other.setAttribute('aria-pressed', String(selected));
        other.textContent = selected ? 'Marked interesting' : 'I’d try this';
        other.closest('.intelligence-lane')?.classList.toggle('intelligence-selected', selected);
      });
      panel.querySelector('.intelligence-status').textContent = 'Saved as the lane you would be most likely to try.';
    });
  });

  wireAdjustmentButtons(panel, snapshot, confidence, diverse.recommendations);
  return { panel, confidence, diverse };
}

function wireAdjustmentButtons(panel, snapshot, confidence, recommendations) {
  panel.querySelectorAll('[data-intelligence-adjust]').forEach((button) => {
    if (button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      const [dimension, direction] = String(button.dataset.intelligenceAdjust || '').split(':');
      if (!config.dimensions.includes(dimension) || !['higher', 'lower'].includes(direction)) return;
      const key = stableResultKey(snapshot);
      const current = readLocalFeedback().find((item) => item?.result_key === key) || null;
      const record = makeRecord({
        snapshot,
        confidence,
        recommendations,
        rating: current?.rating || 2,
        stage: 'adjustment',
        mismatchDimension: dimension,
        mismatchDirection: direction,
        selectedRecommendation: current?.selected_recommendation || null
      });
      saveLocalFeedback(record);
      track(EVENTS.RECOMMENDATION_FEEDBACK, feedbackProperties(record));
      panel.querySelectorAll('[data-intelligence-adjust]').forEach((other) => {
        const selected = other === button;
        other.setAttribute('aria-pressed', String(selected));
      });
      const label = config.dimensionCopy[dimension]?.[2] || dimension;
      panel.querySelector('.intelligence-status').textContent = `Saved: move ${label.toLowerCase()} ${direction === 'higher' ? 'higher' : 'lower'} next time this pattern is reviewed.`;
    });
  });
}

function inject() {
  if (!config || blockedRoute || !resultVisible()) return;
  const snapshot = currentSnapshot();
  if (!snapshot) return;
  const key = stableResultKey(snapshot);
  const root = targetResultRoot();
  if (!root) return;

  const existingPanel = root.querySelector('.intelligence-panel');
  if (existingPanel?.dataset.intelligenceKey === key) return;
  existingPanel?.remove();

  const { panel, confidence, diverse } = renderPanel(snapshot);
  root.appendChild(panel);
  lastInjectedKey = key;

  if (!trackedViews.has(key)) {
    trackedViews.add(key);
    track(EVENTS.RECOMMENDATION_INTELLIGENCE_VIEW, {
      intelligence_version: 1,
      result_key: key,
      archetype: snapshot.archetype,
      mode: snapshot.mode,
      confidence_level: confidence.level,
      experience_mode: confidence.experience.kind,
      recommendation_ids: diverse.recommendations.map((item) => item.id)
    });
  }
}

if (config && !blockedRoute) {
  const observer = new MutationObserver(() => requestAnimationFrame(inject));
  observer.observe(app, { childList: true, subtree: true });
  window.addEventListener('tasteprint:passport-updated', () => requestAnimationFrame(inject));
  window.addEventListener('tasteprint:module-complete', () => setTimeout(inject, 0));
  requestAnimationFrame(inject);
}

window.TasteprintIntelligence = Object.freeze({
  version: 1,
  localFeedback: () => readLocalFeedback(),
  summary: () => feedbackSummary(readLocalFeedback()),
  learningReview: () => learningReview(readLocalFeedback()),
  clearLocalFeedback,
  activeModule: () => ACTIVE_MODULE,
  lastResultKey: () => lastInjectedKey,
  storageKey: FEEDBACK_KEY
});
