import {useEffect,useRef,type Ref,type ReactNode,type KeyboardEventHandler} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {obligationSceneMoment,obligationSceneKey} from './obligation-scene.ts'
import {makeSharedAction} from './shared-action.ts'
import {RoomTableau} from './RoomTableau.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import './route-obligation-moment.css'

export function routeObligationReading(p:GamePanelProps){return p.view.phase==='playing'?obligationSceneMoment(p):null}
type Props={p:GamePanelProps;reading:NonNullable<ReturnType<typeof routeObligationReading>>;sourceName:string;headingRef:Ref<HTMLHeadingElement>;stageRef:Ref<HTMLElement>;onKeyDown:KeyboardEventHandler<HTMLElement>;onNavigate:NavigateScene;onRecord:()=>void;feedback?:ReactNode}
type Owner={key:string;sourceName:string;view:GamePanelProps['view'];features:GamePanelProps['features'];controller:GamePanelProps['controller'];session:string|undefined;navigate:NavigateScene;record:()=>void}
/** A temporary scene, without changing the route, its original target or any command. */
export function RouteObligationMoment({p,reading,sourceName,headingRef,stageRef,onKeyDown,onNavigate,onRecord,feedback}:Props){
 const live=useRef(true),owner=useRef<Owner|null>(null),key=obligationSceneKey(reading.target)
 if(!owner.current||owner.current.key!==key||owner.current.sourceName!==sourceName||owner.current.view!==p.view||owner.current.features!==p.features||owner.current.controller!==p.controller||owner.current.session!==p.controller.runtimeSession||owner.current.navigate!==onNavigate||owner.current.record!==onRecord)owner.current={key,sourceName,view:p.view,features:p.features,controller:p.controller,session:p.controller.runtimeSession,navigate:onNavigate,record:onRecord}
 const source=owner.current,current=()=>{const actual=routeObligationReading(p);return live.current&&owner.current===source&&actual!==null&&obligationSceneKey(actual.target)===key}
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const primary=makeSharedAction(p,reading.label,()=>onNavigate('quarter',{obligationTarget:reading.target}),{allowReadOnly:true,canActivate:current}),record=makeSharedAction(p,'翻看'+sourceName, onRecord,{allowReadOnly:true,canActivate:current})
 const protectedView=p.view.readOnly||p.view.hasCandidate||p.view.saveStatus!=='saved',payment=reading.target.kind==='payment'
 return <section ref={stageRef} className="ecosystem-stage route-obligation-stage opening-room" aria-label="这条路上需要先回应的事" onKeyDown={onKeyDown}><RoomTableau scene="attention" state="attention" perspective="current" textOnly={p.textOnly===true}
  intention={<p className="opening-room-intention">暂放 · {sourceName}</p>}
  heading={<header className="moment-heading"><p>{payment?'一笔到期的原款':'原款处理后的停点'}</p><h1 ref={headingRef} tabIndex={-1}>{reading.title}</h1></header>}
  context={<><p className="moment-stage-label">今天 {p.view.date}</p><p>{reading.line}</p></>}
  feedback={feedback} facts={<p>{reading.detail}</p>}
  decisions={<button type="button" className="moment-decision moment-primary route-obligation-primary" disabled={primary.disabled} onClick={primary.activate}><b aria-hidden="true">01</b><span>{primary.label}</span><i aria-hidden="true">→</i></button>}
  object={<OpeningObject copyMode="tableau" kind="letter" title={payment?'到期原款':'原现金停点'} detail="" stageLabel={payment?'到期未付':'停点待确认'} actionLabel={primary.label} onActivate={primary.activate} disabled={primary.disabled} textOnly={p.textOnly===true} {...(p.view.readOnly?{protection:'readonly' as const}:protectedView?{protection:'unsaved' as const}:primary.disabled?{protection:'unavailable' as const}:{})}/>}
  record={<><button type="button" className="scene-text-action" disabled={record.disabled} onClick={record.activate}>{sourceName} ↗</button>{primary.reason&&!protectedView?<p className="reason">{primary.reason}</p>:null}</>}/></section>
}
