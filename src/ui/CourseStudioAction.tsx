import {useEffect,useRef,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {CourseChoiceIntent} from './CourseSceneChoice.tsx'
import type {CourseStudioReading} from './course-studio-reading.ts'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'

export function CourseStudioAction({p,thread,reading,onChoose,children}:{p:GamePanelProps;thread:PlayerThreadView;reading:CourseStudioReading;onChoose:(intent?:CourseChoiceIntent)=>void;children:(primary:{binding:SharedActionBinding;main:ReactNode})=>ReactNode}){
 const scope=useRef<{key:string;owner:GamePanelProps['controller'];view:GamePanelProps['view'];session:string|undefined;choose:typeof onChoose}|null>(null),live=useRef(true),key=JSON.stringify([thread.focus,reading])
 if(!scope.current||scope.current.key!==key||scope.current.owner!==p.controller||scope.current.view!==p.view||scope.current.session!==p.controller.runtimeSession||scope.current.choose!==onChoose)scope.current={key,owner:p.controller,view:p.view,session:p.controller.runtimeSession,choose:onChoose}
 const source=scope.current
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const binding=makeSharedAction(p,reading.label,()=>{if(reading.choice)onChoose(reading.choice)},{allowReadOnly:true,canActivate:()=>live.current&&scope.current===source&&reading.choice!==null})
 return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{reading.label}<small>{reading.caption}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})
}
