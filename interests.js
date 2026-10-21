import { INTERESTS, sanitizeInterests } from './interests-core.js';
export const INTERESTS_KEY = 'tasteprint.interests.v1';
export function readInterests() {
  try { return sanitizeInterests(JSON.parse(localStorage.getItem(INTERESTS_KEY) || '{}')); }
  catch { return sanitizeInterests(); }
}
export function writeInterests(value) {
  try {
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(sanitizeInterests(value)));
    window.dispatchEvent(new CustomEvent('tasteprint:interests-updated'));
    return true;
  } catch { return false; }
}
export function clearInterests() {
  try { localStorage.removeItem(INTERESTS_KEY); window.dispatchEvent(new CustomEvent('tasteprint:interests-updated')); return true; }
  catch { return false; }
}
export function interestsEditor() {
  const state = readInterests();
  return `<section class="passport-interests card" aria-labelledby="interest-heading">
    <div class="eyebrow">Expressed interests · optional</div><h2 id="interest-heading">What do you actually enjoy?</h2>
    <p class="small">No quiz required. Likes guide item discovery; Avoid excludes tagged items. These choices stay on this browser and do not change your module results. Account sync currently covers quiz history only.</p>
    <form id="interest-editor"><div class="interest-grid">${INTERESTS.map(item => `<div class="interest-option"><label for="interest-${item.id}">${item.label}</label><select id="interest-${item.id}" name="${item.id}" aria-label="${item.label} preference"><option value="neutral">No preference</option><option value="liked" ${state.liked.includes(item.id) ? 'selected' : ''}>Like</option><option value="disliked" ${state.disliked.includes(item.id) ? 'selected' : ''}>Avoid</option></select><label class="interest-share"><input type="checkbox" data-share-interest="${item.id}" ${state.shared.includes(item.id) ? 'checked' : ''} ${state.liked.includes(item.id) ? '' : 'disabled'}> Allow in friend links</label></div>`).join('')}</div>
    <p class="small">Sharing is off by default. “Allow” only selects what a future Together link may include; nothing is sent until you create and share that link. Dislikes and saved items are private by default.</p>
    <button type="submit" class="primary">Save interests</button> <a class="secondary" href="?discover=1">Find specific things</a> <a class="secondary" href="?together=1">Find something together</a>
    <p data-interest-status role="status" class="small"></p></form></section>`;
}
export function bindInterestsEditor(root) {
  const form = root.querySelector('#interest-editor');
  if (!form) return;
  form.querySelectorAll('select').forEach(select => select.addEventListener('change', () => {
    const share = form.querySelector(`[data-share-interest="${select.name}"]`);
    share.disabled = select.value !== 'liked';
    if (share.disabled) share.checked = false;
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const next = { ...readInterests(), liked: [], disliked: [], shared: [] };
    for (const interest of INTERESTS) {
      const value = form.elements.namedItem(interest.id).value;
      if (value === 'liked') next.liked.push(interest.id);
      if (value === 'disliked') next.disliked.push(interest.id);
      if (value === 'liked' && form.querySelector(`[data-share-interest="${interest.id}"]`).checked) next.shared.push(interest.id);
    }
    form.querySelector('[data-interest-status]').textContent = writeInterests(next)
      ? 'Interests saved on this browser. Nothing was shared.'
      : 'Could not save: browser storage is unavailable. Your edits remain here; try again.';
  });
}
