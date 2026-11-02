import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {prepareCharlotteCatalog} from './lib/charlotte-catalog.js';
import {importCatalogText} from '../catalog-editor-core.js';
const review=JSON.parse(readFileSync('catalogs/charlotte-field-review.json','utf8'));
const output=JSON.stringify(prepareCharlotteCatalog(review),null,2)+'\n';
importCatalogText(output);
if(process.argv.includes('--due')){
  const now=Date.now();for(const entry of review.listings)for(const [name,field] of Object.entries(entry.fields)){
    const due=field.expires_at?Date.parse(field.expires_at):Date.parse(field.checked_at)+field.recheck_days*86400000;
    if(due<=now+7*86400000)console.log(`${entry.id} · ${name} · ${field.status} · ${due<=now?'DUE':'upcoming'} ${new Date(due).toISOString()}${entry.hold_reason?' · HOLD':''}`);
  }
}
if(process.argv.includes('--write'))writeFileSync('catalogs/charlotte-pilot-draft.json',output);
else assert.equal(readFileSync('catalogs/charlotte-pilot-draft.json','utf8'),output,'Draft differs from its field evidence; review evidence then run with --write.');
console.log(`Charlotte draft ${process.argv.includes('--write')?'prepared':'consistent'}: ${review.listings.length} candidates; no import, approval or publishing performed.`);
