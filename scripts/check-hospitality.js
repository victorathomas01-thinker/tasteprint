import assert from 'node:assert/strict';
import { getCampaign, validateCampaignManifest } from '../campaign-config.js';
import { recommendExperiences, safeOfferURL } from '../hospitality-core.js';
import { hospitalityResultView } from '../hospitality.js';
import { studioManifest } from '../studio-manifest.js';
import { catalogFromCSV, catalogToCSV, catalogFromJSON, validateCatalog } from '../campaign-import.js';
import { ARCHETYPES, TRAVEL_MODES, DIMENSIONS } from '../data.js';

const hotel = getCampaign('charlotte-boutique-demo');
assert.equal(hotel.demo, true);
assert.equal(hotel.presentation.kind, 'hospitality');
assert.equal(hotel.leadCapture.enabled, false);
assert.equal(hotel.questions.length, 8);
assert.equal(hotel.catalog.length, 6);
assert.deepEqual(validateCampaignManifest(hotel), []);
assert.deepEqual(validateCatalog(hotel.catalog), []);
assert.ok(hotel.catalog.every((item) => item.href === null && item.tradeoff));
for (const question of hotel.questions) {
  assert.equal(question.options.length, 4);
  for (const option of question.options) {
    assert.equal(option.length, 4);
    for (const [dimension, delta] of Object.entries(option[3])) {
      assert.ok(DIMENSIONS.includes(dimension));
      assert.ok(Number.isFinite(delta));
    }
  }
}
assert.deepEqual(catalogFromCSV(catalogToCSV(hotel.catalog)), hotel.catalog);
assert.deepEqual(catalogFromJSON(hotel.catalog), hotel.catalog);
assert.equal(safeOfferURL('https://hotel.example/details'), 'https://hotel.example/details');
for (const url of ['javascript:alert(1)', 'http://hotel.example', 'https://', 'https://user:secret@hotel.example', 'data:text/html,x']) assert.equal(safeOfferURL(url), null);
assert.ok(validateCatalog([{ ...hotel.catalog[0], href: 'https://' }]).length);

const profile = { archetype: { name: 'Quiet Explorer' }, mode: { name: 'Slow Countryside' } };
const picks = recommendExperiences(hotel, { archetype: profile.archetype.name, travelMode: profile.mode.name });
assert.equal(picks.length, 3);
assert.equal(new Set(picks.map((pick) => pick.item.id)).size, 3);
assert.ok(picks[0].matched);
assert.ok(picks.every((pick) => pick.reason));
assert.deepEqual(recommendExperiences(hotel, { archetype: profile.archetype.name, travelMode: profile.mode.name }), picks);
const noMatch = recommendExperiences(hotel, { archetype: 'unknown', travelMode: 'unknown' });
assert.ok(noMatch.every((pick) => !pick.matched && pick.reason.includes('alternative')));
assert.deepEqual(recommendExperiences({ catalog: [] }), []);
assert.equal(recommendExperiences({ catalog: [hotel.catalog[0]] }).length, 1);
const output = hospitalityResultView(hotel, profile);
assert.ok(output.includes('Why this is here'));
assert.ok(output.includes('Worth considering'));
assert.ok(output.includes('nothing has been booked'));
assert.ok(!output.includes('class="story"'));
assert.ok(!output.includes('Amalfi') && !output.includes('Tokyo'));
assert.ok(hospitalityResultView({ ...hotel, catalog: [] }, profile).includes('No experiences are available'));
const unsafe = { ...hotel, name: '<img id="injected">', catalog: [{ ...hotel.catalog[0], name: '<script>bad()</script>', href: 'javascript:bad()' }] };
const escaped = hospitalityResultView(unsafe, profile);
assert.ok(!escaped.includes('<script>') && !escaped.includes('<img id='));
assert.ok(escaped.includes('&lt;script&gt;'));
assert.ok(!escaped.includes('href="javascript:'));

const template = { ...hotel, scoring: { dimensionMultipliers: { comfort: 1.2 } } };
const edited = studioManifest(template, { id: hotel.id, name: 'Edited hotel', theme: { accent: '#123456' }, copy: { title: 'Edited title' }, catalog: hotel.catalog });
assert.equal(edited.demo, true);
assert.equal(edited.presentation.kind, 'hospitality');
assert.deepEqual(edited.questions, hotel.questions);
assert.equal(edited.scoring.dimensionMultipliers.comfort, 1.2);
assert.equal(edited.copy.start, hotel.copy.start);
assert.equal(edited.copy.title, 'Edited title');
assert.equal(edited.theme.accent, '#123456');
edited.questions[0].title = 'Changed in edit copy';
assert.notEqual(hotel.questions[0].title, 'Changed in edit copy');

// Exhaustively exercise the hotel's 4^8 paths against the existing Escape vectors.
// This checks reachability/correctness, not real-user preference frequencies.
const nearest = (scores, items) => items.map((item) => ({ item, d: DIMENSIONS.reduce((sum, key) => sum + (scores[key] - item.vector[key]) ** 2, 0) })).sort((a,b) => a.d-b.d)[0].item;
const topCounts = new Map();
for (let path = 0; path < 65536; path++) {
  let remaining = path;
  const scores = Object.fromEntries(DIMENSIONS.map((key) => [key, 50]));
  for (const question of hotel.questions) {
    const option = question.options[remaining % 4]; remaining = Math.floor(remaining / 4);
    for (const [key, delta] of Object.entries(option[3])) scores[key] = Math.max(0, Math.min(100, Math.round(scores[key] + delta)));
  }
  const recommendations = recommendExperiences(hotel, { archetype: nearest(scores, ARCHETYPES).name, travelMode: nearest(scores, TRAVEL_MODES).name });
  assert.equal(recommendations.length, 3);
  assert.equal(new Set(recommendations.map((pick) => pick.item.id)).size, 3);
  topCounts.set(recommendations[0].item.id, (topCounts.get(recommendations[0].item.id) || 0) + 1);
}
assert.equal(topCounts.size, hotel.catalog.length, 'every offer must be reachable as a first recommendation');
console.log('Hospitality PASS — 65,536 guest paths, all six offers reachable, explanations/fallbacks, safe output/links, CSV/JSON tradeoffs and Studio configuration preservation.');
