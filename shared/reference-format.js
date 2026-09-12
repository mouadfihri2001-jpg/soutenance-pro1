const line=value=>String(value??'').replace(/[\r\n\u0000-\u001f]+/g,' ').trim();
const tex=value=>line(value).replace(/[\\{}%&#_$]/g,char=>({'\\':'\\textbackslash{}','{':'\\{','}':'\\}','%':'\\%','&':'\\&','#':'\\#','_':'\\_','$':'\\$'}[char]));
export function referenceText(item){
  return [item.authors?.map(line).join(', '),item.year?`(${line(item.year)})`:null,line(item.title),line(item.journal),line(item.doi?`https://doi.org/${item.doi}`:item.url)].filter(Boolean).join('. ');
}
export function referenceRIS(item){
  const type=item.type==='ART'?'JOUR':['THESE','MEM','HDR'].includes(item.type)?'THES':item.type==='REPORT'?'RPRT':'GEN';
  return [`TY  - ${type}`,`TI  - ${line(item.title)}`,...(item.authors||[]).map(name=>'AU  - '+line(name)),...(item.year?['PY  - '+line(item.year)]:[]),...(item.journal?['JO  - '+line(item.journal)]:[]),...(item.doi?['DO  - '+line(item.doi)]:[]),'UR  - '+line(item.url),'ER  -',''].join('\n');
}
export function referenceBib(item){
  const type=item.type==='ART'?'article':item.type==='THESE'?'phdthesis':item.type==='MEM'?'mastersthesis':item.type==='REPORT'?'techreport':'misc';
  const key=line(item.id||'reference').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,100)||'reference';
  const fields={title:item.title,author:(item.authors||[]).join(' and '),year:item.year,journal:item.journal,doi:item.doi,url:item.url};
  return `@${type}{${key},\n${Object.entries(fields).filter(([,v])=>v).map(([k,v])=>`  ${k} = {${tex(v)}}`).join(',\n')}\n}\n`;
}
