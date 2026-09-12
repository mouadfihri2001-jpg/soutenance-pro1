// Manual, reproducible ingestion. Builds use the committed snapshot, never this network step.
import { writeFile } from 'node:fs/promises';
import { disciplines, documentTypes } from '../content/disciplines.mjs';
const TARGET_PER_SUBJECT=50;
const fields=['halId_s','title_s','authFullName_s','producedDateY_i','docType_s','domain_s','uri_s','fileMain_s','licence_s','doiId_s','journalTitle_s','keyword_s','language_s'];
const clean=value=>String(value??'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const list=value=>Array.isArray(value)?value:[];
export const workIdentity=doc=>[doc.title,...doc.authors].join('|').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/\s+/g,' ').trim();
function sourceUrl(value){try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password&&/^(?:[a-z0-9-]+\.)*(?:hal\.science|archives-ouvertes\.fr|ccsd\.cnrs\.fr)$/.test(url.hostname))return url.href;}catch{}return null;}
export function normalizeHal(doc,discipline,checkedAt){
  const id=doc.halId_s, title=clean(doc.title_s?.[0]),url=sourceUrl(doc.uri_s),file=sourceUrl(doc.fileMain_s);
  const authors=list(doc.authFullName_s).map(clean).filter(Boolean);
  if(!/^[a-z][a-z0-9-]+-\d+$/.test(id||'')||!title||title.length>1200||!authors.length||!url||!file||!Object.hasOwn(documentTypes,doc.docType_s)||!Number.isInteger(doc.producedDateY_i))return null;
  let license='';try{const u=new URL(doc.licence_s);if(u.protocol==='https:'&&!u.username&&!u.password)license=u.href;}catch{}
  return {id,title,authors,year:doc.producedDateY_i,type:doc.docType_s,discipline,domains:list(doc.domain_s),url,file,license,doi:/^10\.\d{4,9}\//.test(doc.doiId_s||'')?doc.doiId_s:'',journal:clean(doc.journalTitle_s),keywords:[...new Set(list(doc.keyword_s).map(clean).filter(Boolean))].slice(0,14),language:'fr',provider:'HAL',checkedAt,verification:'provider-file-metadata'};
}
async function run(){
  const checkedAt=new Date().toISOString().slice(0,10),seen=new Set(),seenWorks=new Set(),seenDois=new Set(),documents=[],queries=[];
  for(const subject of disciplines){
    const q=`language_s:fr AND submitType_s:file AND docType_s:(THESE OR MEM OR ART OR REPORT OR HDR) AND producedDateY_i:[2016 TO ${checkedAt.slice(0,4)}] AND domain_s:"${subject.halCode}"`;
    const url=new URL('https://api.archives-ouvertes.fr/search/');
    for(const [k,v] of Object.entries({q,rows:'250',fl:fields.join(','),sort:'producedDateY_i desc,docid asc',wt:'json'}))url.searchParams.set(k,v);
    const response=await fetch(url,{signal:AbortSignal.timeout(45000),headers:{'User-Agent':'SoutenancePro-Library/1.0 (+https://soutenancepro.com/methode-editoriale)'}});
    if(!response.ok)throw new Error(`HAL ${response.status}: import stopped; committed snapshot unchanged.`);
    const payload=await response.json();let count=0;
    for(const raw of payload.response?.docs||[]){const doc=normalizeHal(raw,subject.id,checkedAt);if(!doc||seen.has(doc.id)||seenWorks.has(workIdentity(doc))||doc.doi&&seenDois.has(doc.doi.toLowerCase()))continue;seen.add(doc.id);seenWorks.add(workIdentity(doc));if(doc.doi)seenDois.add(doc.doi.toLowerCase());documents.push(doc);if(++count===TARGET_PER_SUBJECT)break;}
    if(count!==TARGET_PER_SUBJECT)throw new Error(`${subject.id}: only ${count} usable records; snapshot not written.`);
    queries.push({discipline:subject.id,url:url.href,available:payload.response.numFound,selected:count});
    console.log(`${subject.label}: ${count} notices avec fichier déclaré par HAL`);
  }
  documents.sort((a,b)=>b.year-a.year||a.id.localeCompare(b.id));
  const snapshot={version:1,checkedAt,provider:'HAL',licensePolicy:'Factual bibliographic metadata and outbound links only. Document files and abstracts are not copied. Consult each deposit for its licence.',verification:'The HAL API declares a full-text file for every record. Automated metadata checks do not constitute peer review or a check of every PDF.',count:documents.length,queries,documents};
  await writeFile('content/documents.json',JSON.stringify(snapshot,null,2)+'\n');
  console.log(`Saved ${documents.length} distinct document records.`);
}
if(process.argv[1]?.endsWith('/import-hal.mjs'))await run();
