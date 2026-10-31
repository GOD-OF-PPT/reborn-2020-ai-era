import type { GamePanelProps } from './game-types.ts'
import {useCallback,useRef,type ReactNode,type Ref} from 'react'
import {useCommandPreview} from './use-controller-read.ts'
import { reasonText } from './game-text.ts'
import {journeyIntent} from './journey-intent.ts'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
export interface CommandActionContext{readonly command:CommandEnvelope;readonly preview:CommandPreview}
export function CommandButton({controller,view,request,kind,payload,label,confirm=false,primary=false,children,className='',showReason=true,reasonText:displayReason=reasonText,renderAction,rootRef}:{controller:GamePanelProps['controller'];view:GamePanelProps['view'];request:GamePanelProps['request'];kind:string;payload:unknown;label:string;confirm?:boolean;primary?:boolean;children?:ReactNode;className?:string;showReason?:boolean;reasonText?:(code:string)=>string;renderAction?:((binding:SharedActionBinding,defaultNode:ReactNode,context:CommandActionContext)=>ReactNode)|undefined;rootRef?:Ref<HTMLDivElement>|undefined}){
 const localRoot=useRef<HTMLDivElement>(null)
 const attach=useCallback((node:HTMLDivElement|null)=>{localRoot.current=node;if(typeof rootRef==='function')rootRef(node);else if(rootRef)rootRef.current=node},[rootRef])
 const intent=journeyIntent(view,kind,payload,label,confirm),command={runId:view.runId,actorId:'player',commandId:'display-preview',expectedRevision:view.revision,kind:intent.kind,payload:intent.payload}
 const checked=useCommandPreview(controller,view,command,localRoot),preview=checked.preview
 const disabled=!preview.allowed||view.busy||view.hasCandidate||view.readOnly||view.saveStatus==='conflict'
 const binding=makeSharedAction({controller,view},intent.label,()=>request(intent.kind,intent.payload,intent.label,intent.confirm),{disabled,reason:preview.reasonCodes[0]?displayReason(preview.reasonCodes[0]):null,canActivate:checked.isCurrentAllowed})
 const repeatedBusy=controller.asynchronous&&preview.reasonCodes[0]==='SAVE_IN_PROGRESS'
 const node=<div ref={attach} className={'command '+className} data-checking={checked.pending?'true':undefined}><button type="button" className={primary?'primary':''} aria-label={children?intent.label:undefined} aria-busy={checked.pending||undefined} disabled={binding.disabled} onClick={binding.activate}>{children??intent.label}</button>{showReason&&!repeatedBusy&&!preview.allowed&&!checked.pending&&preview.reasonCodes[0]?<small className="reason">{displayReason(preview.reasonCodes[0])}</small>:null}</div>
 return renderAction?renderAction(binding,node,{command,preview}):node
}
