import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {playerThread,type PlayerThreadView} from './player-thread.ts'
import type {CourseChoiceIntent} from './CourseSceneChoice.tsx'
import type {CourseEntryReading} from './course-entry-reading.ts'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import {ClockAdvance} from './ClockAdvance.tsx'
import {openingAttempt} from './opening-attempt.ts'
import {OpeningAttemptChoices} from './OpeningAttemptChoices.tsx'

export interface CourseEntryExtras{readonly reading:CourseEntryReading;readonly details:SharedActionBinding;readonly today:SharedActionBinding;readonly clock:ReactNode}
type Scope={key:string;owner:GamePanelProps['controller'];view:GamePanelProps['view'];session:string|undefined;choose:(intent?:CourseChoiceIntent)=>void;today:()=>void;navigate:NavigateScene}
export function CourseEntryAction({p,thread,reading,date,waitLabel,onChoose,onToday,onNavigate,children}:{p:GamePanelProps;thread:PlayerThreadView;reading:CourseEntryReading;date:string|null;waitLabel:string;onChoose:(intent?:CourseChoiceIntent)=>void;onToday:()=>void;onNavigate:NavigateScene;children:(primary:{binding:SharedActionBinding;main:ReactNode;courseEntry:CourseEntryExtras})=>ReactNode}){
 const current=useRef<Scope|null>(null),live=useRef(true),[offerSource,setOfferSource]=useState<Scope|null>(null),key=JSON.stringify([thread.focus,reading])
 if(!current.current||current.current.key!==key||current.current.owner!==p.controller||current.current.view!==p.view||current.current.session!==p.controller.runtimeSession||current.current.choose!==onChoose||current.current.today!==onToday||current.current.navigate!==onNavigate)current.current={key,owner:p.controller,view:p.view,session:p.controller.runtimeSession,choose:onChoose,today:onToday,navigate:onNavigate}
 const source=current.current,first=p.features.firstOrder
 const attempt=reading.route==='first-order'&&first.status==='available'?openingAttempt(p,{kind:'first-order',runId:p.view.runId,accountId:'personal',entityId:first.offerId}):null
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const bind=(label:string,act:()=>void)=>makeSharedAction(p,label,act,{allowReadOnly:true,canActivate:()=>live.current&&current.current===source})
 const binding=bind(reading.label,()=>{if(reading.route==='today')onToday();else if(reading.route==='first-order'&&attempt?.action.kind==='offer-reply')setOfferSource(source);else onNavigate(reading.route==='first-order'?'quarter':'video',{accountId:'personal',...(reading.route==='first-order'&&first.contractId?{recordId:first.contractId}:{})})}),details=bind('课程的准备条件',()=>onChoose('objects')),today=bind('先回到今天，安排生活',onToday)
 const clock=date?<ClockAdvance p={p} date={date} label={waitLabel+' · '+date} room showReason={!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'}/>:null
 return <>{children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{binding.label}<small>{reading.caption}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>,courseEntry:{reading,details,today,clock}})}{offerSource===source&&attempt?.action.kind==='offer-reply'?<OpeningAttemptChoices p={p} attempt={attempt} panel="offer" onClose={()=>setOfferSource(null)} onInspect={()=>onNavigate('quarter',{accountId:'personal',recordId:first.offerId})} onMarket={()=>onNavigate('market',{accountId:'personal'})} onExplore={()=>onNavigate('room')} onFocus={focus=>{const next=playerThread(p,focus);onNavigate(next.inspect.screen,next.inspect.target)}} onNavigate={onNavigate}/>:null}</>
}
