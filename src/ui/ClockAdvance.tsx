import {useEffect,useMemo,useRef} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'

/** Advancing fulfills old arrangements; it never authorizes another business or AI permission. */
export function ClockAdvance({p,date,label,room=false}:{p:GamePanelProps;date:string;label:string;room?:boolean}){
 const root=useRef<HTMLDivElement>(null)
 const busy=p.controller.snapshot.busy
 const projection=useMemo(()=>{
  const v=p.view
  if(busy||v.busy||v.readOnly||v.hasCandidate||v.saveStatus!=='saved'||p.controller.snapshot.view!==v)return null
  const command={runId:v.runId,actorId:'player',commandId:'display-preview',expectedRevision:v.revision,kind:'AdvanceTime',payload:{date}}
  try{if(!p.controller.preview(command).allowed)return null;const result=p.controller.clockCommitments(command);return result.runId===v.runId&&result.sourceRevision===v.revision&&result.from===v.date?result:null}catch{return null}
 },[p.controller,p.view,date,busy])
 const outflows=projection?.accounts.flatMap(a=>a.outflows.map(f=>({accountId:a.accountId,amountFen:-f.amountFen})))??[]
 const caption=outflows.length===1?(outflows[0]!.accountId==='personal'?'个人':'经营')+'已知待付'+moneyText(outflows[0]!.amountFen):outflows.length>1?outflows.length+'项已知待付':projection||busy||p.view.busy||p.view.readOnly||p.view.hasCandidate?'':'原支出待核对'
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
 return <div ref={root} className={'clock-advance'+(room?' clock-advance-room':'')}><CommandButton {...p} kind="AdvanceTime" payload={{date}} label={'核对后推进 · '+date} confirm className="clock-review"><span>先核对 ↗</span></CommandButton><CommandButton {...p} kind="AdvanceTime" payload={{date}} label={label+(caption?' · '+caption:'')} confirm={projection===null} className="clock-main"><span>{label}</span><kbd aria-hidden="true">Space</kbd>{caption?<small>{caption}</small>:null}</CommandButton></div>
}
