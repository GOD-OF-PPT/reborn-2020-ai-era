import {useId,useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {EquityJourney} from './equity-journey.ts'
import type {SharedActionBinding} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import envelope from '../../assets/ui-redesign/cinematic/props/ecosystem-envelope-v1.png'
import folio from '../../assets/ui-redesign/cinematic/props/ecosystem-open-folio-v1.png'
import closed from '../../assets/ui-redesign/cinematic/props/ecosystem-closed-folio-v1.png'
import holdingBook from '../../assets/ui-redesign/cinematic/props/equity-holding-book-v1.png'
import './equity-scene.css'
import {EquityFinancingLetter} from './EquityFinancingLetter.tsx'
import {equityGovernanceMark,equityGovernanceMarkText,equityGovernancePolicy} from './equity-governance-ui.ts'
import {equityExitMark,equityExitMarkText} from './equity-exit-ui.ts'

const labels:Record<EquityJourney['paper'],string>={intention:'尚未承诺的参与想法',preparation:'实际关系与资格准备',letter:'一封待核实的邀请',report:'已留下的调查附页',terms:'正在谈的具体条款',reply:'对手已经给出的回应',holding:'已经签署的持股册',governance:'有限治理提案',quote:'有限买方报价',receivable:'已转让 · 原款待收',receipt:'本笔原款已收齐',kept:'已经收好的原记录',stopped:'停下或待核的原安排'}
type PaperProps={p:Pick<GamePanelProps,'textOnly'>&{view:Pick<GamePanelProps['view'],'readOnly'|'hasCandidate'|'saveStatus'|'busy'>};journey:EquityJourney;binding:SharedActionBinding;actionHint?:string;unavailable?:boolean}
export function EquityPaper({p,journey,binding,actionHint,unavailable=false}:PaperProps){
 const id=useId(),r=journey.resolution,unknown=unavailable||r.status==='invalid',state=unknown?'stopped':journey.paper,a=unknown?null:r.agreement,e=unknown?null:r.exit
 const meetingMark=equityGovernanceMark(journey),governanceMark=unknown&&meetingMark!==null?'unknown':meetingMark,policy=!unknown&&r.governance?equityGovernancePolicy(r.governance.policy):null
 const exitMark=unknown?null:equityExitMark(journey)
 const businessMark=!unknown&&r.target?.kind==='business'&&r.business?(r.business.lifecycle==='closed'?'closed':r.business.lifecycle==='winding_down'?'winding-down':null):null
 const art=governanceMark==='rejected'||governanceMark==='stopped'?closed:state==='holding'&&a&&a.shares>0?holdingBook:state==='intention'||state==='letter'?envelope:['kept','stopped','receipt'].includes(state)?closed:folio
 const [failed,setFailed]=useState<ReadonlySet<string>>(()=>new Set()),[loaded,setLoaded]=useState<ReadonlySet<string>>(()=>new Set()),ready=loaded.has(art)&&!failed.has(art)
 const lock=state==='holding'&&a&&a.shares>0?a.locked?'locked':'unlocked':'none'
 const protection=p.view.readOnly?'只读 · 原记录保留':p.view.hasCandidate||['unsaved','conflict'].includes(p.view.saveStatus)?'尚未保存 · 仍是上次物件':p.view.busy||p.view.saveStatus==='saving'?'正在保存，暂留原物件':null
 const working=r.job&&['planned','running'].includes(r.job.status)
 const follow=!unknown&&a?.followDecision==='pending'&&(journey.phase==='follow'||journey.phase==='follow-without-holding')
 const businessPreparation=!unknown&&r.target?.kind==='business'&&r.business&&['preparing','discovered'].includes(r.business.lifecycle)
 const paperLabel=businessPreparation?'原主体仍在准备 · 尚未新增承诺':businessMark!==null?(businessMark==='closed'?'原分账已合上 · 历史保留':'已进入收尾 · 原持股与款项继续'):exitMark!==null?equityExitMarkText[exitMark]:governanceMark!==null?(policy?.id==='independent_audit'?'资本核对 · ':policy?.id==='commercial_scope'?'用途与接手方 · ':'')+equityGovernanceMarkText[governanceMark]:follow?'原持股册与本轮来信':state==='report'&&r.preparation?(r.preparation.kind==='relationship'?'已经完成的关系准备':'已经完成的本局资格'):labels[state]
 const date=unknown?null:exitMark==='zero'?journey.resultDate?'原转让 '+journey.resultDate:'原转让日期待核':exitMark==='expired'&&e?'原报价至 '+e.expiresAt:governanceMark==='unknown'?journey.originDate?'原会议来源 '+journey.originDate:'原会议日期待核':follow?'本轮选择至'+a!.followDeadline+' · 原锁定至'+a!.lockUntil:working?`原任务 ${r.job!.startAt}—${r.job!.completeAt}`:e?.receivable?state==='receipt'&&journey.resultDate?'实际收齐 '+journey.resultDate:'原到期 '+e.receivable.dueAt:e?.buyerWilling===true&&!e.quoteExpired?'报价至 '+e.expiresAt:r.governance?.resolvedAt?'实际表决 '+r.governance.resolvedAt:r.target?.kind==='agreement'&&a?a.shares===0?journey.resultDate?'实际转出 '+journey.resultDate:'转出日期见原记录':(a.locked?'仍锁定至 ':'锁定期已到 · 原至 ')+a.lockUntil:r.target?.kind==='negotiation'&&r.negotiation?'条款至 '+r.negotiation.expiresAt:r.target?.kind==='invitation'&&r.invitation?'邀请至 '+r.invitation.expiresAt:journey.resultDate?'实际结果 '+journey.resultDate:journey.originDate?'原来源 '+journey.originDate:null
 return <button type="button" className="opening-object equity-object" data-copy-mode="tableau" data-equity-paper={state} data-equity-governance={governanceMark??undefined} data-equity-exit={exitMark??undefined} data-equity-business={businessMark??undefined} data-equity-lock={lock} data-unavailable={unknown?'true':undefined} data-text-only={p.textOnly?'true':'false'} disabled={binding.disabled} onClick={binding.activate} aria-label={(unknown?'待核对的权益原记录':journey.object)+' · '+binding.label} aria-describedby={id}>
  {!p.textOnly?<span className="opening-object-art equity-paper-art" aria-hidden="true">
   {!failed.has(art)?<img key={art} className="equity-raster" data-ready={ready?'true':undefined} src={art} alt="" draggable={false} onLoad={()=>setLoaded(old=>new Set([...old,art]))} onError={()=>setFailed(old=>new Set([...old,art]))}/>:null}
   <svg className="equity-fallback" data-raster-ready={ready?'true':undefined} viewBox="0 0 360 240" focusable="false"><ellipse className="equity-contact" cx="180" cy="206" rx="143" ry="17"/><path className="equity-cover" d="m42 76 246-21 30 132-245 24z"/><path className="equity-sheet" d="m57 54 219-17 24 139-220 24z"/><path className="equity-ink" d="m79 86 162-15m-159 36 158-15m-153 37 136-13m-133 34 150-14"/></svg>
   <svg className="equity-state-leaf" viewBox="0 0 360 240" focusable="false">
    <path className="equity-leaf-shadow" d="m239 43 65 12-24 153-65-12z"/><path className="equity-leaf" d="m233 37 65 12-24 153-65-12z"/>
    <path className="equity-ink" d="m242 66 36 7m-39 12 36 7m-39 12 36 7m-39 12 36 7"/>
    {unknown?<path className="equity-unknown" d="m237 135 29 5-6 39-29-6z"/>:exitMark!==null&&!['collected','zero'].includes(exitMark)?<g className={'equity-exit-stamp exit-'+exitMark}>
     {exitMark==='source-unknown'?<path d="m231 136 34 6-6 37-34-6z"/>:exitMark==='quote'?<><path d="m230 139 34 6-1 8-4 3 3 5-3 17-34-6 3-17 4-3-3-5z"/><path d="m238 151 15 3m-17 8 15 3"/></>:exitMark==='partial'?<><path d="m229 139 34 6-6 34-34-6z"/><path d="m237 153 7 8 10-15m-23 23 22 4"/></>:['planned','running','waiting'].includes(exitMark)?<><circle cx="246" cy="158" r="18"/><path d="M246 146v13l9 7"/>{exitMark==='planned'?<path d="m232 136 31 6"/>:null}</>:exitMark==='due'?<><path d="m230 139 34 6-6 34-34-6z"/><path d="m233 158 12 2m-5-7 5 7-7 5"/></>:<><path d="m231 142 32 6m-36 12 32 6"/><path d="m239 139 10 33"/></>}
    </g>:governanceMark!==null?<g className={'equity-governance-stamp vote-'+governanceMark}>
     {governanceMark==='planned'?<><path d="m234 137 33 6-6 35-33-6z"/><path d="m233 149 32 6m-25-20-2 12m21-8-2 12m-20 12 5 1m8 1 5 1"/></>:governanceMark==='running'?<><circle cx="246" cy="158" r="18"/><path d="M246 146v13l9 7"/></>:governanceMark==='approved'?<><circle cx="246" cy="158" r="19"/><circle cx="246" cy="158" r="15"/><path d="m235 158 7 8 15-20"/></>:governanceMark==='rejected'?<><path d="m231 138 34 7-7 34-34-7z"/><path d="m236 149 15 18m-16-2 18-14"/></>:governanceMark==='stopped'?<><path d="m231 143 33 6m-36 12 33 6m-33-12 12 2m10 2 12 2"/></>:<path className="equity-unknown" d="m237 135 29 5-6 39-29-6z"/>}
    </g>:lock!=='none'?<g className="equity-lock" data-lock={lock}><path d="m241 139 22 4-5 29-22-4z"/>{lock==='locked'?<path d="m244 140 2-12c2-15 22-12 20 3l-2 13"/>:<path className="equity-open-shackle" d="m244 140 2-13c2-14 23-10 21 3l-1 5"/>}<path d="m249 151-1 9"/></g>:state==='receivable'?<path className="equity-pending" d="m234 137 32 6-6 36-32-6z"/>:state==='receipt'?<g className="equity-cash-receipt"><path d="m120 133 102-8 6 62-11-3-9 5-11-3-9 5-11-3-9 5-10-3-10 4z"/><path className="equity-ink" d="m137 151 65-5m-63 18 49-4"/><path className="equity-received" d="m197 169 8 8 13-19"/></g>:['kept','stopped'].includes(state)?<path className="equity-kept" d="m238 141 29 5m-31 7 29 5"/>:<path className="equity-mark" d="m240 139 22 4-4 25-22-4z"/>}
   </svg>
   {follow?<EquityFinancingLetter className="equity-book-letter"/>:null}
  </span>:null}
  <span className="opening-object-copy equity-paper-copy" id={id}><span className="opening-object-stage">{unknown?'原记录尚待核对':paperLabel}</span>{date?<span className="equity-date">{date}</span>:null}{a?<span className="equity-holding-note">{a.shares===0?'原持股已全部转出，原款分别核对':'仍持'+a.shares+'模拟股 · 估值不能花'}</span>:null}{e?.receivable?<span className="equity-money-note">{exitMark==='source-unknown'?<>原款记收{moneyText(e.collectedFen)} · 现金来源待核</>:<>本笔未收{moneyText(e.receivable.remainingFen)} · 已收{moneyText(e.collectedFen)}</>}</span>:null}{protection?<span className="equity-protection">{protection}</span>:null}<span className="equity-paper-action">{actionHint??binding.label} ↗</span></span>
 </button>
}
