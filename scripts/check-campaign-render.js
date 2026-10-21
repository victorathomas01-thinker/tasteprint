import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual campaign runtime with a tiny DOM/MutationObserver mock.
// A textContent assignment produces a childList mutation even if text is unchanged.
const runtime = fs.readFileSync(new URL('../campaign-runtime.js', import.meta.url), 'utf8')
  .replace(/^import .*;\s*$/gm, '');

function checkObserverSettles(screen) {
  let mutations = 0;
  let observer = null;
  let notePresent = false;
  let notesAdded = 0;
  const makeTextNode = (initial) => {
    let value = initial;
    return {
      get textContent() { return value; },
      set textContent(next) { value = next; mutations += 1; },
      querySelector() { return null; }
    };
  };

  const eyebrow = makeTextNode('Original label');
  const title = makeTextNode('Original title');
  const lede = makeTextNode('Original description');
  const start = makeTextNode('Start');
  const homeNodes = {
    '.eyebrow': eyebrow,
    h1: title,
    '.lede': lede,
    '[data-action="start"]': start
  };
  const hero = {
    querySelector(selector) {
      if (selector === '.campaign-demo-note') return notePresent ? {} : null;
      return homeNodes[selector] || null;
    },
    appendChild() { notePresent = true; notesAdded += 1; mutations += 1; }
  };
  const quizPanel = { querySelector(selector) { return selector === '.eyebrow' ? eyebrow : null; } };
  const app = {};
  const document = {
    documentElement: { style: { setProperty() {} }, dataset: {} },
    title: '',
    querySelector(selector) {
      if (selector === '#app') return app;
      if (selector === '#app .hero') return screen === 'home' ? hero : null;
      if (selector === '#app .panel.pad') return screen === 'quiz' ? quizPanel : null;
      if (selector === 'meta[name="description"]') return { setAttribute() {} };
      return null;
    },
    querySelectorAll() { return []; },
    createElement() { return { className: '', textContent: '' }; },
    addEventListener() {}
  };
  class MockMutationObserver {
    constructor(callback) { observer = { callback }; }
    observe() {}
  }
  const campaign = {
    id: 'aster',
    name: 'Aster & Tide',
    label: 'Aster campaign',
    demo: true,
    copy: { title: 'Discover your stay', lede: 'Explore your options', start: 'Find my match' }
  };
  const window = { TasteprintAnalytics: { track() {} } };
  vm.runInNewContext(runtime, {
    document, window, MutationObserver: MockMutationObserver,
    getCampaign: () => campaign, matchCatalog: () => [],
    EVENTS: { CAMPAIGN_VIEW: 'campaign_view' }
  }, { filename: 'campaign-runtime.js', timeout: 1000 });

  assert.ok(observer, 'Campaign runtime should watch for screen changes.');
  assert.ok(mutations > 0, 'The initial branding should update the DOM.');
  let settled = false;
  for (let i = 0; i < 10; i++) {
    const before = mutations;
    observer.callback();
    if (mutations === before) { settled = true; break; }
  }
  assert.ok(settled, `Campaign observer never settled on the ${screen} screen (recursive DOM writes).`);
  assert.equal(eyebrow.textContent, campaign.label);
  if (screen === 'home') {
    assert.equal(title.textContent, campaign.copy.title);
    assert.equal(lede.textContent, campaign.copy.lede);
    assert.equal(start.textContent, campaign.copy.start);
    assert.equal(notesAdded, 1, 'Only one demo notice should be added.');
  }
}

checkObserverSettles('home');
checkObserverSettles('quiz');
console.log('Campaign DOM observer OK — home and quiz branding settle without recursive writes.');
