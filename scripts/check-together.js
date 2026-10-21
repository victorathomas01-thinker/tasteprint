import assert from 'node:assert/strict';
import {projection,encodeShare,decodeShare,rankTogether,transition} from '../together-core.js';
assert.deepEqual(projection({curiosity:80,email:'private',serenity:NaN}),{curiosity:80});
const token=encodeShare({curiosity:80},1000);assert.deepEqual(decodeShare(token,1001),{curiosity:80});assert.equal(decodeShare(token,1000+8*86400000),null);assert.equal(decodeShare('broken'),null);
const a={curiosity:90,serenity:80,energy:20},b={curiosity:60,serenity:60,energy:70};
assert.equal(rankTogether(a,b,{excludeActive:true}).some(x=>x.active),false);
assert.deepEqual(rankTogether(a,b),rankTogether(b,a).map(x=>({...x,reason:rankTogether(a,b).find(y=>y.id===x.id).reason})));
assert.deepEqual(rankTogether({},{}),[]);
let p={state:'proposed',interest:{}};assert.throws(()=>transition(p,'intruder','interest'));assert.throws(()=>transition(p,'you','agree'));
p=transition(p,'you','interest');assert.equal(p.state,'interested');p=transition(p,'friend','interest');assert.equal(p.state,'mutual_interest');
p=transition(p,'you','details','Friday at 7, at home');p=transition(p,'you','agree');assert.equal(p.state,'mutual_interest');p=transition(p,'friend','agree');assert.equal(p.state,'scheduled');
p=transition(p,'you','details','Saturday at 7, at home');assert.deepEqual(p.approvals,{});assert.equal(p.state,'mutual_interest');
for(const event of ['cancel','decline','expire']){const closed=transition(p,'friend',event);assert.throws(()=>transition(closed,'you','interest'));}
p=transition(transition(p,'you','agree'),'friend','agree');assert.equal(transition(p,'you','complete').state,'completed_self_reported');
console.log('Together core: minimal projection, expiry, invalid links, fair ranking, hard exclusion, participant validation, consent, reapproval and closure passed.');
