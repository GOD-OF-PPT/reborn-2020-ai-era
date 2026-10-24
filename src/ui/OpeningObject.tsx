import {useId} from 'react'
import {moneyText} from './game-text.ts'
import firstAttempt from '../../assets/ui-redesign/cinematic/props/first-attempt-v1.png'
import videoMakingKit from '../../assets/ui-redesign/cinematic/props/video-making-kit-v1.png'
import coursePreparationKit from '../../assets/ui-redesign/cinematic/props/course-preparation-kit-v1.png'
import relayServiceKit from '../../assets/ui-redesign/cinematic/props/relay-service-kit-v1.png'
import {FirstOrderPaper,type FirstOrderArtState} from './FirstOrderPaper.tsx'
import {OpeningEntryPaper,type OpeningEntryPaperKind} from './OpeningEntryPaper.tsx'
import {VideoContinuityPaper,type VideoPaperState} from './VideoContinuityPaper.tsx'
import {DayContinuityPaper,type DayContinuityArt} from './DayContinuityPaper.tsx'
import {CoursePreparationPaper,type CoursePreparationPaperState} from './CoursePreparationPaper.tsx'

export type {FirstOrderArtState} from './FirstOrderPaper.tsx'
export type OpeningObjectProtection='readonly'|'unsaved'|'unavailable'

export type CoursePaperStage='pending'|'planned'|'running'|'completed'|'stopped'
export interface CoursePaperState{stages:readonly[CoursePaperStage,CoursePaperStage];protectedFen:number;needsHelp:number;refundDueFen:number;supportUnmet:boolean;closedAt:string|null}

export type OpeningObjectKind='letter'|'calendar'|'work'|'waiting'|'receipt'|'portfolio'

export type OpeningObjectProps={
 kind:OpeningObjectKind
 title:string
 displayTitle?:string
 detail:string
 stageLabel:string
 onActivate:()=>void
 actionLabel:string
 disabled:boolean
 textOnly?:boolean
 appearance?:'video'|'course'|'relay'
 teaching?:CoursePaperState
 firstOrder?:FirstOrderArtState
 protection?:OpeningObjectProtection
 entryPaper?:OpeningEntryPaperKind
 dayPaper?:DayContinuityArt
 videoPaper?:VideoPaperState
 coursePaper?:CoursePreparationPaperState
}

/** The parent supplies committed facts and owns the action; the object adds no business state. */
export function OpeningObject({kind,title,displayTitle,detail,stageLabel,onActivate,actionLabel,disabled,textOnly=false,appearance,teaching,firstOrder,protection,entryPaper,dayPaper,videoPaper,coursePaper}:OpeningObjectProps){
 const id=useId(),titleId=id+'-title',detailId=id+'-detail',stageId=id+'-stage',actionId=id+'-action',dateId=id+'-date',receiptId=id+'-receipt',protectionId=id+'-protection'
 const entry=firstOrder===undefined?entryPaper:undefined,day=firstOrder===undefined&&entry===undefined?dayPaper:undefined,video=firstOrder===undefined&&entry===undefined&&day===undefined?videoPaper:undefined,course=firstOrder===undefined&&entry===undefined&&day===undefined&&video===undefined?coursePaper:undefined,hasPaper=firstOrder!==undefined||entry!==undefined||day!==undefined||video!==undefined||course!==undefined
 const protectionLabel=protection==='readonly'?'只读 · 原记录保留':protection==='unsaved'?'尚未保存 · 仍是上次的物件':protection==='unavailable'?'暂不可用 · 先核对原因':null
 return <button type="button" className="opening-object" data-kind={kind} data-appearance={appearance} data-first-order-phase={firstOrder?.phase} data-entry-paper={entry} data-day-kind={day?.kind} data-day-state={day?.state} data-video-phase={video?.phase} data-course-phase={course?.phase} data-protection={hasPaper?protection:undefined} data-text-only={textOnly?'true':'false'} disabled={disabled} onClick={onActivate} aria-label={displayTitle===undefined?undefined:title+' '+actionLabel} aria-labelledby={displayTitle===undefined?titleId+' '+actionId:undefined} aria-describedby={stageId+' '+detailId+(firstOrder?.dateLabel?' '+dateId:'')+(firstOrder?.phase==='paid'?' '+receiptId:'')+(hasPaper&&protectionLabel?' '+protectionId:'')}>
  {!textOnly?<span className="opening-object-art" aria-hidden="true">
   {video?<VideoContinuityPaper art={video}/>:day?<DayContinuityPaper art={day}/>:entry?<OpeningEntryPaper kind={entry}/>:course?<CoursePreparationPaper art={course}/>:<img src={appearance==='relay'?relayServiceKit:appearance==='course'?coursePreparationKit:appearance==='video'?videoMakingKit:firstAttempt} alt="" width={appearance==='course'||appearance==='relay'?1536:appearance==='video'?1254:1280} height={appearance==='course'||appearance==='relay'?1024:appearance==='video'?1254:1280} decoding="async"/>}
   {firstOrder?<><span className="first-order-contact"/><FirstOrderPaper phase={firstOrder.phase}/></>:video||course?null:day?<span className="day-paper-contact"/>:entry?<span className="entry-paper-contact"/>:<span className="opening-object-mark">
    {kind==='waiting'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><circle cx="16" cy="16" r="12"/><path d="M16 8v9l6 3"/></svg>:kind==='calendar'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><path d="M8 5v6m16-6v6M5 12h22M6 8h20v20H6zM11 17h3m5 0h3m-11 6h3m5 0h3"/></svg>:kind==='work'?appearance==='relay'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><path d="M6 7h20v13H6zM11 20v5h10v-5M10 12v4m4-4v4m4-4v4m4-4v4M16 25v4"/></svg>:<svg viewBox="0 0 32 32" fill="none" focusable="false"><rect x="5" y="7" width="22" height="18"/><path d="m13 12 8 4-8 4zM9 7v18m14-18v18"/></svg>:null}
   </span>}
  </span>:null}
  <span className="opening-object-copy">
   <span id={stageId} className="opening-object-stage">{disabled?'暂不可操作 · ':null}{stageLabel}</span>
   <strong id={titleId} className="opening-object-title">{displayTitle??title}</strong>
   {firstOrder?.dateLabel?<span id={dateId} className="first-order-date-strip">{firstOrder.dateLabel}</span>:null}
   {firstOrder?.phase==='paid'?<span id={receiptId} className="first-order-receipt"><span>收到客户付款</span><strong>{moneyText(firstOrder.receipt.receivedFen)}</strong><time dateTime={firstOrder.receipt.receivedAt}>{firstOrder.receipt.receivedAt}</time></span>:null}
   {hasPaper&&protectionLabel?<span id={protectionId} className={entry?'entry-paper-protection':'first-order-protection'}><span aria-hidden="true">{protection==='readonly'?'▣':'┄'}</span>{protectionLabel}</span>:null}
   {teaching?<span className="course-teaching-slips" aria-label="本班实际教学与责任"><span className="course-stage-tabs">{teaching.stages.map((state,index)=><span key={index} className="course-stage-tab" data-state={state}>第{index+1}段 · {{pending:'待安排',planned:'已安排',running:'进行中',completed:'已交付',stopped:'已停止'}[state]}</span>)}</span><span className="course-money-folds">{teaching.protectedFen>0?<span className="course-protected-band">保护中 {moneyText(teaching.protectedFen)}</span>:null}{teaching.needsHelp>0?<span className="course-responsibility-fold">{teaching.needsHelp}人待帮助</span>:null}{teaching.refundDueFen>0?<span className="course-responsibility-fold">退款待付 {moneyText(teaching.refundDueFen)}</span>:null}{teaching.supportUnmet?<span className="course-support-fold">原支持待履行</span>:null}{teaching.closedAt?<span className="course-closed-slip">本班结清 {teaching.closedAt}</span>:null}</span></span>:null}
   <span id={detailId} className="opening-object-detail">{detail}</span>
   <span id={actionId} className="opening-object-action">{actionLabel}<span aria-hidden="true">{disabled?'—':'↗'}</span></span>
  </span>
 </button>
}
