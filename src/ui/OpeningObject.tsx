import {useId} from 'react'
import {moneyText} from './game-text.ts'
import firstAttempt from '../../assets/ui-redesign/cinematic/props/first-attempt-v1.png'
import videoMakingKit from '../../assets/ui-redesign/cinematic/props/video-making-kit-v1.png'
import coursePreparationKit from '../../assets/ui-redesign/cinematic/props/course-preparation-kit-v1.png'

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
 appearance?:'video'|'course'
 teaching?:CoursePaperState
}

/** The parent supplies committed facts and owns the action; the object adds no business state. */
export function OpeningObject({kind,title,displayTitle,detail,stageLabel,onActivate,actionLabel,disabled,textOnly=false,appearance,teaching}:OpeningObjectProps){
 const id=useId(),titleId=id+'-title',detailId=id+'-detail',stageId=id+'-stage',actionId=id+'-action'
 return <button type="button" className="opening-object" data-kind={kind} data-appearance={appearance} data-text-only={textOnly?'true':'false'} disabled={disabled} onClick={onActivate} aria-label={displayTitle===undefined?undefined:title+' '+actionLabel} aria-labelledby={displayTitle===undefined?titleId+' '+actionId:undefined} aria-describedby={stageId+' '+detailId}>
  {!textOnly?<span className="opening-object-art" aria-hidden="true">
   <img src={appearance==='course'?coursePreparationKit:appearance==='video'?videoMakingKit:firstAttempt} alt="" width={appearance==='course'?1536:appearance==='video'?1254:1280} height={appearance==='course'?1024:appearance==='video'?1254:1280} decoding="async"/>
   <span className="opening-object-mark">
    {kind==='waiting'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><circle cx="16" cy="16" r="12"/><path d="M16 8v9l6 3"/></svg>:kind==='calendar'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><path d="M8 5v6m16-6v6M5 12h22M6 8h20v20H6zM11 17h3m5 0h3m-11 6h3m5 0h3"/></svg>:kind==='work'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><rect x="5" y="7" width="22" height="18"/><path d="m13 12 8 4-8 4zM9 7v18m14-18v18"/></svg>:null}
   </span>
  </span>:null}
  <span className="opening-object-copy">
   <span id={stageId} className="opening-object-stage">{disabled?'暂不可操作 · ':null}{stageLabel}</span>
   <strong id={titleId} className="opening-object-title">{displayTitle??title}</strong>
   {teaching?<span className="course-teaching-slips" aria-label="本班实际教学与责任"><span className="course-stage-tabs">{teaching.stages.map((state,index)=><span key={index} className="course-stage-tab" data-state={state}>第{index+1}段 · {{pending:'待安排',planned:'已安排',running:'进行中',completed:'已交付',stopped:'已停止'}[state]}</span>)}</span><span className="course-money-folds">{teaching.protectedFen>0?<span className="course-protected-band">保护中 {moneyText(teaching.protectedFen)}</span>:null}{teaching.needsHelp>0?<span className="course-responsibility-fold">{teaching.needsHelp}人待帮助</span>:null}{teaching.refundDueFen>0?<span className="course-responsibility-fold">退款待付 {moneyText(teaching.refundDueFen)}</span>:null}{teaching.supportUnmet?<span className="course-support-fold">原支持待履行</span>:null}{teaching.closedAt?<span className="course-closed-slip">本班结清 {teaching.closedAt}</span>:null}</span></span>:null}
   <span id={detailId} className="opening-object-detail">{detail}</span>
   <span id={actionId} className="opening-object-action">{actionLabel}<span aria-hidden="true">{disabled?'—':'↗'}</span></span>
  </span>
 </button>
}
