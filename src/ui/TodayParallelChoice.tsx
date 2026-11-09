import {useEffect,useRef} from 'react'
import {isoDate} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import {todayReadingGroups,todayThread,type TodayThreadView} from './today-thread.ts'
import {makeSharedAction} from './shared-action.ts'

type Source=Pick<GamePanelProps,'view'|'features'>
export interface TodayParallelReading{readonly key:string;readonly nextDate:string}
const signature=(today:TodayThreadView)=>JSON.stringify(today.ongoing.map(item=>[item.focus,item.classification,item.wait?.date??null]))
/** Public expected dates explain the comparison; the original clock still owns
 * all fees, earlier barriers and event order. No new task is selected here. */
export function todayParallelReading(p:Source,today:TodayThreadView):TodayParallelReading|null{
 const {view,features:f}=p,w=f.workbench,s=today.source,focus=today.primary.thread.focus
 if(view.phase!=='playing'||f.life.asOf!==view.date||s.runId!==view.runId||s.revision!==view.revision||s.date!==view.date||s.quarter!==w.quarter||focus.runId!==view.runId||today.responsibilityOverrideNeeded||w.pause||w.atQuarterEnd)return null
 const current=todayThread(p,focus,today.primary.thread.focusQuarter)
 if(!current||current.responsibilityOverrideNeeded||signature(current)!==signature(today))return null
 const rows=todayReadingGroups(current.ongoing).continuing.filter(item=>item.wait!==null&&item.wait!==undefined&&item.wait.date>view.date)
 if(!rows.length||new Set(rows.map(item=>JSON.stringify(item.focus))).size!==rows.length)return null
 for(const item of rows){
  if(item.focus.runId!==view.runId||!view.accounts.some(account=>account.accountId===item.focus.accountId))return null
  try{if(isoDate(item.wait!.date)!==item.wait!.date)return null}catch{return null}
 }
 const nextDate=rows.map(item=>item.wait!.date).sort()[0]!
 return {key:JSON.stringify([view.runId,view.revision,view.date,w.quarter,signature(current)]),nextDate}
}
type Props={p:GamePanelProps;today:TodayThreadView;onOpen:()=>void}
type Owner={key:string;view:GamePanelProps['view'];features:GamePanelProps['features'];controller:GamePanelProps['controller'];session:string|undefined;open:Props['onOpen']}
export function TodayParallelChoice({p,today,onOpen}:Props){
 const value=todayParallelReading(p,today),owner=useRef<Owner|null>(null),live=useRef(true),key=value?.key??'unavailable'
 if(!owner.current||owner.current.key!==key||owner.current.view!==p.view||owner.current.features!==p.features||owner.current.controller!==p.controller||owner.current.session!==p.controller.runtimeSession||owner.current.open!==onOpen)owner.current={key,view:p.view,features:p.features,controller:p.controller,session:p.controller.runtimeSession,open:onOpen}
 const source=owner.current,ready=()=>!p.view.busy&&!p.controller.snapshot.busy&&!p.view.hasCandidate&&!['unsaved','saving','conflict'].includes(p.view.saveStatus)
 const current=()=>ready()&&live.current&&owner.current===source&&p.controller.runtimeSession===source.session&&todayParallelReading(p,today)?.key===key
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 if(!value)return null
 const action=makeSharedAction(p,'等候时，看看工作与生活',onOpen,{allowReadOnly:true,disabled:!ready(),reason:'这一步仍需先核对当前状态。',canActivate:current})
 return <button type="button" className="scene-text-action" aria-label={action.label+' ↗'} disabled={action.disabled} onClick={action.activate}>等候时，看看工作与生活 ↗</button>
}
