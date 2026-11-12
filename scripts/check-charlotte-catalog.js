import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareCharlotteCatalog} from './lib/charlotte-catalog.js';
import {freshness,rankCatalog,eligibility,validateItem,ingestCatalog} from '../catalog-core.js';
import {importCatalogText,importCatalogDrafts,emptyCatalogEditor,catalogCSV,reviewCatalogDraft,approvedCatalog} from '../catalog-editor-core.js';
const review=JSON.parse(readFileSync('catalogs/charlotte-field-review.json','utf8'));
const draft=JSON.parse(readFileSync('catalogs/charlotte-pilot-draft.json','utf8'));
assert.deepEqual(draft,prepareCharlotteCatalog(review));
const sources=new Map(review.sources.map(source=>[source.url,source]));
const now=Math.max(...review.sources.map(x=>Date.parse(x.checked_at)))+1000;
const items=importCatalogText(JSON.stringify(draft),now);
assert.equal(items.length,23);assert.equal(new Set(items.map(x=>x.source.url)).size,23);
assert.equal(items.filter(x=>x.status==='active').length,19);assert.equal(items.filter(x=>x.status==='withdrawn').length,4);
for(const row of review.listings){
 const item=items.find(x=>x.id===row.id);
 for(const [key,field] of Object.entries(row.fields)){
  assert.ok(['location','hours','admission','accessibility','restrictions'].includes(key));
  assert.ok(['verified','partial','unknown'].includes(field.status));
  assert.ok(Number.isFinite(Date.parse(field.checked_at))&&Date.parse(field.checked_at)<=now);
  assert.ok(field.source_urls.length);
  for(const url of field.source_urls){const source=sources.get(url);assert.ok(source,`${row.id}: missing ${url}`);assert.equal(source.http_status,200);assert.match(url,/^https:\/\//);assert.ok(Number.isFinite(Date.parse(source.checked_at)));}
  assert.equal(field.checked_at,field.source_urls.map(url=>sources.get(url).checked_at).sort().at(-1),'field check timestamp must trace to recorded source checks');
  if(field.status==='unknown'){assert.equal(field.value,null);assert.equal(field.expires_at,null);assert.ok(field.limitation);}
  else {assert.ok(field.value.length);assert.equal(Date.parse(field.expires_at)-Date.parse(field.checked_at),field.recheck_days*86400000);}
 }
 assert.equal(item.source.expires_at,Object.values(row.fields).flatMap(x=>x.expires_at?[x.expires_at]:[]).sort()[0]);
 assert.equal(item.status,row.hold_reason?'withdrawn':'active');
 assert.deepEqual(item.attributes,{});assert.equal(item.constraints.distance_km,null);assert.equal(item.constraints.duration_minutes,null);assert.equal(item.availability.status,'unknown');
 if(item.constraints.cost===0){assert.equal(row.fields.admission.status,'verified');assert.match(row.fields.admission.value,/free|complimentary/i);assert.equal(item.constraints.currency,'USD');}
 else {assert.equal(item.constraints.cost,null);assert.equal(item.constraints.currency,null);assert.ok(eligibility(item,{maxCost:0,currency:'USD'},now).length);}
 if(item.constraints.step_free===true)assert.equal(row.fields.accessibility.status,'verified');
 assert.ok(eligibility(item,{requireAvailable:true},now).length);
 assert.equal(freshness(item,Date.parse(item.source.expires_at)),'Source needs rechecking');
 assert.ok(eligibility(item,{stepFree:true},Date.parse(item.source.expires_at)).length,'expiry invalidates access too');
}
const ids=result=>result.ranked.map(x=>x.item.id),starter=rankCatalog(items,[{}],{},now);
assert.equal(starter.ranked.length,19);
assert.deepEqual(new Set(starter.ranked.slice(0,4).map(x=>x.item.tags[0])),new Set(['coffee','art','nature','walking']));
assert.ok(starter.ranked.every(x=>x.fits.every(f=>!f.matches.length&&!f.saved)),'editorial diversity claims no preference evidence');
assert.deepEqual(ids(starter),ids(rankCatalog([...items].reverse(),[{}],{},now)),'deterministic, independent of import order');
assert.deepEqual(ids(starter),ids(rankCatalog(items,[{scores:{curiosity:90},interests:{liked:['games'],saved:['not-in-this-catalog']}}],{},now)),'unusable quiz vectors or unrelated likes/saves do not suppress editorial variety');
for(const liked of ['coffee','art','nature'])assert.ok(rankCatalog(items,[{interests:{liked:[liked]}}],{},now).ranked.slice(0,3).every(x=>x.item.tags.includes(liked)));
const free=rankCatalog(items,[{}],{maxCost:0,currency:'USD'},now);assert.equal(free.ranked.length,4);
const accessible=rankCatalog(items,[{}],{stepFree:true},now);assert.equal(accessible.ranked.length,3);
assert.deepEqual(new Set(ids(rankCatalog(items,[{}],{stepFree:true,maxCost:0,currency:'USD'},now))),new Set(['clt-mcmillan-greenhouse','clt-mccoll-center']));
for(const rule of [{maxDistance:5},{maxMinutes:60},{requireAvailable:true}])assert.equal(rankCatalog(items,[{}],rule,now).ranked.length,0,'do not invent practical facts to fill results');
assert.ok(rankCatalog(items,[{interests:{disliked:['coffee']}}],{},now).ranked.every(x=>!x.item.tags.includes('coffee')));
const pair=[{interests:{liked:['coffee']}},{interests:{liked:['art']},constraints:{stepFree:true}}];
assert.deepEqual(ids(rankCatalog(items,pair,{},now)),ids(rankCatalog(items,[...pair].reverse(),{},now)));
assert.ok(rankCatalog(items,pair,{},now).ranked.every(x=>x.item.constraints.step_free===true),'every participant’s hard requirements apply');
assert.deepEqual(ids(starter),ids(rankCatalog(items.map(x=>({...x,partner:true,sponsored:true})),[{}],{},now)));
// Existing five sources remain updateable without resetting IDs/history.
const originals=items.filter(x=>x.revision===2);assert.equal(originals.length,5);
assert.deepEqual(ingestCatalog(originals.map(x=>({...x,revision:1})),originals,now).errors,[]);
assert.deepEqual(importCatalogText(catalogCSV(items),now).map(x=>x.source.expires_at),items.map(x=>x.source.expires_at));
assert.deepEqual(importCatalogText(catalogCSV(items),now).map(x=>x.status),items.map(x=>x.status),'CSV preserves editorial holds');
const legacyCSV='id,title,description,category,tags,source_url,source_publisher,source_note\nlegacy,Legacy listing,Synthetic compatibility fixture,activity,art,https://synthetic.invalid/legacy,Synthetic publisher,Synthetic source only';
const legacy=importCatalogText(legacyCSV,now)[0];assert.equal(legacy.status,'active');assert.equal(legacy.source.expires_at,undefined);
let state=importCatalogDrafts(emptyCatalogEditor(),items,now);
assert.equal(approvedCatalog(state,now).length,0);
const candidate=items.find(x=>x.id==='clt-mccoll-center');
state=reviewCatalogDraft(state,candidate.id,'submit','Synthetic local review only',now);
assert.throws(()=>reviewCatalogDraft(state,candidate.id,'approve','Expired evidence',Date.parse(candidate.source.expires_at)),/Check the source/);
state=reviewCatalogDraft(state,candidate.id,'approve','Synthetic local review only',now);
assert.equal(approvedCatalog(state,now).length,1);assert.equal(approvedCatalog(state,Date.parse(candidate.source.expires_at)).length,0);
for(const expires_at of ['bad','2026-11-01T00:00:00Z','2026-11-04'])assert.ok(validateItem({...candidate,source:{...candidate.source,expires_at}},now).length);
assert.ok(validateItem({...candidate,source:{...candidate.source,verified_at:null}},now).length);
console.log('Charlotte catalog PASS: 23 sourced candidates, 19 reviewable/4 holds, per-field checks/deadlines, no invented total costs/access/availability/distance, varied honest starter picks, realistic solo/group constraints, old-source updates, CSV and expiry-aware approval/export.');
