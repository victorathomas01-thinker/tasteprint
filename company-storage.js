import { companyDraft } from './company-core.js';
export const COMPANY_DRAFT_KEY='tasteprint.company-drafts.v1';
export function readCompanyDraft(id) {
  try {const all=JSON.parse(localStorage.getItem(COMPANY_DRAFT_KEY)||'[]');const value=Array.isArray(all)?all.find(item=>item?.id===id):null;return value?companyDraft(value):null;}
  catch{return null;}
}
export function saveCompanyDraft(value){
  const profile=companyDraft(value);
  try{const current=JSON.parse(localStorage.getItem(COMPANY_DRAFT_KEY)||'[]');const all=Array.isArray(current)?current:[];localStorage.setItem(COMPANY_DRAFT_KEY,JSON.stringify([...all.filter(item=>item?.id!==profile.id),profile].slice(-10)));return true;}
  catch{return false;}
}
export function clearCompanyDraft(id){
  try{const current=JSON.parse(localStorage.getItem(COMPANY_DRAFT_KEY)||'[]');localStorage.setItem(COMPANY_DRAFT_KEY,JSON.stringify(Array.isArray(current)?current.filter(item=>item?.id!==id):[]));return true;}
  catch{return false;}
}
