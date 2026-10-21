import assert from 'node:assert/strict';
import { catalogItems } from '../catalog.js';
import { eligibility, freshness, ingestCatalog, rankCatalog, safeCatalogURL, validateItem } from '../catalog-core.js';
import { sanitizeInterests, setItemDecision } from '../interests-core.js';
import { aggregateMaster, makeSnapshot } from '../platform-core.js';
const now = Date.parse('2026-10-21T12:00:00Z');
const items = catalogItems();
assert.equal(items.length,6);assert.deepEqual(ingestCatalog([],items,now).errors,[]);
assert.ok(items.every(item=>item.source.verified_at===null&&item.availability.status==='unknown'));
const dirty = {liked:['animation','comedy','comedy','unknown'],disliked:['comedy'],shared:['animation','drama'],email:'secret',saved:['spring','<script>']};
assert.deepEqual(sanitizeInterests(dirty),{version:1,liked:['animation'],disliked:['comedy'],shared:['animation'],saved:['spring'],dismissed:[]});
assert.equal(sanitizeInterests(null).liked.length,0);
let state=setItemDecision({},'spring','save');state=setItemDecision(state,'spring','dismiss');assert.deepEqual(state.saved,[]);assert.deepEqual(state.dismissed,['spring']);state=setItemDecision(state,'spring','save');assert.deepEqual(state.dismissed,[]);
const history=[makeSnapshot({moduleId:'watch',scores:{surprise:85,gentleness:40}})];const old=JSON.stringify(history);const master=aggregateMaster(history);sanitizeInterests(dirty);assert.equal(JSON.stringify(history),old);assert.equal(aggregateMaster(history).scores.novelty,master.scores.novelty);
for(const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com'])assert.equal(safeCatalogURL(url),null);
const invalid=structuredClone(items[0]);invalid.source.url='javascript:alert(1)';assert.ok(validateItem(invalid,now).length);
const copy={...items[0],id:'duplicate',source:{...items[0].source,url:items[0].source.url+'?utm_source=test'}};assert.equal(ingestCatalog(items,[copy],now).errors.length,1);
assert.equal(ingestCatalog(items,[items[0]],now).errors.length,1);
const withdrawn={...items[0],revision:2,status:'withdrawn'};const updated=ingestCatalog(items,[withdrawn],now);assert.equal(updated.items[0].status,'withdrawn');assert.equal(rankCatalog(updated.items,[{}],{},now).ranked.some(x=>x.item.id===withdrawn.id),false);
const a={interests:{liked:['comedy'],disliked:['drama']}},b={interests:{liked:['fantasy'],disliked:['science-fiction']}};
const ranked=rankCatalog(items,[a,b],{},now);assert.ok(ranked.ranked.length);assert.ok(ranked.ranked.every(x=>!x.item.tags.includes('drama')&&!x.item.tags.includes('science-fiction')));
assert.deepEqual(ranked.ranked.map(x=>[x.item.id,x.score]),rankCatalog(items,[b,a],{},now).ranked.map(x=>[x.item.id,x.score]));
assert.equal(rankCatalog(items,[{interests:{disliked:['animation']}}],{},now).ranked.length,0);
for(const hard of [{maxCost:0,currency:'USD'},{maxMinutes:20},{maxDistance:10},{stepFree:true},{requireAvailable:true}])assert.equal(rankCatalog(items,[a],hard,now).ranked.length,0,'unknown metadata never satisfies hard limits');
const verified={...items[0],source:{...items[0].source,verified_at:'2026-10-20T12:00:00Z'},constraints:{cost:0,currency:'USD',duration_minutes:10,distance_km:3,step_free:true},availability:{status:'available',until:'2026-10-22T00:00:00Z'}};
assert.deepEqual(eligibility(verified,{maxCost:0,currency:'USD',stepFree:true,requireAvailable:true,maxMinutes:10,maxDistance:3},now),[]);
assert.ok(eligibility(verified,{maxCost:0,currency:'EUR'},now).length);assert.ok(eligibility(verified,{maxMinutes:9},now).length);
assert.ok(eligibility(verified,{requireAvailable:true},now+2*86400000).length);assert.equal(freshness(verified,now+40*86400000),'Source needs rechecking');
const partner=items.map(x=>({...x,partner:true,sponsored:true}));assert.deepEqual(rankCatalog(items,[a,b],{},now).ranked.map(x=>x.item.id),rankCatalog(partner,[a,b],{},now).ranked.map(x=>x.item.id));
// Independent participant fits must influence the fair-minimum score; extreme preferences
// must not be flattened into an average vector before fitting.
for(const result of ranked.ranked){const fits=result.fits.map(x=>x.score);assert.equal(result.score,.65*Math.min(...fits)+.35*(fits.reduce((s,x)=>s+x,0)/fits.length));}
console.log('Discovery PASS: legacy Passport compatibility, private interests, source validation, revisions/withdrawal/deduplication, exclusions including unknown/stale metadata, symmetric fair ranking and sponsor invariance.');

// Malformed imported metadata must be rejected without rendering objects as trusted facts.
for (const patch of [{source:{...items[0].source,publisher:{name:'x'}}},{source:{...items[0].source,note:42}},{content_note:{html:'<img>'}},{location:{lat:1}},{attributes:[]},{availability:{status:'available',until:42}}]) {
  assert.ok(validateItem({...items[0],...patch},now).length);
  assert.doesNotThrow(()=>rankCatalog([{...items[0],...patch}],[a],{},now));
}
const {discoveryFilters,discoveryURL,discoveryConstraints,browseCatalog}=await import('../discovery-core.js');
const f=discoveryFilters(new URLSearchParams('q=Spring&category=film&maxCost=0&maxMinutes=20&maxDistance=3&available=1&saved=1&item=spring'));
assert.deepEqual(discoveryFilters(new URL(discoveryURL(f),'https://example.test').searchParams),f);
assert.deepEqual(discoveryConstraints(f),{stepFree:false,requireAvailable:true,maxCost:0,maxMinutes:20,maxDistance:3,currency:'USD'});
assert.equal(browseCatalog(items,f,{saved:['spring'],dismissed:[]})[0].id,'spring');
assert.equal(browseCatalog(items,{...f,category:'cafe'},{saved:['spring'],dismissed:[]}).length,0);
assert.equal(browseCatalog(items,f,{saved:['spring'],dismissed:['spring']}).length,0);
for(const bad of ['-1','NaN','Infinity','garbage'])assert.equal(discoveryFilters(new URLSearchParams({maxCost:bad})).maxCost,'');
assert.equal(discoveryFilters(new URLSearchParams('category=unknown')).category,'');
assert.ok(!discoveryURL(f).includes('liked'));
console.log('Discovery controls PASS: public deep links, category/search/saved filtering, hard constraints, malformed import rejection.');
