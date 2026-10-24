import type { GamePanelProps } from './game-types.ts'
import type {ReactNode,Ref} from 'react'
import { reasonText } from './game-text.ts'
import {journeyIntent} from './journey-intent.ts'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
export function CommandButton({controller,view,request,kind,payload,label,confirm=false,primary=false,children,className='',showReason=true,reasonText:displayReason=reasonText,renderAction,rootRef}:{controller:GamePanelProps['controller'];view:GamePanelProps['view'];request:GamePanelProps['request'];kind:string;payload:unknown;label:string;confirm?:boolean;primary?:boolean;children?:ReactNode;className?:string;showReason?:boolean;reasonText?:(code:string)=>string;renderAction?:((binding:SharedActionBinding,defaultNode:ReactNode)=>ReactNode)|undefined;rootRef?:Ref<HTMLDivElement>|undefined}){
 const intent=journeyIntent(view,kind,payload,label,confirm),command={runId:view.runId,actorId:'player',commandId:'display-preview',expectedRevision:view.revision,kind:intent.kind,payload:intent.payload},preview=controller.preview(command)
 const disabled=!preview.allowed||view.busy||view.hasCandidate||view.readOnly||view.saveStatus==='conflict'
 const binding=makeSharedAction({controller,view},intent.label,()=>request(intent.kind,intent.payload,intent.label,intent.confirm),{disabled,reason:preview.reasonCodes[0]?displayReason(preview.reasonCodes[0]):null,canActivate:()=>controller.preview(command).allowed})
 const node=<div ref={rootRef} className={'command '+className}><button type="button" className={primary?'primary':''} aria-label={children?intent.label:undefined} disabled={binding.disabled} onClick={binding.activate}>{children??intent.label}</button>{showReason&&!preview.allowed&&preview.reasonCodes[0]?<small className="reason">{displayReason(preview.reasonCodes[0])}</small>:null}</div>
 return renderAction?renderAction(binding,node):node
}
