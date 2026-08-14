import fs from 'node:fs';

const files = {
  html: fs.readFileSync('index.html', 'utf8'),
  css: fs.readFileSync('styles.css', 'utf8'),
  polish: fs.readFileSync('polish.js', 'utf8'),
  app: fs.readFileSync('app.js', 'utf8')
};

const checks = [
  ['document language', /<html[^>]*lang="en"/i.test(files.html)],
  ['viewport meta', /name="viewport"/i.test(files.html)],
  ['meta description', /name="description"/i.test(files.html)],
  ['skip link', /class="skip-link"/i.test(files.html)],
  ['focusable main target', /<main[^>]*id="app"[^>]*tabindex="-1"/i.test(files.html)],
  ['ARIA live region', /id="a11y-status"[^>]*aria-live="polite"/i.test(files.html)],
  ['favicon', /rel="icon"/i.test(files.html)],
  ['focus-visible styles', /:focus-visible/.test(files.css)],
  ['reduced-motion support', /prefers-reduced-motion/.test(files.css)],
  ['screen-reader utility', /\.sr-only/.test(files.css)],
  ['choice controls are buttons', /class=\\?"choice/.test(files.app) && /<button/.test(files.app)],
  ['multi-select ARIA state', /aria-pressed/.test(files.polish)],
  ['view focus management', /\.focus\(/.test(files.polish)]
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`\nAccessibility guard failed: ${failed} check${failed === 1 ? '' : 's'} missing.`);
  process.exit(1);
}

console.log(`\nAccessibility guard passed (${checks.length} checks).`);
