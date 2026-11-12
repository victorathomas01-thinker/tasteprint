import { ingestCatalog } from './catalog-core.js';
// Original editorial descriptions/tags, with official reference links. No scraped text,
// images or claims of current playback rights, price or availability are imported.
const films = [
  ['big-buck-bunny', 'Big Buck Bunny', 'A rabbit faces a trio of forest bullies in a comic animated short.', ['animation', 'comedy', 'nature'], {curiosity:50,serenity:60,energy:65}, 'Cartoon bullying and slapstick.'],
  ['sintel', 'Sintel', 'A traveler searches for a dragon in an emotional fantasy adventure.', ['animation', 'fantasy', 'drama'], {curiosity:80,serenity:20,energy:75}, 'Fantasy violence and a tragic ending.'],
  ['spring', 'Spring', 'A shepherd and her dog encounter forest spirits in a nature-inspired fantasy.', ['animation', 'fantasy', 'nature'], {curiosity:85,serenity:75,energy:45}, 'Some intense fantasy imagery.'],
  ['elephants-dream', 'Elephants Dream', 'Two characters explore a strange mechanical world in a surreal animated short.', ['animation', 'science-fiction', 'art'], {curiosity:95,serenity:25,energy:55}, 'Unsettling imagery and violence.'],
  ['cosmos-laundromat', 'Cosmos Laundromat', 'An island encounter opens a surreal animated story about transformation.', ['animation', 'fantasy', 'drama'], {curiosity:90,serenity:20,energy:50}, 'Mature themes, including suicidal imagery; review before choosing.'],
  ['agent-327', 'Agent 327: Operation Barbershop', 'A secret agent visits a barbershop in an animated action-comedy short.', ['animation', 'comedy'], {curiosity:65,serenity:15,energy:90}, 'Stylized action violence.']
];
const entries = films.map(([id,title,description,tags,attributes,content_note]) => ({
  id, title, description, tags, attributes, content_note, category: 'film', revision: 1, status: 'active',
  location: null, constraints: { cost: null, currency: null, duration_minutes: null, distance_km: null, step_free: null },
  availability: { status: 'unknown', until: null },
  source: { publisher: 'Blender Studio', url: `https://studio.blender.org/films/${id}/`, verified_at: null,
    note: 'Official project reference supplied for review. Current URL, playback, licensing and metadata have not been independently rechecked in this environment.' },
  action_url: `https://studio.blender.org/films/${id}/`
}));
const result = ingestCatalog([], entries);
if (result.errors.length) throw Error('Bundled catalog validation failed');
export const catalogItems = () => structuredClone(result.items);
