import type{ReactNode}from 'react';import{DocsSearch}from '@/components/docs/DocsSearch';import{DocsSidebar}from '@/components/docs/DocsSidebar';import{getTree}from '@/lib/docs';import'./portal.css';
export const dynamic='force-dynamic';
export default function DocsLayout({children}:{children:ReactNode}){return <div className="docsPortal"><DocsSidebar tree={getTree()}/><div className="docsMain"><header className="docsTopbar"><DocsSearch/><a href="/" className="docsBack">WonderCards ↗</a></header>{children}</div></div>}
