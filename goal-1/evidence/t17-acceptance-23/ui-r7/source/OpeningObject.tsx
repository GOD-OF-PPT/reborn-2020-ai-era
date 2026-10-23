import {useId} from 'react'
import firstAttempt from '../../assets/ui-redesign/cinematic/props/first-attempt-v1.png'
import videoMakingKit from '../../assets/ui-redesign/cinematic/props/video-making-kit-v1.png'

export type OpeningObjectKind='letter'|'calendar'|'work'|'waiting'|'receipt'|'portfolio'

export type OpeningObjectProps={
 kind:OpeningObjectKind
 title:string
 detail:string
 stageLabel:string
 onActivate:()=>void
 actionLabel:string
 disabled:boolean
 textOnly?:boolean
 appearance?:'video'
}

/** The parent supplies committed facts and owns the action; the object adds no business state. */
export function OpeningObject({kind,title,detail,stageLabel,onActivate,actionLabel,disabled,textOnly=false,appearance}:OpeningObjectProps){
 const id=useId(),titleId=id+'-title',detailId=id+'-detail',stageId=id+'-stage',actionId=id+'-action'
 return <button type="button" className="opening-object" data-kind={kind} data-appearance={appearance} data-text-only={textOnly?'true':'false'} disabled={disabled} onClick={onActivate} aria-labelledby={titleId+' '+actionId} aria-describedby={stageId+' '+detailId}>
  {!textOnly?<span className="opening-object-art" aria-hidden="true">
   <img src={appearance==='video'?videoMakingKit:firstAttempt} alt="" width={appearance==='video'?1254:1280} height={appearance==='video'?1254:1280} decoding="async"/>
   <span className="opening-object-mark">
    {kind==='waiting'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><circle cx="16" cy="16" r="12"/><path d="M16 8v9l6 3"/></svg>:kind==='calendar'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><path d="M8 5v6m16-6v6M5 12h22M6 8h20v20H6zM11 17h3m5 0h3m-11 6h3m5 0h3"/></svg>:kind==='work'?<svg viewBox="0 0 32 32" fill="none" focusable="false"><rect x="5" y="7" width="22" height="18"/><path d="m13 12 8 4-8 4zM9 7v18m14-18v18"/></svg>:null}
   </span>
  </span>:null}
  <span className="opening-object-copy">
   <span id={stageId} className="opening-object-stage">{disabled?'暂不可操作 · ':null}{stageLabel}</span>
   <strong id={titleId} className="opening-object-title">{title}</strong>
   <span id={detailId} className="opening-object-detail">{detail}</span>
   <span id={actionId} className="opening-object-action">{actionLabel}<span aria-hidden="true">{disabled?'—':'↗'}</span></span>
  </span>
 </button>
}
