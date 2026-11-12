// Existing dedicated pages take priority over legacy assessment module flags.
// Privacy remains an overlay; new discovery routes retain their existing rule
// that a specific module deep link takes priority. Shared-result flags are kept.
const dedicatedFlags=['profile','modules','workspace','campaignAdmin','tour','next','growth','stats'];
const assessmentModules=new Set(['wear','watch','move','eat','live']);
export function dedicatedLegacyPage(params){
 return dedicatedFlags.some(key=>params.get(key)==='1')||Boolean(params.get('campaignGuide'))||Boolean(params.get('campaignReport')?.trim());
}
export function legacyAssessmentRoute(params,id){
 return params.get('module')===id&&!params.has('campaign')&&!dedicatedLegacyPage(params);
}
export function baseAssessmentRoute(params,campaignAvailable=false){
 if(params.has('campaign'))return campaignAvailable;
 return !dedicatedLegacyPage(params)&&!assessmentModules.has(params.get('module'));
}
