import {useEffect,useRef} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'
import {resolveEquitySceneTarget} from './equity-scene-target.ts'
import {equitySceneContext} from './equity-player-thread.ts'
import {equityFollowOffer} from './equity-follow-offer.ts'
import {EquityFinancingLetter} from './EquityFinancingLetter.tsx'
import {makeSharedAction} from './shared-action.ts'
import './equity-scene.css'

type Props={p:GamePanelProps;viewing?:EquitySceneTarget|null;blocked?:boolean;onOpen:(target:EquitySceneTarget)=>void}
function pendingLetter(p:GamePanelProps){
 const rows=p.features.deepseek?.agreements.filter(a=>a.followDecision==='pending')??[]
 if(p.view.phase!=='playing'||rows.length!==1)return null
 const a=rows[0]!,target:EquitySceneTarget={runId:p.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'agreement',recordId:a.id}
 if(!equityFollowOffer(p,a)||resolveEquitySceneTarget(p.features.deepseek,target,equitySceneContext(p,a.accountId)).status!=='valid')return null
 return {agreement:a,target}
}
/** A scoped reading choice. Opening this letter never submits a game command. */
export function EquityFollowNotice({p,viewing=null,blocked=false,onOpen}:Props){
 const letter=pendingLetter(p),same=letter&&viewing?.kind==='agreement'&&viewing.runId===letter.target.runId&&viewing.accountId===letter.target.accountId&&viewing.businessId===letter.target.businessId&&viewing.recordId===letter.agreement.id
 const visible=letter!==null&&!blocked&&!same,key=JSON.stringify([p.view.runId,p.view.revision,letter?.target??null,viewing,visible]),scope=useRef({key,live:true,retired:false})
 if(scope.current.key!==key)scope.current={key,live:true,retired:false}
 const captured=scope.current
 useEffect(()=>{captured.live=true;return()=>{captured.live=false}},[captured])
 if(!visible||!letter)return null
 const action=makeSharedAction(p,'翻开这封融资来信',()=>{captured.retired=true;onOpen(letter.target)},{allowReadOnly:true,canActivate:()=>scope.current===captured&&captured.live&&!captured.retired})
 const protection=p.view.hasCandidate||p.view.saveStatus==='conflict'?'先处理原保存状态':p.view.busy||p.view.saveStatus==='saving'?'原记录正在保存':p.view.readOnly?'只读 · 可翻阅原来信':null
 return <button type="button" className="equity-follow-notice" data-text-only={p.textOnly?'true':'false'} data-protection={protection?'true':undefined} disabled={action.disabled} onClick={action.activate} aria-label="翻开这封融资来信">
  {!p.textOnly?<EquityFinancingLetter/>:null}<span className="equity-notice-copy"><strong>一封架空融资来信</strong><span>{letter.agreement.followDeadline}前，可作选择</span><span>翻开看看 · 查看不付款 ↗</span>{protection?<span className="equity-notice-protection">{protection}</span>:null}</span>
 </button>
}
