import assert from 'node:assert/strict';
import {legacyAssessmentRoute,baseAssessmentRoute} from '../consumer-route-core.js';
const params=query=>new URLSearchParams(query);
for(const module of ['wear','watch','move','eat','live']){
 for(const page of ['profile=1','modules=1','workspace=1&demo=1','campaignAdmin=1','tour=1','next=1','growth=1','stats=1','campaignGuide=missing','campaignReport=missing','campaign=missing','campaign=aster&published=1']){
  const query=params('module='+module+'&'+page);assert.equal(legacyAssessmentRoute(query,module),false,page+' owns its page');assert.equal(baseAssessmentRoute(query,false),false,'late base entry cannot replace '+page);
 }
 for(const context of ['', '&privacy=1','&discover=1','&together=1','&profile=0','&workspace=demo-workspace'])assert.equal(legacyAssessmentRoute(params('module='+module+context),module),true,'intentional module/overlay semantics retained');
 assert.equal(baseAssessmentRoute(params('module='+module),false),false,'base cannot overwrite another module');
 assert.equal(baseAssessmentRoute(params('campaign=aster&module='+module),true),true,'valid campaign still mounts the branded base quiz');
}
for(const query of ['', 'module=escape','module=unknown','module=escape&challenge=synthetic','module=escape&p=synthetic','module=escape&result=synthetic','privacy=1'])assert.equal(baseAssessmentRoute(params(query),false),true,'original base/shared/overlay behavior retained');
console.log('Consumer route ownership PASS: dedicated legacy pages and campaigns, all five modules, late base entry, intentional new-route priority, privacy overlay and shared-result compatibility.');
