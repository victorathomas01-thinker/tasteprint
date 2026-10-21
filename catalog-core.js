import { MASTER_DIMENSIONS } from './platform-core.js';
import { INTERESTS, sanitizeInterests } from './interests-core.js';
export const CATEGORIES = ['film', 'restaurant', 'cafe', 'event', 'product', 'hotel', 'activity'];
const tags = new Set(INTERESTS.map(item => item.id));
export function safeCatalogURL(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
function canonicalURL(value) {
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) if (/^utm_|^fbclid$/.test(key)) url.searchParams.delete(key);
  url.hash = ''; return url.href.replace(/\/$/, '');
}
export function validateItem(item, now = Date.now()) {
  const errors = [];
  if (!item || typeof item !== 'object') return ['Item must be an object'];
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(item.id)) errors.push('Invalid ID');
  if (!CATEGORIES.includes(item.category)) errors.push('Unknown category');
  if (typeof item.title !== 'string' || !item.title.trim() || item.title.length > 120) errors.push('Invalid title');
  if (typeof item.description !== 'string' || !item.description.trim() || item.description.length > 600) errors.push('Invalid description');
  if (!Number.isInteger(item.revision) || item.revision < 1) errors.push('Revision required');
  if (!['active', 'withdrawn'].includes(item.status)) errors.push('Invalid status');
  if (!Array.isArray(item.tags) || !item.tags.length || item.tags.some(tag => !tags.has(tag))) errors.push('Use known interest tags');
  if (!safeCatalogURL(item.source?.url) || !item.source?.publisher || !item.source?.note) errors.push('Source URL, publisher and note required');
  if (item.action_url != null && !safeCatalogURL(item.action_url)) errors.push('Unsafe action link');
  if (item.source?.verified_at != null && (!Number.isFinite(Date.parse(item.source.verified_at)) || Date.parse(item.source.verified_at) > now)) errors.push('Invalid verification date');
  for (const [key, value] of Object.entries(item.attributes || {})) if (!MASTER_DIMENSIONS.includes(key) || !Number.isFinite(value) || value < 0 || value > 100) errors.push('Invalid preference attribute');
  for (const key of ['cost', 'duration_minutes', 'distance_km']) if (item.constraints?.[key] != null && (!Number.isFinite(item.constraints[key]) || item.constraints[key] < 0)) errors.push(`Invalid ${key}`);
  if (item.constraints?.cost != null && !/^[A-Z]{3}$/.test(item.constraints.currency || '')) errors.push('Cost requires currency');
  if (item.constraints?.step_free != null && typeof item.constraints.step_free !== 'boolean') errors.push('Invalid access metadata');
  if (!['unknown', 'available', 'unavailable'].includes(item.availability?.status)) errors.push('Availability status required');
  if (item.availability?.until != null && !Number.isFinite(Date.parse(item.availability.until))) errors.push('Invalid availability date');
  return errors;
}
export function ingestCatalog(existing = [], incoming = [], now = Date.now()) {
  const items = new Map(), sources = new Map(), errors = [];
  for (const item of [...existing, ...incoming]) {
    const problems = validateItem(item, now);
    if (problems.length) { errors.push({ id: item?.id, errors: problems }); continue; }
    const canonical = canonicalURL(item.source.url), previous = items.get(item.id);
    if (sources.has(canonical) && sources.get(canonical) !== item.id) { errors.push({ id: item.id, errors: ['Duplicate source'] }); continue; }
    if (previous && (item.revision <= previous.revision || canonicalURL(previous.source.url) !== canonical)) { errors.push({ id: item.id, errors: ['Update must keep its source and increase revision'] }); continue; }
    items.set(item.id, structuredClone(item)); sources.set(canonical, item.id);
  }
  return { items: [...items.values()], errors };
}
export function freshness(item, now = Date.now()) {
  if (!item.source?.verified_at) return 'Source not checked';
  return now - Date.parse(item.source.verified_at) > 30 * 86400000 ? 'Source needs rechecking' : 'Source checked';
}
export function eligibility(item, constraints = {}, now = Date.now()) {
  const reasons = [];
  if (item.status !== 'active') reasons.push('Listing withdrawn');
  if (item.availability.status === 'unavailable' || (item.availability.until && Date.parse(item.availability.until) <= now)) reasons.push('Unavailable');
  const verified = item.source.verified_at && freshness(item, now) === 'Source checked';
  for (const [limit, key] of [['maxCost', 'cost'], ['maxMinutes', 'duration_minutes'], ['maxDistance', 'distance_km']]) {
    if (constraints[limit] == null) continue;
    if (!Number.isFinite(constraints[limit]) || constraints[limit] < 0) { reasons.push('Invalid constraint'); continue; }
    if (!verified || item.constraints?.[key] == null || (limit === 'maxCost' && item.constraints.currency !== constraints.currency)) reasons.push(`Unknown or unverified ${key}`);
    else if (item.constraints[key] > constraints[limit]) reasons.push(`Exceeds ${key}`);
  }
  if (constraints.stepFree && (!verified || item.constraints?.step_free !== true)) reasons.push('Step-free access not confirmed');
  if (constraints.requireAvailable && (!verified || item.availability.status !== 'available')) reasons.push('Availability not confirmed');
  const excluded = Array.isArray(constraints.excludedTags) ? constraints.excludedTags : [];
  if (item.tags.some(tag => excluded.includes(tag))) reasons.push('Excluded interest');
  return reasons;
}
export function rankCatalog(catalog, participants = [], constraints = {}, now = Date.now()) {
  if (!participants.length) return { ranked: [], excluded: [] };
  const ranked = [], excluded = [];
  for (const item of catalog) {
    if (validateItem(item, now).length) { excluded.push({ id: item?.id, reasons: ['Invalid catalog entry'] }); continue; }
    const reasons = eligibility(item, constraints, now);
    const fits = participants.map(person => {
      const interests = sanitizeInterests(person.interests);
      reasons.push(...eligibility(item, { ...person.constraints, excludedTags: [...(person.constraints?.excludedTags || []), ...interests.disliked] }, now));
      const matches = interests.liked.filter(tag => item.tags.includes(tag));
      const keys = MASTER_DIMENSIONS.filter(key => Number.isFinite(person.scores?.[key]) && Number.isFinite(item.attributes?.[key]));
      const vectorFit = keys.length ? keys.reduce((sum, key) => sum + 1 - Math.min(100, Math.abs(person.scores[key] - item.attributes[key])) / 100, 0) / keys.length : .5;
      const interestFit = interests.liked.length ? matches.length / interests.liked.length : .5;
      const baseFit = interests.liked.length ? .75 * interestFit + .25 * vectorFit : vectorFit;
      const saved = interests.saved.includes(item.id);
      return { score: saved ? .3 + .7 * baseFit : baseFit, matches, saved, evidence: keys.length ? 'Also considers your expressed preference pattern.' : 'No quiz pattern used.' };
    });
    if (reasons.length) { excluded.push({ id: item.id, reasons: [...new Set(reasons)] }); continue; }
    const mean = fits.reduce((sum, fit) => sum + fit.score, 0) / fits.length;
    ranked.push({ item, fits, score: .65 * Math.min(...fits.map(fit => fit.score)) + .35 * mean });
  }
  ranked.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
  return { ranked, excluded };
}
