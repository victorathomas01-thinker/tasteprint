import { ingestCatalog, validateItem, freshness } from './catalog-core.js';
const HEADERS=['id','title','description','category','tags','source_url','source_publisher','source_note','verified_at','action_url','location','content_note','cost','currency','duration_minutes','distance_km','step_free','availability','available_until','revision'];
export const CATALOG_EDITOR_KEY='tasteprint.catalog-editor.v1';
const fail=message=>{throw Error(message);};
// Strict quoted-field parser: malformed rows fail the whole batch without partial writes.
export function parseCatalogCSV(text) {
  const rows=[];let row=[],cell='',state='start';
  const source=String(text).replace(/^\uFEFF/,'');
  for(let i=0;i<=source.length;i++){
    const ch=source[i],end=i===source.length;
    if(state==='quoted'){
      if(end)fail('Unclosed CSV quote.');
      if(ch==='"'){if(source[i+1]==='"'){cell+='"';i++;}else state='closed';}else cell+=ch;
      continue;
    }
    if(end||ch===','||ch==='\r'||ch==='\n'){
      row.push(cell);cell='';state='start';
      if(ch!==','){if(row.some(value=>value!==''))rows.push(row);row=[];if(ch==='\r'&&source[i+1]==='\n')i++;}
    }else if(ch==='"'&&state==='start')state='quoted';
    else if(ch==='"'||state==='closed')fail('Malformed CSV field.');
    else{cell+=ch;state='plain';}
  }
  if(rows.length<2)fail('Include a header and at least one catalog row.');
  const headers=rows.shift().map(value=>value.trim());
  if(new Set(headers).size!==headers.length||headers.some(h=>!HEADERS.includes(h)))fail('Duplicate or unknown CSV column.');
  for(const key of HEADERS.slice(0,8))if(!headers.includes(key))fail(`Missing CSV column: ${key}`);
  return rows.map((values,index)=>{
    if(values.length!==headers.length)fail(`CSV row ${index+2}: incorrect column count.`);
    const x=Object.fromEntries(headers.map((h,i)=>[h,values[i]]));
    const numeric=key=>x[key]?.trim()?Number(x[key]):null;
    if(x.step_free&&!['true','false'].includes(x.step_free))fail('step_free must be true, false or blank.');
    return {id:x.id,title:x.title,description:x.description,category:x.category,tags:x.tags.split('|').filter(Boolean),revision:x.revision?Number(x.revision):1,status:'active',attributes:{},
      source:{url:x.source_url,publisher:x.source_publisher,note:x.source_note,verified_at:x.verified_at||null},action_url:x.action_url||null,
      location:x.location||null,content_note:x.content_note||'',constraints:{cost:numeric('cost'),currency:x.currency||null,duration_minutes:numeric('duration_minutes'),distance_km:numeric('distance_km'),step_free:x.step_free?x.step_free==='true':null},
      availability:{status:x.availability||'unknown',until:x.available_until||null}};
  });
}
export function importCatalogText(text,now=Date.now()){
  if(typeof text!=='string'||text.length>1000000)fail('Catalog import must be at most 1 MB.');
  const trimmed=text.trim();let items;
  if(trimmed.startsWith('[')||trimmed.startsWith('{')){const parsed=JSON.parse(trimmed);items=Array.isArray(parsed)?parsed:parsed.items;}
  else items=parseCatalogCSV(trimmed);
  if(!Array.isArray(items)||!items.length||items.length>200)fail('Import between 1 and 200 catalog entries.');
  const result=ingestCatalog([],items,now);
  if(result.errors.length)fail(result.errors.map(e=>`${e.id||'Item'}: ${e.errors.join(', ')}`).join('; '));
  if(result.items.length!==items.length)fail('Duplicate item IDs in import.');
  return result.items;
}
export function emptyCatalogEditor(){return {version:1,entries:[]};}
export function validateCatalogEditor(value,now=Date.now()){
  if(value?.version!==1||!Array.isArray(value.entries)||value.entries.length>200)fail('Catalog drafts are unreadable. Export a raw backup before explicitly resetting.');
  const ids=new Set();
  for(const entry of value.entries){
    if(!entry||validateItem(entry.item,now).length||ids.has(entry.item.id)||!['draft','review','approved','withdrawn'].includes(entry.workflow)||!Array.isArray(entry.history)||entry.history.length>100)fail('Catalog drafts are unreadable. No changes were saved.');
    ids.add(entry.item.id);
  }
  return structuredClone(value);
}
export function importCatalogDrafts(current,items,now=Date.now()){
  const next=validateCatalogEditor(current,now);
  const combined=ingestCatalog(next.entries.map(e=>e.item),items,now);
  if(combined.errors.length)fail(combined.errors.map(e=>`${e.id}: ${e.errors.join(', ')}`).join('; '));
  for(const item of items){
    const old=next.entries.find(e=>e.item.id===item.id);
    const history=[...(old?.history||[]),{at:new Date(now).toISOString(),action:'edited',item:structuredClone(item)}];
    if(history.length>100)fail('History limit reached. Export an archive before creating a new catalog batch.');
    const entry={item:structuredClone(item),workflow:item.status==='withdrawn'?'withdrawn':'draft',history};
    if(old)next.entries[next.entries.indexOf(old)]=entry;else next.entries.push(entry);
  }
  return validateCatalogEditor(next,now);
}
export function reviewCatalogDraft(current,id,action,note,now=Date.now()){
  const next=validateCatalogEditor(current,now),entry=next.entries.find(e=>e.item.id===id);
  if(!entry)fail('Item unavailable.');
  if(!['submit','approve','return','withdraw'].includes(action))fail('Unknown review action.');
  const memo=String(note||'').trim();if(!memo||memo.length>500)fail('Add a review note of 1–500 characters.');
  if(action==='submit'&&entry.workflow!=='draft')fail('Only a draft can enter review.');
  if(['approve','return'].includes(action)&&entry.workflow!=='review')fail('Only an item in review can receive this decision.');
  if(action==='approve'&&freshness(entry.item,now)!=='Source checked')fail('Check the source and enter its verification date before approval.');
  if(entry.history.length>=100)fail('History limit reached. Export an archive first.');
  entry.workflow=({submit:'review',approve:'approved',return:'draft',withdraw:'withdrawn'})[action];
  entry.history.push({at:new Date(now).toISOString(),action,note:memo});return next;
}
export function approvedCatalog(current,now=Date.now()){
  return validateCatalogEditor(current,now).entries.filter(e=>e.workflow==='approved'&&e.item.status==='active'&&freshness(e.item,now)==='Source checked').map(e=>e.item);
}
export function catalogCSV(items){
  // Avoid spreadsheet formula execution. JSON export is the lossless interchange format.
  const quote=value=>{let str=String(value??'');if(/^\s*[=+@-]|^[\t\r\n]/.test(str))str="'"+str;return '"'+str.replaceAll('"','""')+'"';};
  const rows=items.map(x=>[x.id,x.title,x.description,x.category,x.tags.join('|'),x.source.url,x.source.publisher,x.source.note,x.source.verified_at,x.action_url,x.location,x.content_note,x.constraints?.cost,x.constraints?.currency,x.constraints?.duration_minutes,x.constraints?.distance_km,x.constraints?.step_free,x.availability.status,x.availability.until,x.revision]);
  return [HEADERS.join(','),...rows.map(row=>row.map(quote).join(','))].join('\r\n');
}
export function readCatalogEditor(storage=globalThis.localStorage){
  const raw=storage.getItem(CATALOG_EDITOR_KEY);return raw?validateCatalogEditor(JSON.parse(raw)):emptyCatalogEditor();
}
export function saveCatalogEditor(state,storage=globalThis.localStorage){
  // Never silently overwrite corrupt or newer-version local work.
  readCatalogEditor(storage);storage.setItem(CATALOG_EDITOR_KEY,JSON.stringify(validateCatalogEditor(state)));
}
