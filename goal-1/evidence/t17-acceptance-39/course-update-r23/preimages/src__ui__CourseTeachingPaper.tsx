import coursePreparationKit from '../../assets/ui-redesign/cinematic/props/course-preparation-kit-v1.png'
import type {CoursePaperStage} from './OpeningObject.tsx'
import './course-teaching-art.css'

export type CourseTeachingPaperPhase='audience'|'cohort'|'teaching'|'support'|'refund'|'closed'|'stopped'|'history'
export interface CourseTeachingPaperState{
 phase:CourseTeachingPaperPhase
 status:'choice'|'planned'|'running'|'actual'
 stages:readonly[CoursePaperStage,CoursePaperStage]|null
 protectedFen:number|null
 needsHelp:number|null
 refundDueFen:number|null
 feeDueFen:number|null
 closedAt:string|null
}

/** Shapes are decorative. All names, money, dates, protection and actions remain caller-owned DOM. */
export function CourseTeachingPaper({art}:{art:CourseTeachingPaperState}){
 const history=art.phase==='history'
 return <span className="course-teaching-art" data-teaching-phase={art.phase} data-teaching-status={art.status} aria-hidden="true">
  <img className="course-teaching-kit" src={coursePreparationKit} alt="" width={1536} height={1024} decoding="async"/>
  <svg className="course-teaching-layers" viewBox="0 0 1536 1024" fill="none" aria-hidden="true" focusable="false">
   {art.phase==='audience'?<g data-material="audience-letter-and-unfilled-plan">
    <path className="teaching-art-under" d="m856 529 552 149-58 220-552-149z"/>
    <path className="teaching-art-envelope" d="m879 501 541 159-60 202-541-159z"/>
    <path className="teaching-art-seam" d="m879 501 184 162 357-3m-601 43 205-61m276 221-111-154"/>
    <path className="teaching-art-sheet" d="m1035 443 333 101-57 185-333-101z"/>
    <path className="teaching-art-ink" d="m1072 504 219 67m-230-31 171 52"/>
   </g>:null}
   {art.phase==='cohort'?<g data-material="class-promise-folio">
    <path className="teaching-art-under" d="m795 473 626 176-67 248-626-176z"/>
    <path className="teaching-art-sheet" d="m824 439 611 190-70 226-611-190z"/>
    <path className="teaching-art-binding" d="m849 478-53 168"/>
    <path className="teaching-art-frame" d="m909 513 431 134-36 116-431-134z"/>
    <path className="teaching-art-ink" d="m937 557 343 107m-355-70 242 75"/>
    <path className="teaching-art-bookmark" d="m1271 764 63 19-29 94-22-25-32 8z"/>
   </g>:null}
   {art.phase==='teaching'?<g data-material="two-part-teaching-spread">
    <path className="teaching-art-under" d="m735 490 319-24 390 153-91 274-356-113-326-18z"/>
    <path className="teaching-art-sheet" d="m757 458 297-23-74 310-303-22z"/>
    <path className="teaching-art-warm-sheet" d="m1054 435 388 154-89 276-373-120z"/>
    <path className="teaching-art-seam" d="m1054 435-74 310"/>
    <path className="teaching-art-frame" d="m799 510 174-12-35 151-174-12z"/>
    <path className="teaching-art-ink" d="m1102 524 253 101m-267-55 208 83m-221-38 253 101"/>
   </g>:null}
   {art.phase==='support'?<g data-material="support-reply-and-kept-lesson">
    <path className="teaching-art-under" d="m783 524 597 162-66 239-597-162z"/>
    <path className="teaching-art-kept" d="m800 499 591 172-64 217-591-172z"/>
    <path className="teaching-art-sheet" d="m1120 439 304 101-111 332-304-101z"/>
    <path className="teaching-art-fold" d="m1354 516 70 24-20 60z"/>
    <path className="teaching-art-ink" d="m1147 501 194 65m-207-26 155 52m-168-14 194 65"/>
    <path className="teaching-art-clip" d="m1084 713 20-62c7-23 37-12 30 10l-20 62"/>
   </g>:null}
   {art.phase==='refund'?<g data-material="return-scope-and-reconciliation">
    <path className="teaching-art-under" d="m795 506 597 160-62 233-597-160z"/>
    <path className="teaching-art-kept" d="m818 480 589 173-66 214-589-173z"/>
    <path className="teaching-art-sheet" d="m1109 462 314 107-111 324-314-107z"/>
    <path className="teaching-art-frame" d="m1136 517 230 78-71 211-230-78z"/>
    <path className="teaching-art-seam" d="m1107 601 228 77m-245-28 228 77m-244-29 228 77"/>
    <path className="teaching-art-return-fold" d="m1029 747 145 43-23 78-145-43 44-33z"/>
   </g>:null}
   {art.phase==='closed'?<g data-material="kept-class-record">
    <path className="teaching-art-under" d="m806 488 601 160-68 248-601-160z"/>
    <path className="teaching-art-page-edge" d="m823 470 595 170-69 230-595-170z"/>
    <path className="teaching-art-kept" d="m846 441 583 185-71 221-583-185z"/>
    <path className="teaching-art-ink" d="m939 524 389 124m-405-72 306 98m-323-47 389 124"/>
    {art.closedAt!==null?<path className="teaching-art-closure-binding" data-material="actual-closure-binding" d="m887 475-58 179m15-193-58 179"/>:null}
   </g>:null}
   {art.phase==='stopped'?<g data-material="stowed-class-and-retained-responsibility">
    <path className="teaching-art-muted" d="m837 536 575 156-52 207-575-156z"/>
    <path className="teaching-art-seam" d="m837 536 204 156 371 0"/>
    <path className="teaching-art-retained-tie" d="m809 704 576 155m-236-215-55 206"/>
    <path className="teaching-art-sheet" d="m1255 739 143 41-42 144-143-41z"/>
    <path className="teaching-art-ink" d="m1275 782 93 26m-102 5 73 21"/>
   </g>:null}
   {history?<g data-material="original-attempt-history-leaf">
    <path className="teaching-art-muted" d="m806 511 604 164-61 229-604-164z"/>
    <path className="teaching-art-sheet" d="m828 477 330 91-184 67-229 66z"/>
    <path className="teaching-art-seam" d="m1158 568-184 67-229 66"/>
    <path className="teaching-art-binding" d="m829 528 26 8m-41 38 26 8m-41 38 26 8m-41 38 26 8"/>
   </g>:null}
   {!history&&art.status==='planned'?<g data-material="reserved-fold">
    <path className="teaching-art-sheet" d="m829 726 478 127-20 75-478-127z"/>
    <path className="teaching-art-dashed" d="m847 750 438 116m-445-90 438 116"/>
   </g>:!history&&art.status==='running'?<g data-material="working-loose-leaf">
    <path className="teaching-art-warm-sheet" d="m1031 495 346 111-41 129-346-111z"/>
    <path className="teaching-art-pencil" d="m1060 543 245 78m-255-46 199 64"/>
   </g>:!history&&art.status==='actual'?<g data-material="recorded-page-edge">
    <path className="teaching-art-page-edge" d="m844 769 288 77-13 46-288-77z"/>
    <path className="teaching-art-ink" d="m858 790 244 65"/>
   </g>:null}
   {!history&&art.stages?<g data-material="actual-teaching-tabs">{art.stages.map((state,index)=>{
    const x=826+index*187,y=692+index*49
    return <g key={index} data-stage-index={index} data-stage-state={state}>
     <path className={'teaching-art-stage-tab teaching-art-stage-'+state} d={`m${x} ${y} 163 43-25 94-163-43z`}/>
     {state==='completed'?<path className="teaching-art-double-rule" d={`m${x+16} ${y+32} 119 31m-124-14 119 31`}/>:state==='running'?<path className="teaching-art-pencil" d={`m${x+18} ${y+38} 110 29m-114-11 77 20`}/>:null}
    </g>
   })}</g>:null}
   {!history&&art.protectedFen!==null&&art.protectedFen>0?<g data-material="actual-protection-fold">
    <path className="teaching-art-protection" d="m812 785 475 121-17 60-475-121 30-23z"/>
    <path className="teaching-art-seam" d="m837 811 413 105"/>
   </g>:null}
   {!history&&art.needsHelp!==null&&art.needsHelp>0?<path data-material="actual-help-fold" className="teaching-art-responsibility" d="m1328 648 90 30-67 200-25-34-40 12z"/>:null}
   {!history&&art.refundDueFen!==null&&art.refundDueFen>0?<path data-material="actual-refund-due-fold" className="teaching-art-responsibility" d="m1212 778 101 30-42 139-34-30-40 9z"/>:null}
   {!history&&art.feeDueFen!==null&&art.feeDueFen>0?<path data-material="actual-fee-due-fold" className="teaching-art-fee-fold" d="m1102 754 84 24-40 137-25-26-36 8z"/>:null}
  </svg>
 </span>
}
