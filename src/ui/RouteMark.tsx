import type {ReactNode} from 'react'

export type VisualKind='room'|'quarter'|'business'|'memory'|'finance'|'life'|'story'|'routines'|'routes'|'market'|'video'|'course'|'relay'|'deepseek'|'a_share'|'ai_video'|'ai_course'|'api_relay'|'deepseek_opportunity'

/** Decorative marks describe the workspace, never a price, permission or result. */
export function RouteMark({kind}:{kind:VisualKind}){
 let shape:ReactNode
 switch(kind){
  case 'room':shape=<><path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/></>;break
  case 'market':case 'a_share':shape=<><path d="M4 20h16M5 16l5-5 4 3 6-9"/><path d="M15 5h5v5"/></>;break
  case 'video':case 'ai_video':shape=<><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="m10 9 5 3-5 3Z"/><path d="M7 5v3m0 8v3m10-14v3m0 8v3"/></>;break
  case 'course':case 'ai_course':shape=<><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/><path d="M6 9h3m-3 4h3m6-4h3m-3 4h3"/></>;break
  case 'relay':case 'api_relay':shape=<><circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 12h4c4 0 2-7 6-7M11 12c4 0 2 7 6 7"/></>;break
  case 'deepseek':case 'deepseek_opportunity':shape=<><path d="m12 3 8 5v8l-8 5-8-5V8l8-5Zm0 0v8m8-3-8 3-8-3m8 3v10"/><circle cx="12" cy="11" r="2"/></>;break
  case 'life':shape=<><path d="M4 12h16v8H4v-8Zm1 0V9a3 3 0 0 1 6 0v3m2 0V9a3 3 0 0 1 6 0v3"/><path d="M7 4V2m10 2V2M7 20v2m10-2v2"/></>;break
  case 'story':shape=<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/>;break
  case 'memory':shape=<><path d="M6 4h12v16H6zM3 7h3M3 11h3M3 15h3"/><path d="M10 8h5m-5 4h5m-5 4h3"/></>;break
  case 'finance':shape=<><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 7h8M8 11h3m3 0h2m-8 4h3m3 0h2m-8 3h3m3 0h2"/></>;break
  case 'routines':shape=<><path d="M5 8a8 8 0 0 1 13-2l2 2M19 16A8 8 0 0 1 6 18l-2-2M20 3v5h-5M4 21v-5h5"/></>;break
  case 'business':case 'routes':shape=<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17h7m-3.5-3.5v7"/></>;break
  default:shape=<><rect x="4" y="5" width="16" height="16" rx="1"/><path d="M8 3v4m8-4v4M4 10h16m-11 4h2m3 0h2m-7 4h2"/></>
 }
 return <svg className="route-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shape}</svg>
}
