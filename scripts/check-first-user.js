import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visitTastes,rememberVisitLikes,saveScopeCopy} from '../discovery-session-core.js';
import {importCatalogText,emptyCatalogEditor,importCatalogDrafts} from '../catalog-editor-core.js';
import {eligibility,rankCatalog} from '../catalog-core.js';
const durable={version:1,liked:['coffee'],disliked:['drama'],shared:['coffee'],saved:['spring'],dismissed:[]};
const before=structuredClone(durable),visit=visitTastes(durable,['art','drama','unknown']);
assert.deepEqual(durable,before);assert.deepEqual(visit.liked,['coffee','art']);assert.deepEqual(visit.shared,['coffee']);assert.deepEqual(visit.disliked,['drama']);
const remembered=rememberVisitLikes(durable,['nature']);assert.deepEqual(remembered.liked,['coffee','nature']);assert.deepEqual(remembered.saved,['spring']);assert.deepEqual(remembered.shared,['coffee']);
assert.match(saveScopeCopy(false),/device only/);assert.match(saveScopeCopy(true),/not uploaded automatically/);
const items=importCatalogText(readFileSync('catalogs/charlotte-pilot-draft.json','utf8'));
assert.equal(items.length,5);
assert.ok(rankCatalog(items,[{interests:visitTastes({},['coffee'])}]).ranked.slice(0,2).every(x=>x.item.category==='cafe'));
assert.ok(rankCatalog(items,[{interests:visitTastes({},['art'])}]).ranked.slice(0,2).every(x=>x.item.tags.includes('art')));assert.equal(new Set(items.map(x=>x.source.url)).size,5);
const workbench=importCatalogDrafts(emptyCatalogEditor(),items);assert.ok(workbench.entries.every(x=>x.workflow==='draft'));
for(const item of items){
 assert.equal(item.availability.status,'unknown');for(const key of ['cost','currency','duration_minutes','distance_km'])assert.equal(item.constraints[key],null);
 assert.deepEqual(item.attributes,{});assert.ok(item.source.verified_at);assert.ok(item.source.note.length>100);
 const checked=Date.parse(item.source.verified_at)+1000;
 assert.ok(eligibility(item,{maxCost:0,currency:'USD'},checked).length,'no invented free admission');
 assert.ok(eligibility(item,{requireAvailable:true},checked).length,'no invented live availability');
 assert.ok(eligibility(item,{stepFree:true},checked+31*86400000).length,'stale access facts fail closed');
}
assert.match(items.find(x=>x.id==='clt-mcmillan-greenhouse').content_note,/outdoor gardens are not wheelchair-accessible/);
console.log('First user core PASS: temporary intent, explicit durable likes, preserved sharing/avoids/saves, honest scope, five draft-only sources, unknown facts and stale access exclusions.');
