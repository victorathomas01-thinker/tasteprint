import { safeCatalogURL, validateItem, rankCatalog } from './catalog-core.js';
import { INTERESTS } from './interests-core.js';
const slug = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(value);
const knownTags = new Set(INTERESTS.map(item=>item.id));
const text = (value,max) => typeof value === 'string' ? value.trim().slice(0,max) : '';
export function companyDraft(value) {
  if (!slug(value?.id)) throw Error('Choose a valid company ID.');
  const name = text(value.name,120), about = text(value.about,600);
  if (!name || !about) throw Error('Add a company name and description.');
  const website = value.website ? safeCatalogURL(value.website) : null;
  if (value.website && !website) throw Error('Use a valid HTTPS website without embedded credentials.');
  if (Array.isArray(value.posts) && (value.posts.length > 30 || new Set(value.posts.map(post=>post?.id)).size !== value.posts.length)) throw Error('Use at most 30 offerings with unique IDs.');
  // Browser-controlled values are never proof of company ownership or approval.
  return {version:1,id:value.id,name,about,website,verification:'unverified',demo:true,
    posts:Array.isArray(value.posts)?value.posts.slice(0,30).map(post=>normalizePost(post,value.id)):[]};
}
export function normalizePost(value,companyId) {
  if (!slug(companyId)||!slug(value?.id)) throw Error('Use a valid offering ID.');
  if (!['event','product','activity'].includes(value.category)) throw Error('Choose event, product or activity.');
  const title=text(value.title,120),description=text(value.description,600);
  if (!title||!description) throw Error('Add an offering title and description.');
  const tags=Array.isArray(value.tags)?[...new Set(value.tags)].filter(tag=>knownTags.has(tag)):[];
  if (!tags.length) throw Error('Choose at least one relevant interest.');
  const href=value.action_url?safeCatalogURL(value.action_url):null;
  if(value.action_url&&!href)throw Error('Use a valid HTTPS offering link without embedded credentials.');
  let starts_at=null,ends_at=null;
  if(value.category==='event'){
    const zoned = value => typeof value==='string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
    if(!zoned(value.starts_at)||!zoned(value.ends_at)||Date.parse(value.ends_at)<=Date.parse(value.starts_at))throw Error('Events need a start and later end time with a timezone.');
    starts_at=new Date(value.starts_at).toISOString();ends_at=new Date(value.ends_at).toISOString();
  }
  return {id:value.id,company_id:companyId,category:value.category,title,description,tags,starts_at,ends_at,
    action_url:href,status:value.status==='withdrawn'?'withdrawn':'active',revision:Math.max(1,Number.isInteger(value.revision)?value.revision:1),demo:true,
    attributes:{},location:null,constraints:{cost:null,currency:null,duration_minutes:null,distance_km:null,step_free:null},
    source:{publisher:'Fictional company draft',url:href||`https://example.invalid/company/${companyId}/${value.id}`,verified_at:null,note:'Fictional local offering; not published, verified or bookable.'},
    availability:{status:'unknown',until:ends_at}};
}
export function companyFromCampaign(campaign) {
  // Only this fictional template has reviewed tag mappings. Never infer a real
  // company's interests or import its private questionnaire/lead fields wholesale.
  if(campaign?.id!=='charlotte-boutique-demo'||campaign.demo!==true)throw Error('Use the fictional hotel template.');
  const mapping={'neighborhood-art':['art','walking'],'morning-movement':['walking','nature'],'tasting-stories':['cooking']};
  const posts=(campaign.catalog||[]).filter(item=>mapping[item.id]).map(item=>({id:`demo-${item.id}`,title:item.name,description:item.description,tags:mapping[item.id],category:'activity',action_url:null}));
  return companyDraft({id:'demo-hotel-clt',name:campaign.name,about:'A fictional company profile adapted from the hotel demonstration. Explore offerings without another quiz.',website:null,posts});
}
export function visibleCompanyPosts(profile,participant,{relevantOnly=false,now=Date.now()}={}) {
  const normalized=companyDraft(profile);
  const {ranked,excluded}=rankCatalog(normalized.posts,[participant],{},now);
  return {ranked:relevantOnly?ranked.filter(entry=>entry.fits[0].matches.length>0):ranked,excluded};
}
export function validateCompanyPosts(profile){
  return profile.posts.flatMap(item=>validateItem(item).map(error=>`${item.id}: ${error}`));
}
