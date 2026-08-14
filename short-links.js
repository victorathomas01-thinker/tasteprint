// Progressive enhancement for database-backed short links.
// Stateless ?result= / ?challenge= links remain the permanent fallback.

const api = () => window.TasteprintAnalytics;
const links = () => window.TasteprintLinks;
let latestShortCode = null;

function cleanURL() {
  const url = new URL(location.href);
  for (const key of ['p', 'c', 'result', 'challenge']) url.searchParams.delete(key);
  url.hash = '';
  return url;
}

function shortURL(kind, code) {
  const url = cleanURL();
  url.searchParams.set(kind, code);
  if (kind === 'c') {
    const ref = api()?.referralToken?.();
    if (ref) url.searchParams.set('ref', ref);
  }
  return url.toString();
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
}

function setToolStatus(message) {
  const status = document.querySelector('.challenge-tools .challenge-status');
  if (status) status.textContent = message;
}

async function shareChallenge(url) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Compare Tasteprints',
        text: 'Take Tasteprint Escape and see whether we should actually travel together.',
        url
      });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    if (await copyText(url)) return 'copied';
  } catch {}
  return 'show';
}

function showFallbackURL(url, message) {
  const tools = document.querySelector('.challenge-tools');
  if (!tools) return;
  const input = tools.querySelector('.challenge-link');
  if (input) {
    input.value = url;
    input.classList.remove('hidden');
    input.focus();
    input.select();
  }
  setToolStatus(message);
}

window.addEventListener('tasteprint:profile-persisted', (event) => {
  const code = event.detail?.shortCode;
  if (!/^[a-f0-9]{10}$/i.test(code || '')) return;
  latestShortCode = String(code).toLowerCase();
  setToolStatus('Short share links are ready for this result.');
});

document.addEventListener('click', async (event) => {
  if (!latestShortCode) return;

  const resultButton = event.target.closest('.copy-result');
  if (resultButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const url = shortURL('p', latestShortCode);
    try {
      if (await copyText(url)) setToolStatus('Short result link copied.');
      else showFallbackURL(url, 'Copy this short result link.');
    } catch {
      showFallbackURL(url, 'Copy this short result link.');
    }
    return;
  }

  const challengeButton = event.target.closest('.send-challenge');
  if (challengeButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const url = shortURL('c', latestShortCode);
    const previous = challengeButton.textContent;
    challengeButton.disabled = true;
    challengeButton.textContent = 'Preparing short challenge…';
    const outcome = await shareChallenge(url);
    challengeButton.disabled = false;
    challengeButton.textContent = previous;
    if (outcome === 'shared') setToolStatus('Short challenge ready to send.');
    else if (outcome === 'copied') setToolStatus('Short challenge link copied.');
    else if (outcome === 'show') showFallbackURL(url, 'Copy this short challenge link.');
  }
}, true);

async function expandInboundShortLink() {
  const current = new URL(location.href);
  const resultCode = current.searchParams.get('p');
  const challengeCode = current.searchParams.get('c');
  const code = resultCode || challengeCode;
  if (!code || !/^[a-f0-9]{10}$/i.test(code)) return;
  if (!api()?.remoteEnabled?.() || !links()?.encodeScores) return;

  const profile = await api().resolveSharedProfile(code);
  if (!profile?.scores) return;

  const expanded = cleanURL();
  expanded.searchParams.set(resultCode ? 'result' : 'challenge', links().encodeScores(profile.scores));
  const ref = current.searchParams.get('ref');
  if (ref) expanded.searchParams.set('ref', ref.slice(0, 64));
  location.replace(expanded.toString());
}

expandInboundShortLink();
