import fs from 'node:fs';
import {
  activeNextMoves,
  moveFromFeedback,
  nextMoveSummary,
  normalizeNextMoves,
  transitionNextMove,
  upsertNextMove
} from '../next-moves-core.js';
import { INTELLIGENCE_MODULES } from '../intelligence-registry.js';
import { recommendationId } from '../intelligence-core.js';

const watch = INTELLIGENCE_MODULES.watch;
const firstMode = watch.modes[0];
const secondMode = watch.modes[1];
const baseRecord = {
  module: 'watch',
  result_key: 'watch:result-one',
  selected_recommendation: recommendationId(firstMode)
};
const move = moveFromFeedback(baseRecord, watch);
if (!move || move.name !== firstMode.name || move.module !== 'watch') throw new Error('Structured recommendation feedback did not produce a valid Next Move.');

let moves = upsertNextMove([], move);
if (activeNextMoves(moves).length !== 1) throw new Error('Saving a recommendation should create one active Next Move.');

const replacement = moveFromFeedback({
  ...baseRecord,
  result_key: 'watch:result-two',
  selected_recommendation: recommendationId(secondMode)
}, watch);
moves = upsertNextMove(moves, replacement);
const active = activeNextMoves(moves);
if (active.length !== 1 || active[0].name !== secondMode.name) throw new Error('Next Moves must keep at most one active decision per module.');
if (!moves.some((item) => item.name === firstMode.name && item.status === 'dismissed')) throw new Error('Replacing a domain move should preserve the old idea as dismissed history.');

moves = transitionNextMove(moves, active[0].id, 'trying');
if (nextMoveSummary(moves).trying !== 1) throw new Error('Trying transition was not counted.');
moves = transitionNextMove(moves, active[0].id, 'done');
if (nextMoveSummary(moves).done !== 1 || nextMoveSummary(moves).active !== 0) throw new Error('Done transition should remove the move from active decisions.');

const sanitized = normalizeNextMoves([{
  ...move,
  email: 'should-not-survive@example.com',
  age: 25,
  precise_location: 'should-not-survive',
  diary: 'free text should not survive'
}])[0];
for (const forbidden of ['email','age','precise_location','diary']) {
  if (Object.prototype.hasOwnProperty.call(sanitized, forbidden)) throw new Error(`Next Moves leaked arbitrary field ${forbidden}.`);
}

const runtime = fs.readFileSync(new URL('../next-moves.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint.next-moves.v1', 'one current move per domain', 'TasteprintNextMoves', 'tasteprint:intelligence-feedback']) {
  if (!runtime.includes(marker)) throw new Error(`Next Moves runtime is missing ${marker}.`);
}
for (const forbidden of ['navigator.geolocation', 'navigator.contacts', '<textarea', 'TasteprintAnalytics?.track']) {
  if (runtime.includes(forbidden)) throw new Error(`Next Moves must stay local/minimized; found forbidden marker ${forbidden}.`);
}

const privacy = fs.readFileSync(new URL('../privacy-extensions.js', import.meta.url), 'utf8');
for (const marker of ['Export Next Moves', 'Clear Next Moves', 'No Auth session', 'Workspace membership']) {
  if (!privacy.includes(marker)) throw new Error(`Privacy extension is missing ${marker}.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['next-moves.css', 'next-moves.js', 'privacy-extensions.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

console.log('Next Moves OK — recommendation interest becomes one active decision per domain, remains local-first, and exposes export/clear controls without free-text or sensitive fields.');
