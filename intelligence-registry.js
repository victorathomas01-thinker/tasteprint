import { ARCHETYPES, CONTINUUMS, DIMENSIONS, TRAVEL_MODES } from './data.js';
import { WEAR_ARCHETYPES, WEAR_DIMENSION_COPY, WEAR_DIMENSIONS, WEAR_MODES } from './wear-data.js';
import { WATCH_ARCHETYPES, WATCH_DIMENSION_COPY, WATCH_DIMENSIONS, WATCH_MODES } from './watch-data.js';
import { MOVE_ARCHETYPES, MOVE_DIMENSION_COPY, MOVE_DIMENSIONS, MOVE_MODES } from './move-data.js';
import { EAT_ARCHETYPES, EAT_DIMENSION_COPY, EAT_DIMENSIONS, EAT_MODES } from './eat-data.js';
import { LIVE_ARCHETYPES, LIVE_DIMENSION_COPY, LIVE_DIMENSIONS, LIVE_MODES } from './live-data.js';

const escapeContinuums = Object.fromEntries(CONTINUUMS.map(([key, left, right]) => [key, [left, right]]));
const escapeLabels = Object.freeze({
  romance: ['Matter-of-fact', 'Atmospheric', 'Atmosphere'],
  novelty: ['Familiar', 'Novel', 'Novelty'],
  comfort: ['Simple', 'Indulgent', 'Comfort'],
  structure: ['Flexible', 'Structured', 'Planning'],
  social: ['Quiet', 'Social', 'Social energy'],
  activity: ['Restful', 'Active', 'Activity'],
  culture: ['Light context', 'Culture-led', 'Cultural curiosity'],
  serenity: ['Stimulating', 'Restorative', 'Breathing room'],
  aesthetic: ['Practical', 'Aesthetic', 'Aesthetic sensitivity'],
  spontaneity: ['Anchored', 'Spontaneous', 'Spontaneity']
});

for (const [key, pair] of Object.entries(escapeContinuums)) {
  if (escapeLabels[key]) {
    escapeLabels[key][0] = pair[0];
    escapeLabels[key][1] = pair[1];
  }
}

export const INTELLIGENCE_MODULES = Object.freeze({
  escape: Object.freeze({
    id: 'escape',
    name: 'Escape',
    dimensions: DIMENSIONS,
    dimensionCopy: escapeLabels,
    archetypes: ARCHETYPES,
    modes: TRAVEL_MODES
  }),
  wear: Object.freeze({
    id: 'wear',
    name: 'Wear',
    dimensions: WEAR_DIMENSIONS,
    dimensionCopy: WEAR_DIMENSION_COPY,
    archetypes: WEAR_ARCHETYPES,
    modes: WEAR_MODES
  }),
  watch: Object.freeze({
    id: 'watch',
    name: 'Watch',
    dimensions: WATCH_DIMENSIONS,
    dimensionCopy: WATCH_DIMENSION_COPY,
    archetypes: WATCH_ARCHETYPES,
    modes: WATCH_MODES
  }),
  move: Object.freeze({
    id: 'move',
    name: 'Move',
    dimensions: MOVE_DIMENSIONS,
    dimensionCopy: MOVE_DIMENSION_COPY,
    archetypes: MOVE_ARCHETYPES,
    modes: MOVE_MODES
  }),
  eat: Object.freeze({
    id: 'eat',
    name: 'Eat',
    dimensions: EAT_DIMENSIONS,
    dimensionCopy: EAT_DIMENSION_COPY,
    archetypes: EAT_ARCHETYPES,
    modes: EAT_MODES
  }),
  live: Object.freeze({
    id: 'live',
    name: 'Live',
    dimensions: LIVE_DIMENSIONS,
    dimensionCopy: LIVE_DIMENSION_COPY,
    archetypes: LIVE_ARCHETYPES,
    modes: LIVE_MODES
  })
});

export function intelligenceModule(moduleId) {
  return INTELLIGENCE_MODULES[String(moduleId || '').trim().toLowerCase()] || null;
}
