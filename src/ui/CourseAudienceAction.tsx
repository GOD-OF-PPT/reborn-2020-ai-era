import {useEffect,useRef,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {CourseChoiceIntent} from './CourseSceneChoice.tsx'
import type {courseAudienceNext} from './course-audience-reading.ts'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import './course-audience-action.css'

type Reading=NonNullable<ReturnType<typeof courseAudienceNext>>
/** A real choice about this audience; opening a plan or Today never submits a command. */
export function CourseAudienceAction({p,thread,reading,onChoose,onToday,children}:{p:GamePanelProps;thread:PlayerThreadView;reading:Reading;onChoose:(intent?:CourseChoiceIntent)=>void;onToday:()=>void;children:(primary:{binding:SharedActionBinding;main:ReactNode;continuation:ReactNode})=>ReactNode}){
 const live=useRef(true),owner=useRef<{key:string;controller:GamePanelProps['controller'];view:GamePanelProps['view'];session:string|undefined;choose:typeof onChoose;today:typeof onToday}|null>(null),key=JSON.stringify([thread.focus,reading])
 if(!owner.current||owner.current.key!==key||owner.current.controller!==p.controller||owner.current.view!==p.view||owner.current.session!==p.controller.runtimeSession||owner.current.choose!==onChoose||owner.current.today!==onToday)owner.current={key,controller:p.controller,view:p.view,session:p.controller.runtimeSession,choose:onChoose,today:onToday}
 const source=owner.current,options={allowReadOnly:true,canActivate:()=>live.current&&owner.current===source}
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const binding=makeSharedAction(p,reading.label,()=>onChoose(reading.intent),options),leave=makeSharedAction(p,'今天先做别的',onToday,options)
 return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{reading.label}<small>{reading.caption}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>,continuation:<button type="button" className="course-audience-leave" disabled={leave.disabled} onClick={leave.activate}>{leave.label} ↗</button>})
}
