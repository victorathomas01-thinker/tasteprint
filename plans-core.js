const UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export const validPlanId=value=>typeof value==='string'&&UUID.test(value);
export const planLabels=Object.freeze({proposed:'Invitation pending',interested:'One person interested',mutual_interest:'Both interested',scheduled:'Both approved these details',declined:'Declined',cancelled:'Cancelled',expired:'Invitation expired',completed_self_reported:'Experience self-reported'});
export function safeIdeaURL(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}}
export function planDetails({starts_at,ends_at,place},now=Date.now()){
 const start=new Date(starts_at),end=ends_at?new Date(ends_at):null;
 if(!String(place||'').trim()||String(place).trim().length>160||!Number.isFinite(+start)||+start<=now||(end&&(!Number.isFinite(+end)||+end<=+start)))throw Error('Choose a future start, a later end if needed, and a meeting place.');
 return {starts_at:start.toISOString(),...(end?{ends_at:end.toISOString()}:{}),place:String(place).trim()};
}
export function localDateTime(value){const date=new Date(value);if(!Number.isFinite(+date))return '';return new Date(+date-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
// Explicit, private download only. No attendee emails, invitation tokens or third-party service.
export function calendarFile(plan,now=new Date()){
 if(!['scheduled','completed_self_reported'].includes(plan.state)||!validPlanId(plan.id)||!plan.details?.starts_at||!Number.isFinite(Date.parse(plan.details.starts_at)))throw Error('Agree on plan details before exporting.');
 const text=value=>String(value||'').replaceAll('\\','\\\\').replace(/\r\n|\r|\n/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
 const stamp=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Tasteprint//Private Plans//EN','BEGIN:VEVENT',`UID:${plan.id}@tasteprint.invalid`,`DTSTAMP:${stamp(now)}`,`SEQUENCE:${plan.revision}`,`DTSTART:${stamp(plan.details.starts_at)}`,...(plan.details.ends_at?[`DTEND:${stamp(plan.details.ends_at)}`]:[]),`SUMMARY:${text(plan.title)}`,`LOCATION:${text(plan.details.place)}`,'DESCRIPTION:Self-organized plan. Not a booking or verified attendance.','END:VEVENT','END:VCALENDAR'];
 // RFC 5545 fold at 75 UTF-8 octets without splitting a Unicode code point.
 return lines.map(line=>{let result='',width=0;for(const char of line){const size=new TextEncoder().encode(char).length;if(width+size>75){result+='\r\n ';width=1;}result+=char;width+=size;}return result;}).join('\r\n')+'\r\n';
}
export function planActions(plan,responses,actor){
 if(!plan||!actor||![plan.creator_id,plan.recipient_id].includes(actor))return [];
 const mine=responses.find(row=>row.actor_id===actor),actions=[];
 if(['proposed','interested','mutual_interest'].includes(plan.state)){
  if(plan.recipient_id&&mine?.interest!=='interested')actions.push('interest');actions.push('decline');
 }
 if(['mutual_interest','scheduled'].includes(plan.state)){
  actions.push('details');if(plan.details?.starts_at&&mine?.approved_revision!==plan.revision)actions.push('approve');
 }
 if(['scheduled','completed_self_reported'].includes(plan.state)&&!mine?.completed_at)actions.push('complete');
 if(!['declined','cancelled','expired','completed_self_reported'].includes(plan.state))actions.push('cancel');
 if(plan.creator_id===actor)actions.push('delete');
 return actions;
}
