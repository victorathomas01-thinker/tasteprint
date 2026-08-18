import fs from 'node:fs';

const polish = fs.readFileSync(new URL('../resume-polish.js', import.meta.url), 'utf8');
for (const marker of [
  'View 5-minute product demo',
  'Explore all six modules',
  'Useful after the reveal',
  'Privacy-first architecture',
  '?tour=1',
  '?modules=1',
  'BARE_HOME'
]) {
  if (!polish.includes(marker)) throw new Error(`Resume landing polish is missing ${marker}.`);
}
if (polish.includes('fetch(') || polish.includes('createClient')) {
  throw new Error('Recruiter-facing landing polish must remain backend-independent.');
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const marker of [
  'Tasteprint — preference and recommendation platform',
  'resume-polish.css',
  'resume-polish.js',
  'og:description',
  'twitter:card'
]) {
  if (!html.includes(marker)) throw new Error(`Public entry metadata is missing ${marker}.`);
}

const resume = fs.readFileSync(new URL('../RESUME.md', import.meta.url), 'utf8');
for (const marker of [
  'Preference & Recommendation Platform',
  '65,536-response-path checks',
  'local-first web application',
  'production backend architecture/scaffolding'
]) {
  if (!resume.includes(marker)) throw new Error(`Resume reference is missing ${marker}.`);
}

console.log('Resume presentation OK — clean root entry, backend-free portfolio tour, accurate project framing and recruiter metadata are wired.');
