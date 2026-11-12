// Explicit choices are separate from inferred module scores and account-sync history.
export const INTERESTS = Object.freeze([
  { id: 'animation', label: 'Animation' }, { id: 'comedy', label: 'Comedy' },
  { id: 'fantasy', label: 'Fantasy' }, { id: 'drama', label: 'Drama' },
  { id: 'science-fiction', label: 'Science fiction' }, { id: 'nature', label: 'Nature' },
  { id: 'art', label: 'Art' }, { id: 'coffee', label: 'Coffee' },
  { id: 'cooking', label: 'Cooking' }, { id: 'walking', label: 'Walking' },
  { id: 'games', label: 'Games' }, { id: 'live-music', label: 'Live music' }
]);
const known = new Set(INTERESTS.map(item => item.id));
const list = value => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string'))].slice(0, 60) : [];
export const interestLabel = id => INTERESTS.find(item => item.id === id)?.label || id;
export function sanitizeInterests(value = {}) {
  const disliked = list(value?.disliked).filter(id => known.has(id));
  const liked = list(value?.liked).filter(id => known.has(id) && !disliked.includes(id));
  const ids = values => list(values).filter(id => /^[a-z0-9][a-z0-9-]{0,63}$/.test(id));
  return {
    version: 1, liked, disliked,
    shared: list(value?.shared).filter(id => liked.includes(id)),
    saved: ids(value?.saved), dismissed: ids(value?.dismissed)
  };
}
export function setItemDecision(current, id, action) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw Error('Invalid item');
  const next = sanitizeInterests(current);
  if (action === 'save') { next.saved = [...new Set([...next.saved, id])].slice(-60); next.dismissed = next.dismissed.filter(x => x !== id); }
  else if (action === 'dismiss') { next.dismissed = [...new Set([...next.dismissed, id])].slice(-60); next.saved = next.saved.filter(x => x !== id); }
  else if (action === 'unsave') next.saved = next.saved.filter(x => x !== id);
  else if (action === 'restore') next.dismissed = next.dismissed.filter(x => x !== id);
  else throw Error('Unknown item action');
  return next;
}
