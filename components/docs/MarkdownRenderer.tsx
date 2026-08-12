import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import {MermaidDiagram} from './MermaidDiagram';
export function MarkdownRenderer({content}:{content:string}){return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug,[rehypeAutolinkHeadings,{behavior:'wrap'}]]} components={{code({className,children,...props}){const lang=/language-([^\s]+)/.exec(className||'')?.[1],src=String(children).replace(/\n$/,'');return lang==='mermaid'?<MermaidDiagram chart={src}/>:<code className={className}{...props}>{children}</code>},table({children}){return <div className="docsTableWrap"><table>{children}</table></div>},a({href,children,...props}){const external=href?.startsWith('http');return <a href={href}{...props}{...(external?{target:'_blank',rel:'noreferrer noopener'}:{})}>{children}</a>}}}>{content}</ReactMarkdown>}
