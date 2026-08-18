import fs from 'node:fs';

const tour = fs.readFileSync(new URL('../tour.js', import.meta.url), 'utf8');
for (const marker of [
  "params.get('tour') === '1'",
  'Show the whole product without a database',
  '?modules=1',
  '?profile=1',
  '?next=1',
  '?campaign=aster',
  '?campaignAdmin=1&workspace=demo-workspace&hosted=aster',
  '?workspace=1&demo=1',
  '?stats=1',
  '?growth=1',
  '?privacy=1',
  'The archetype is the memorable hook. The decision support is the product.'
]) {
  if (!tour.includes(marker)) throw new Error(`Demo tour is missing ${marker}.`);
}
for (const forbidden of ['fetch(', 'createClient', 'SUPABASE_', 'TasteprintAnalytics?.track']) {
  if (tour.includes(forbidden)) throw new Error(`Demo tour must not require backend/network behavior: ${forbidden}.`);
}

const demoLoader = fs.readFileSync(new URL('../studio-demo-loader.js', import.meta.url), 'utf8');
for (const marker of ['demo-workspace', "params.get('hosted') === 'aster'", '#load-aster']) {
  if (!demoLoader.includes(marker)) throw new Error(`Studio demo handoff is missing ${marker}.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['tour.css', 'tour.js', 'studio-demo-loader.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

console.log('Demo tour OK — consumer, Passport, Next Moves, commercial Studio/Workspace, dashboards and privacy surfaces are reachable without Supabase.');
