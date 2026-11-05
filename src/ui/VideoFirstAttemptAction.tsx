import {useEffect,useRef,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {VideoOpeningFocus} from './video-player-thread.ts'
import type {VideoChoiceAction} from './VideoSceneChoice.tsx'
import type {VideoFirstAttemptReading} from './video-first-attempt.ts'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import {moneyText} from './game-text.ts'

export interface VideoFirstAttemptExtras{readonly reading:VideoFirstAttemptReading;readonly marketing:SharedActionBinding;readonly overview:SharedActionBinding}
type Scope={key:string;owner:GamePanelProps['controller'];view:GamePanelProps['view'];session:string|undefined;choose:(intent?:VideoChoiceAction)=>void}
export function VideoFirstAttemptAction({p,focus,reading,onChoose,children}:{p:GamePanelProps;focus:VideoOpeningFocus;reading:VideoFirstAttemptReading;onChoose:(intent?:VideoChoiceAction)=>void;children:(primary:{binding:SharedActionBinding;main:ReactNode;firstAttempt:VideoFirstAttemptExtras})=>ReactNode}){
 const scope=useRef<Scope|null>(null),live=useRef(true),key=JSON.stringify(focus)
 if(!scope.current||scope.current.key!==key||scope.current.owner!==p.controller||scope.current.view!==p.view||scope.current.session!==p.controller.runtimeSession||scope.current.choose!==onChoose)scope.current={key,owner:p.controller,view:p.view,session:p.controller.runtimeSession,choose:onChoose}
 const source=scope.current
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const bind=(label:string,intent?:VideoChoiceAction)=>makeSharedAction(p,label,()=>onChoose(intent),{allowReadOnly:true,canActivate:()=>live.current&&scope.current===source})
 const binding=bind('准备第一份样片','sample'),marketing=bind('先了解一群观众','marketing'),overview=bind('翻看账号与全部选择')
 const sample=reading.sample
 return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{binding.label}<small>手工热点参考{moneyText(sample.costFen)} · {sample.points}点 · {sample.days}日；具体投入随后核对。</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>,firstAttempt:{reading,marketing,overview}})
}
