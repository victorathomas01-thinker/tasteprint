// Editorial preparation only: no network, storage, accounts or publishing.
export function prepareCharlotteCatalog(review) {
  return {version:1,items:review.listings.map(entry=>{
    const fields=Object.values(entry.fields),checked=fields.map(x=>x.checked_at).sort().at(-1);
    const expires=fields.flatMap(x=>x.expires_at?[x.expires_at]:[]).sort()[0];
    const hours=entry.fields.hours.value||'Unknown.',admission=entry.fields.admission.value||'Unknown; no free-entry inference.';
    return {id:entry.id,title:entry.title,category:entry.category,tags:entry.tags,description:entry.description,
      location:entry.fields.location.value,revision:entry.revision,status:entry.hold_reason?'withdrawn':'active',attributes:{},
      source:{url:entry.primary_source,publisher:entry.publisher,verified_at:checked,expires_at:expires,
        note:`Official primary-source page checks only; not independent inspection or live availability. Hours: ${hours} Admission: ${admission} Physical access: ${entry.fields.accessibility.status}. Field-specific source URLs, exact checks, restrictions and expiry: catalogs/charlotte-field-review.json (${entry.id}). ${entry.hold_reason?'Editorial hold; not a claim of permanent closure.':'Editorial candidate; founder approval still required.'}`},
      action_url:entry.primary_source,content_note:entry.content_note,
      constraints:{cost:entry.confirmed_admission_cost,currency:entry.confirmed_admission_cost==null?null:'USD',duration_minutes:null,distance_km:null,step_free:entry.confirmed_step_free},
      availability:{status:'unknown',until:null}};
  })};
}
