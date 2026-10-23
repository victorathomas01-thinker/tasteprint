import {INTERESTS,sanitizeInterests} from './interests-core.js';
// Refuse unreadable/newer data before offering writes, preserving the original storage.
export function savedInterests(raw){
 if(raw===null)return sanitizeInterests();
 let value;try{value=JSON.parse(raw);}catch{throw Error('Saved data could not be read. Nothing was changed.');}
 const known=new Set(INTERESTS.map(item=>item.id));
 if(!value||typeof value!=='object'||Array.isArray(value)||(value.version!==undefined&&value.version!==1)||Object.keys(value).some(key=>!['version','liked','disliked','shared','saved','dismissed'].includes(key)))throw Error('This saved-data format is unavailable. Nothing was changed.');
 for(const key of ['liked','disliked','shared','saved','dismissed'])if(value[key]!==undefined&&(!Array.isArray(value[key])||value[key].length>60||value[key].some(id=>typeof id!=='string'||(['saved','dismissed'].includes(key)?!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id):!known.has(id)))))throw Error('Saved data could not be read safely. Nothing was changed.');
 return sanitizeInterests(value);
}
export function savedCatalog(items,ids){
 const byId=new Map(items.filter(item=>item.status==='active').map(item=>[item.id,item]));
 const unique=[...new Set(ids)].reverse();
 return {available:unique.filter(id=>byId.has(id)).map(id=>byId.get(id)),unavailable:unique.filter(id=>!byId.has(id))};
}
