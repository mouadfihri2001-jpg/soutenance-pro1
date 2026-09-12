import { lexer, parse } from 'marked';
import DOMPurify from 'dompurify';
import { normalizeDocumentContent } from '../shared/document-format.js';

const plain = text => String(text || '').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/[*_`]/g,'').replace(/<[^>]*>/g,'');
const filename = title => (title || 'Soutenance-Pro').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,90) || 'Soutenance-Pro';
const escape = text => String(text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

export async function createWord(document,project) {
  const {Document,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell,WidthType,Footer,PageNumber}=await import('docx');
  const rtl=project.profile?.language==='Arabe';
  const p=(text,options={})=>new Paragraph({bidirectional:rtl,widowControl:true,spacing:{after:160,line:360},children:[new TextRun({text:plain(text),rightToLeft:rtl})],...options});
  const children=[p(document.title,{heading:HeadingLevel.TITLE}),p(project.title),p([project.profile?.name,project.profile?.university,project.profile?.level].filter(Boolean).join(' · ')),p('')];
  for(const token of lexer(normalizeDocumentContent(document.content,document.module))){
    if(token.type==='space')continue;
    if(token.type==='heading')children.push(p(token.text,{heading:HeadingLevel[`HEADING_${Math.min(token.depth,6)}`],keepNext:true,keepLines:true,spacing:{before:token.depth<=2?320:220,after:140,line:300}}));
    else if(token.type==='list')token.items.forEach((item,index)=>children.push(p(`${token.ordered?`${Number(token.start||1)+index}.`:'•'} ${item.text}`,{indent:{start:360,hanging:240},spacing:{after:100,line:360}})));
    else if(token.type==='table')children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[token.header,...token.rows].map((row,index)=>new TableRow({children:row.map(cell=>new TableCell({children:[p(cell.text,{spacing:{after:80},...(index===0?{heading:HeadingLevel.HEADING_3}:{})})]}))}))}));
    else children.push(p(token.text||token.raw));
  }
  const headingStyle=size=>({run:{font:'Times New Roman',size,bold:true,color:'172C23'},paragraph:{keepNext:true,keepLines:true}});
  return new Document({creator:'Soutenance Pro',title:document.title,styles:{default:{document:{run:{font:'Times New Roman',size:24}},title:headingStyle(40),heading1:headingStyle(32),heading2:headingStyle(28),heading3:headingStyle(25),heading4:headingStyle(24),heading5:headingStyle(24),heading6:headingStyle(24)}},sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1440,right:1440,bottom:1440,left:1440}}},children,
    footers:{default:new Footer({children:[new Paragraph({alignment:'center',children:[new TextRun({children:[PageNumber.CURRENT]})]})]})}
  }]});
}
function chunks(text,size=165){
  const words=plain(text).split(/\s+/),result=[];let current='';
  for(const word of words){if(current.length+word.length>size&&current){result.push(current);current='';}current+=(current?' ':'')+word;}
  if(current)result.push(current);return result;
}
export function presentationSections(content) {
  const tokens=lexer(content),sections=[];let current={title:'Présentation',points:[],notes:[]};
  const headingDepth=tokens.some(t=>t.type==='heading'&&t.depth===1)?1:2;
  for(const token of tokens){
    if(token.type==='heading'&&token.depth<=headingDepth){if(current.points.length||current.notes.length)sections.push(current);current={title:plain(token.text),points:[],notes:[]};}
    else if(token.type==='paragraph'&&/^\**notes?\s+orales?/i.test(token.text))current.notes.push(plain(token.text));
    else if(token.type==='list')token.items.forEach(item=>current.points.push(...chunks(item.text)));
    else if(token.type!=='space'&&(token.text||token.raw))current.points.push(...chunks(token.text||token.raw));
  }
  if(current.points.length||current.notes.length)sections.push(current);
  return sections.flatMap(section=>{
    const pages=[];for(let i=0;i<Math.max(section.points.length,1);i+=4)pages.push({title:section.title+(i?' — suite':''),points:section.points.slice(i,i+4),notes:section.notes});return pages;
  });
}
export async function createPowerPoint(document,project) {
  const {default:PptxGenJS}=await import('pptxgenjs');
  const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author=project.profile?.name||'Soutenance Pro';pptx.subject=project.title;pptx.title=document.title;pptx.lang=project.profile?.language==='Arabe'?'ar-MA':'fr-FR';
  const cover=pptx.addSlide();cover.background={color:'004D35'};
  cover.addText('SOUTENANCE PRO',{x:.7,y:.6,w:11.8,h:.4,fontFace:'Arial',fontSize:14,color:'B6D3C3',charSpacing:3});
  cover.addText(project.title,{x:.7,y:2,w:11.8,h:2.4,fontFace:'Arial',fontSize:34,bold:true,color:'FFFFFF',breakLine:false,fit:'shrink'});
  cover.addText([project.profile?.name,project.profile?.university,project.profile?.level].filter(Boolean).join('\n'),{x:.7,y:5.3,w:11.8,h:1.25,fontFace:'Arial',fontSize:19,color:'FFFFFF'});
  for(const [index,section] of presentationSections(normalizeDocumentContent(document.content,document.module)).entries()){
    const slide=pptx.addSlide();slide.background={color:'FFFFFF'};
    slide.addText(section.title,{x:.65,y:.65,w:12,h:1.0,fontFace:'Arial',fontSize:28,bold:true,color:'004D35',fit:'shrink'});
    section.points.forEach((point,i)=>slide.addText(point,{x:.85,y:2+i*1.05,w:11.6,h:.92,fontFace:'Arial',fontSize:22,color:'172C23',fit:'shrink',bullet:{indent:18},hanging:4,breakLine:false,rtlMode:project.profile?.language==='Arabe'}));
    slide.addText(`Soutenance Pro  ·  ${index+1}`,{x:.7,y:7.05,w:11.8,h:.2,fontSize:10,color:'63766B'});
    slide.addNotes([...section.notes,...section.points].join('\n'));
  }
  return pptx;
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
export async function exportDocument(type,doc,project){
  if(!doc?.content)throw new Error('Aucun document à exporter.');
  if(type==='word'){const {Packer}=await import('docx');download(await Packer.toBlob(await createWord(doc,project)),`${filename(doc.title)}.docx`);}
  if(type==='ppt'){const ppt=await createPowerPoint(doc,project);await ppt.writeFile({fileName:`${filename(project.title)}.pptx`});}
  if(type==='pdf'){
    const frame=document.createElement('iframe');frame.title='Impression du document';frame.style.cssText='position:fixed;width:1px;height:1px;left:-10000px;border:0';
    const clean=DOMPurify.sanitize(parse(normalizeDocumentContent(doc.content,doc.module)),{USE_PROFILES:{html:true},FORBID_TAGS:['img','iframe','style','form'],FORBID_ATTR:['style']});
    frame.srcdoc=`<!doctype html><html lang="${project.profile?.language==='Arabe'?'ar':'fr'}" dir="${project.profile?.language==='Arabe'?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${escape(doc.title)}</title><style>@page{size:A4;margin:22mm}body{font:12pt/1.6 'Times New Roman',serif;color:#111}h1{font-size:23pt}h2{font-size:17pt}h3{font-size:14pt}h4,h5,h6{font-size:12pt}h1,h2,h3,h4,h5,h6{line-height:1.35;margin:1.5em 0 .6em;break-after:avoid;break-inside:avoid}p,li{orphans:3;widows:3}p{margin:0 0 .8em}ul,ol{padding-inline-start:1.5em}li{margin:.35em 0}table{width:100%;border-collapse:collapse;margin:1em 0}thead{display:table-header-group}tr{break-inside:avoid}td,th{border:1px solid #aaa;padding:6px}pre{white-space:pre-wrap}img{max-width:100%}a{overflow-wrap:anywhere}</style></head><body><h1>${escape(doc.title)}</h1><p>${escape(project.title)}<br>${escape(project.profile?.name)} · ${escape(project.profile?.university)}</p><hr>${clean}</body></html>`;
    const loaded=new Promise(resolve=>{frame.onload=resolve;});document.body.appendChild(frame);await loaded;await frame.contentDocument.fonts.ready;
    frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.focus();frame.contentWindow.print();
  }
}
