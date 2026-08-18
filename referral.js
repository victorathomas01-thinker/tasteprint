function referralToken() {
  return window.TasteprintAnalytics?.referralToken?.() || null;
}

function decorate(raw) {
  if (!raw) return raw;
  try {
    const url = new URL(raw, location.href);
    const token = referralToken();
    if (token) url.searchParams.set('ref', token);
    return url.toString();
  } catch {
    return raw;
  }
}

async function copyText(value) {
  if (!navigator.clipboard?.writeText) return false;
  await navigator.clipboard.writeText(value);
  return true;
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
  } catch (error) {
    console.warn('Tasteprint referral copy unavailable', error);
  }
  return 'show';
}

function showOutcome(button, url, result) {
  const tools = button.closest('.challenge-tools');
  if (!tools) return;
  const input = tools.querySelector('.challenge-link');
  const status = tools.querySelector('.challenge-status');

  if (result === 'cancelled') {
    if (status) status.textContent = '';
    return;
  }
  if (result === 'shared') {
    if (status) status.textContent = 'Challenge ready to send.';
    return;
  }
  if (result === 'copied') {
    if (status) status.textContent = 'Challenge link copied.';
    return;
  }
  if (input) {
    input.value = url;
    input.classList.remove('hidden');
    input.focus();
    input.select();
  }
  if (status) status.textContent = 'Copy this link and send it to a friend.';
}

function trackShareOutcome(outcome) {
  const token = referralToken();
  window.TasteprintAnalytics?.track?.('challenge_share_outcome', {
    referral_token: token,
    outcome
  });
}

// Intercept the challenge button before challenge.js's target listener so every
// outbound challenge carries a non-identifying referral token.
document.addEventListener('click', async (event) => {
  const button = event.target.closest('.send-challenge');
  if (!button || !window.TasteprintLinks?.challengeURL) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const previous = button.textContent;
  button.disabled = true;
  button.textContent = 'Preparing challenge…';
  try {
    const url = decorate(window.TasteprintLinks.challengeURL());
    const result = await shareChallenge(url);
    showOutcome(button, url, result);
    trackShareOutcome(result);
  } finally {
    button.disabled = false;
    button.textContent = previous;
  }
}, true);

function decorateAnchors() {
  document.querySelectorAll('a[href]').forEach((anchor) => {
    if (!/[?&](challenge|result)=/.test(anchor.href)) return;
    anchor.href = decorate(anchor.href);
  });
}

const observer = new MutationObserver(decorateAnchors);
observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
decorateAnchors();

window.TasteprintReferrals = Object.freeze({ decorate });
