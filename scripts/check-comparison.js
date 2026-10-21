import assert from 'node:assert/strict';
import {comparePreferencePatterns} from '../comparison-core.js';
const keys=['one','two','three'];
const a={one:0,two:50,three:100},b={one:100,two:40,three:100};
const result=comparePreferencePatterns(a,b,keys);assert.equal(result.closeCount,2);assert.equal(result.dimensions,3);assert.equal(result.averageDifference,110/3);assert.deepEqual(result.closest,{key:'three',difference:0});assert.deepEqual(result.furthest,{key:'one',difference:100});assert.deepEqual(comparePreferencePatterns(b,a,keys),result);
assert.equal(comparePreferencePatterns(a,a,keys).closeCount,3);assert.equal(comparePreferencePatterns({one:0},{one:100},['one']).closeCount,0);
for(const invalid of [{one:NaN},{one:101},{one:-1},{one:'50'},{}])assert.throws(()=>comparePreferencePatterns(invalid,{one:50},['one']));
assert.throws(()=>comparePreferencePatterns(a,b,[]));assert.throws(()=>comparePreferencePatterns(a,b,['one','one']));assert.ok(!('percentage' in result));
console.log('Preference comparison PASS: transparent raw differences/counts, symmetric comparison and invalid-score rejection; no compatibility probability.');
