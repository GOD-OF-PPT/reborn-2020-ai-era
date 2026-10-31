import {useEffect,useRef,useState} from 'react'
import type {GameControllerPort} from '../application/game-controller-port.ts'
import type {PreparationWorkspaceContext} from './App.tsx'

const fields=['runId','screen','accountId','open','epoch','relayTargetKey','videoTargetKey','courseTargetKey','ecosystemTargetKey','lifeTargetKey'] as const
const topDialog=()=>[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1)??null
type Frame={id:number;label:string;kind:'decision'|'record';owner:GameControllerPort;view:GameControllerPort['snapshot']['view'];session:string|undefined;modalEpoch:number;workspace:PreparationWorkspaceContext|null;dialog:HTMLDialogElement|null;title:string;resolve:(value:PreparationWorkspaceContext|null)=>void;remove:()=>void}

/** One uncommitted UI intent. A later gesture or reading owns its own response. */
export function useUiIntent(owner:GameControllerPort|null,workspace:()=>PreparationWorkspaceContext,modalEpoch:()=>number){
 const source=useRef({owner,workspace,modalEpoch});source.current={owner,workspace,modalEpoch}
 const active=useRef<Frame|null>(null),serial=useRef(0),live=useRef(true)
 const [pending,setPending]=useState<{id:number;label:string;kind:'decision'|'record'}|null>(null)
 const retire=(frame:Frame)=>{frame.remove();frame.resolve(null);if(active.current===frame){active.current=null;if(live.current)setPending(null)}}
 const sameSource=(frame:Frame)=>source.current.owner===frame.owner&&frame.owner.snapshot.view===frame.view&&frame.owner.runtimeSession===frame.session&&!frame.owner.snapshot.busy&&(!frame.owner.runtimeFailed||frame.kind==='record')&&source.current.modalEpoch()===frame.modalEpoch
 const owns=(frame:Frame)=>{
  if(active.current!==frame||!sameSource(frame)||!frame.workspace)return false
  const current=source.current.workspace(),dialog=topDialog()
  return fields.every(key=>current[key]===frame.workspace![key])&&dialog===frame.dialog&&(!dialog||dialog.isConnected&&dialog.open&&(dialog.querySelector('h2')?.textContent??'')===frame.title)
 }
 useEffect(()=>{live.current=true;return()=>{live.current=false;const frame=active.current;if(frame){frame.remove();frame.resolve(null);active.current=null}}},[])
 useEffect(()=>{
  const frame=active.current;if(!frame||frame.id!==pending?.id)return
  if(!sameSource(frame)){retire(frame);return}
  // A synchronous scene handoff (closing its paper/selecting its object) has
  // committed before this effect. Subsequent gestures retire this intent.
  frame.workspace={...source.current.workspace()};frame.dialog=topDialog();frame.title=frame.dialog?.querySelector('h2')?.textContent??'';frame.resolve(frame.workspace)
  return()=>frame.remove()
 },[pending?.id])
 useEffect(()=>{const frame=active.current;if(frame?.workspace&&!owns(frame))retire(frame)})
 const begin=(label:string,kind:'decision'|'record'='decision')=>{
  if(!source.current.owner)throw Error('RUN_NOT_FOUND')
  if(active.current)retire(active.current)
  let resolve:(value:PreparationWorkspaceContext|null)=>void=()=>{}
  const ready=new Promise<PreparationWorkspaceContext|null>(done=>{resolve=done}),current=source.current.owner
  const frame:Frame={id:++serial.current,label,kind,owner:current,view:current.snapshot.view,session:current.runtimeSession,modalEpoch:source.current.modalEpoch(),workspace:null,dialog:null,title:'',resolve,remove:()=>{}}
  const events=['pointerdown','click','keydown','input','change'] as const,cancel=(event:Event)=>{if(event.type==='keydown'&&!['Escape','PageDown','PageUp'].includes((event as KeyboardEvent).key))return;if(active.current===frame)retire(frame)}
  for(const name of events)document.addEventListener(name,cancel,true)
  frame.remove=()=>{for(const name of events)document.removeEventListener(name,cancel,true)}
  active.current=frame;setPending({id:frame.id,label,kind})
  return {ready,owns:()=>owns(frame),finish:()=>retire(frame)}
 }
 return {pending,begin,cancel:()=>{if(active.current)retire(active.current)}}
}
