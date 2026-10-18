import type { Ref } from 'react'
import {RoomBackdrop} from './RoomBackdrop.tsx'
import {RouteMark} from './RouteMark.tsx'
export const screens=[['quarter','本季工作台'],['life','生活与人物'],['market','模拟市场'],['video','视频工作室'],['course','课程与学员'],['relay','API中转站'],['routines','例行计划'],['story','变化与处置'],['deepseek','DeepSeek机会'],['routes','五条路线'],['memory','记忆与新闻'],['finance','账本与存档']] as const
export type Screen=typeof screens[number][0]
const businessScreens:readonly Screen[]=['routes','market','video','course','relay','deepseek']
export function groupOf(screen:Screen){return businessScreens.includes(screen)?'business':['life','routines','story'].includes(screen)?'quarter':screen}
export function MainNavigation({screen,onNavigate}:{screen:Screen;onNavigate:(screen:Screen)=>void}){
 const group=groupOf(screen)
 return <nav className="main-navigation" aria-label="主要导航">{([['quarter','本季','quarter'],['business','经营','routes'],['memory','记忆','memory'],['finance','账本','finance']] as const).map(([id,label,target])=><button type="button" key={id} aria-current={group===id?'page':undefined} onClick={()=>onNavigate(target)}><RouteMark kind={id}/>{label}</button>)}</nav>
}
export function SectionNavigation({screen,onNavigate}:{screen:Screen;onNavigate:(screen:Screen)=>void}){
 const group=groupOf(screen),list=group==='business'?businessScreens:group==='quarter'?['quarter','life','routines','story'] as const:[]
 return list.length?<nav className="section-navigation" aria-label={group==='business'?'经营工作台':'本季页面'}>{list.map(id=><button type="button" key={id} aria-current={screen===id?'page':undefined} onClick={()=>onNavigate(id)}>{screens.find(s=>s[0]===id)![1]}</button>)}</nav>:null
}
const pageCopy:Record<Screen,string>={quarter:'重新安排你的时间',life:'把时间留给生活，也留给人',story:'改变过什么，又要守住什么',routes:'机会很多，不必每次都参加',market:'给判断一个仓位，也给生活留余地',video:'让作品遇见真实的需求',course:'承诺一些能够交付的改变',relay:'把服务做好，把成本算清',routines:'让确认过的事，有序发生',deepseek:'技术机会，也有不同的参与方式',memory:'记得趋势，不是答案',finance:'知道钱在哪里，也知道还欠什么'}
export function PageHeading({screen,quarter,background,wish,headingRef,workspaceCompleted=false,textOnly=false}:{screen:Screen;quarter:string;background:string;wish:string;headingRef:Ref<HTMLHeadingElement>;workspaceCompleted?:boolean;textOnly?:boolean}){return <header className={'chapter-banner chapter-room'+(screen==='life'?' chapter-life':'')} data-visual={screen}>{!textOnly?<RoomBackdrop improved={workspaceCompleted}/>:null}<div><p className="eyebrow">{quarter} / {screens.find(s=>s[0]===screen)![1]}</p><h1 ref={headingRef} tabIndex={-1}>{pageCopy[screen]}</h1><p className="chapter-context">{background} · {wish}</p></div><p className="chapter-quote">眼前的生活，<br/>可以重新选择。</p>{!textOnly?<span className="chapter-art-mark"><RouteMark kind={screen}/></span>:null}</header>}

const routeScreens:Record<string,Screen>={a_share:'market',ai_video:'video',ai_course:'course',api_relay:'relay',deepseek_opportunity:'deepseek'}
export function screenForRoute(id:string):Screen{return routeScreens[id]??'routes'}
