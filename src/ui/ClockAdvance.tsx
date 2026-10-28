import {useEffect,useMemo,useRef,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'
import type {SharedActionBinding} from './shared-action.ts'
import {journeyIntent} from './journey-intent.ts'

export interface ClockActionBinding extends SharedActionBinding{readonly caption:string;readonly mainNode:ReactNode;readonly reviewNode:ReactNode}

/** Advancing fulfills old arrangements; it never authorizes another business or AI permission. */
export function ClockAdvance({p,date,label,room=false,renderAction,showReason=true}:{p:GamePanelProps;date:string;label:string;room?:boolean;renderAction?:((binding:ClockActionBinding)=>ReactNode)|undefined;showReason?:boolean}){
 const root=useRef<HTMLDivElement>(null)
 const busy=p.controller.snapshot.busy
 const projection=useMemo(()=>{
  const v=p.view
  if(busy||v.busy||v.readOnly||v.hasCandidate||v.saveStatus!=='saved'||p.controller.snapshot.view!==v)return null
  const intent=journeyIntent(v,'AdvanceTime',{date},label)
  const command={runId:v.runId,actorId:'player',commandId:'display-preview',expectedRevision:v.revision,kind:intent.kind,payload:intent.payload}
  try{if(!p.controller.preview(command).allowed)return null;const result=p.controller.clockCommitments(command);return result.runId===v.runId&&result.sourceRevision===v.revision&&result.from===v.date?result:null}catch{return null}
 },[p.controller,p.view,date,label,busy])
 const outflows=projection?.accounts.flatMap(a=>a.outflows.map(f=>({accountId:a.accountId,amountFen:-f.amountFen})))??[]
 const grouped=new Map<string,number>()
 for(const outflow of outflows)grouped.set(outflow.accountId,(grouped.get(outflow.accountId)??0)+outflow.amountFen)
 const cashLabel=(id:string)=>id==='personal'?'个人':({a_share:'模拟投资',ai_video:'视频',ai_course:'课程',api_relay:'中转服务',deepseek_opportunity:'生态服务'} as Record<string,string>)[p.features.workbench.routes.find(r=>r.accountId===id)?.id??'']??'经营'+id.slice(-4)
 const caption=outflows.length===1?cashLabel(outflows[0]!.accountId)+'已知待付'+moneyText(outflows[0]!.amountFen):outflows.length>1?[...grouped].map(([id,amount])=>cashLabel(id)+'已知待付'+moneyText(Number.isSafeInteger(amount)?amount:null)).join('；'):projection||busy||p.view.busy||p.view.readOnly||p.view.hasCandidate?'':'原支出待核对'
 useEffect(()=>{
  const advance=(event:KeyboardEvent)=>{
   if(event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey||!(event.code==='Space'||event.key===' '))return
   if(document.querySelector('dialog[open]'))return
   const target=event.target,main=document.getElementById('main-content')
   if(!(target instanceof Element)||!(target===document.body||target===main||target.tagName==='H1'&&main?.contains(target)))return
   const button=root.current?.querySelector<HTMLButtonElement>('.clock-main>button')
   if(!button||button.disabled||button.inert||!button.getClientRects().length)return
   const rect=button.getBoundingClientRect()
   if(rect.left<0||rect.right>innerWidth||rect.top<0||rect.bottom>innerHeight)return
   event.preventDefault();button.click()
  }
  document.addEventListener('keydown',advance);return()=>document.removeEventListener('keydown',advance)
 },[])
 const request:GamePanelProps['request']=p.requestWait?(_kind,_payload,text,confirm)=>p.requestWait!(date,text,confirm??false):p.request
 const reviewNode=<CommandButton {...p} request={request} kind="AdvanceTime" payload={{date}} label={'核对后推进 · '+date} confirm className="clock-review" showReason={showReason}><span>先核对 ↗</span></CommandButton>
 const main=<CommandButton {...p} request={request} kind="AdvanceTime" payload={{date}} label={label+(caption?' · '+caption:'')} confirm={projection===null} className="clock-main" rootRef={root} showReason={showReason} renderAction={renderAction?(binding,mainNode)=>renderAction({...binding,caption,mainNode,reviewNode}):undefined}><span>{label}</span><kbd aria-hidden="true">Space</kbd>{caption?<small>{caption}</small>:null}</CommandButton>
 return renderAction?main:<div className={'clock-advance'+(room?' clock-advance-room':'')}>{reviewNode}{main}</div>
}
