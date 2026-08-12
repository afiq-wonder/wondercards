import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type DocHeading={id:string;text:string;level:number};
export type Doc={slug:string[];href:string;relativePath:string;section:string;title:string;description:string;status?:string;order:number;tags:string[];updatedAt:string;content:string;headings:DocHeading[]};
export type NavNode={name:string;label:string;type:'folder'|'document';href?:string;order:number;children:NavNode[]};
export type SearchResult={href:string;title:string;section:string;excerpt:string;score:number};

const ROOT=path.join(process.cwd(),'docs');
const EXT=new Set(['.md','.mdx']);
const SECTION_ORDER:Record<string,number>={architecture:10,adr:20,standards:30,specs:40,blueprints:50,roadmap:60,platform:70,brand:80};
const SECTION_LABELS:Record<string,string>={architecture:'Architecture',adr:'Architecture Decisions',standards:'Engineering Standards',specs:'Platform Specifications',blueprints:'Architecture Blueprints',roadmap:'Roadmap',platform:'Platform',brand:'Brand'};

const humanise=(v:string)=>v.replace(/\.(md|mdx)$/i,'').replace(/^[0-9]+[-_. ]*/,'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const segment=(v:string)=>v.replace(/\.(md|mdx)$/i,'').replace(/^[0-9]+[-_. ]*/,'').replace(/[_\s]+/g,'-').replace(/[^a-zA-Z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase();
const headingId=(v:string)=>v.toLowerCase().replace(/[`*_~]/g,'').replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
const plain=(v:string)=>v.replace(/```[\s\S]*?```/g,' ').replace(/<[^>]+>/g,' ').replace(/[#>*_`\[\]()|~-]/g,' ').replace(/\s+/g,' ').trim();

function walk(dir:string):string[]{
  if(!fs.existsSync(dir)) throw new Error(`Missing docs directory: ${dir}`);
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
    const abs=path.join(dir,e.name);
    if(e.name.startsWith('.')) return [];
    if(e.isDirectory()) return walk(abs);
    return EXT.has(path.extname(e.name).toLowerCase())?[abs]:[];
  });
}

function record(filePath:string):Doc{
  const relativePath=path.relative(ROOT,filePath).replaceAll('\\','/');
  const parsed=path.parse(relativePath);
  const dirs=parsed.dir?parsed.dir.split('/'):[];
  const slug=[...dirs.map(segment),...(/^index$/i.test(parsed.name)?[]:[segment(parsed.name)])].filter(Boolean);
  const raw=fs.readFileSync(filePath,'utf8');
  const {data,content}=matter(raw);
  const first=slug[0]||'overview';
  const title=typeof data.title==='string'?data.title:(content.match(/^#\s+(.+)$/m)?.[1]?.trim()||humanise(parsed.name));
  const description=typeof data.description==='string'?data.description:plain(content.replace(/^#{1,6}\s+.+$/gm,'')).slice(0,180);
  const headings=Array.from(content.matchAll(/^(#{2,4})\s+(.+)$/gm)).map(m=>({level:m[1].length,text:m[2].replace(/[*_`]/g,'').trim(),id:headingId(m[2])}));
  const tags=Array.isArray(data.tags)?data.tags.map(String):typeof data.tags==='string'?data.tags.split(',').map((x:string)=>x.trim()).filter(Boolean):[];
  return {slug,href:slug.length?`/docs/${slug.join('/')}`:'/docs',relativePath,section:SECTION_LABELS[first]||humanise(first),title,description,status:typeof data.status==='string'?data.status:undefined,order:Number.isFinite(Number(data.order))?Number(data.order):100,tags,updatedAt:typeof data.updatedAt==='string'?data.updatedAt:fs.statSync(filePath).mtime.toISOString(),content,headings};
}

export function getAllDocs():Doc[]{
  return walk(ROOT).map(record).sort((a,b)=>((SECTION_ORDER[a.slug[0]||'overview']??999)-(SECTION_ORDER[b.slug[0]||'overview']??999))||a.order-b.order||a.title.localeCompare(b.title));
}
export function getDoc(slug:string[]=[]){const key=slug.map(segment).filter(Boolean).join('/');return getAllDocs().find(d=>d.slug.join('/')===key)}
export function getAdjacent(doc:Doc){const all=getAllDocs();const i=all.findIndex(d=>d.href===doc.href);return{previous:i>0?all[i-1]:undefined,next:i>=0&&i<all.length-1?all[i+1]:undefined}}

export function getTree():NavNode[]{
  const root:NavNode[]=[];
  for(const doc of getAllDocs()){
    const parts=doc.slug.length?doc.slug:['overview'];let level=root;
    parts.forEach((part,i)=>{const isDoc=i===parts.length-1;let node=level.find(n=>n.name===part&&n.type===(isDoc?'document':'folder'));
      if(!node){node={name:part,label:isDoc?doc.title:(SECTION_LABELS[part]||humanise(part)),type:isDoc?'document':'folder',href:isDoc?doc.href:undefined,order:i===0?(SECTION_ORDER[part]??999):doc.order,children:[]};level.push(node)}
      level=node.children;
    });
  }
  const sort=(nodes:NavNode[]):NavNode[]=>nodes.sort((a,b)=>a.order-b.order||Number(a.type==='document')-Number(b.type==='document')||a.label.localeCompare(b.label)).map(n=>({...n,children:sort(n.children)}));
  return sort(root);
}

export function searchDocs(query:string,limit=12):SearchResult[]{
  const terms=query.toLowerCase().trim().split(/\s+/).filter(t=>t.length>=2);if(!terms.length)return[];
  return getAllDocs().map(doc=>{const title=doc.title.toLowerCase(),heads=doc.headings.map(h=>h.text).join(' ').toLowerCase(),body=plain(doc.content).toLowerCase(),tags=doc.tags.join(' ').toLowerCase();const score=terms.reduce((n,t)=>n+(title.includes(t)?12:0)+(tags.includes(t)?8:0)+(heads.includes(t)?6:0)+(body.includes(t)?1:0),0);const q=terms[0],idx=body.indexOf(q),start=Math.max(0,idx<0?0:idx-70);return{href:doc.href,title:doc.title,section:doc.section,excerpt:`${start?'…':''}${body.slice(start,start+220)}${body.length>start+220?'…':''}`,score}}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,limit);
}

export function getDashboard(){const docs=getAllDocs(),pick=(p:string)=>docs.filter(d=>d.slug[0]===p);return{total:docs.length,sections:new Set(docs.map(d=>d.section)).size,adrs:pick('adr'),specs:pick('specs'),standards:pick('standards'),blueprints:pick('blueprints'),roadmap:pick('roadmap')}}
