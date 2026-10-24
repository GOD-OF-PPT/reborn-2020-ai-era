import coursePreparationKit from '../../assets/ui-redesign/cinematic/props/course-preparation-kit-v1.png'
import './course-preparation-paper.css'

export type CoursePreparationPaperPhase='entry'|'outline-planned'|'outline-running'|'outline-completed'|'definition'|'license-planned'|'license-running'|'license-ready'|'sample-planned'|'sample-running'|'sample-ready'|'stopped'|'history'
export interface CoursePreparationPaperState{phase:CoursePreparationPaperPhase}

/** Committed paper shapes only; the caller supplies every fact, protection and action. */
export function CoursePreparationPaper({art}:{art:CoursePreparationPaperState}){
 return <span className="course-preparation-art" data-course-phase={art.phase} aria-hidden="true">
  <img className="course-preparation-kit" src={coursePreparationKit} alt="" width={1536} height={1024} decoding="async"/>
  <svg className="course-preparation-layers" viewBox="0 0 1536 1024" fill="none" aria-hidden="true" focusable="false">
   {art.phase==='entry'?<g data-material="source-and-blank-plan">
    <path className="course-paper-under" d="m984 522 443 102-64 231-443-102z"/>
    <path className="course-paper-sheet" d="m1024 487 415 127-74 224-415-127z"/>
    <path className="course-paper-fold" d="m1368 592 71 22-19 58z"/>
    <path className="course-paper-case" d="m894 597 150 44-30 102-150-44z"/>
    <path className="course-paper-ink" d="m910 632 91 27m-98-5 65 19"/>
   </g>:null}
   {art.phase==='outline-planned'?<g data-material="reserved-outline-packet">
    <path className="course-paper-under" d="m833 601 560 136-29 115-560-136z"/>
    <path className="course-paper-sheet" d="m842 581 561 145-29 110-561-145z"/>
    <path className="course-paper-fold-line" d="m842 581 198 139 363 6"/>
    <path className="course-paper-dashed" d="m859 603 518 134m-530-89 518 134"/>
    <path className="course-paper-clip" d="m1001 622 12-47c5-20 31-12 26 7l-12 47"/>
   </g>:null}
   {art.phase==='outline-running'?<g data-material="open-outline-leaf">
    <path className="course-paper-under" d="m831 440 603 171-77 263-603-171z"/>
    <path className="course-paper-sheet" d="m854 412 592 183-79 253-592-183z"/>
    <path className="course-paper-margin" d="m944 441-77 250"/>
    <path className="course-paper-pencil" d="m980 502 373 115m-391-61 308 95m-325-43 373 115m-390-63 217 67"/>
    <path className="course-paper-working-edge" d="m831 727 283 76-9 32-283-76z"/>
   </g>:null}
   {art.phase==='outline-completed'?<g data-material="bound-outline-pages">
    <path className="course-paper-under" d="m881 457 555 160-67 249-555-160z"/>
    <path className="course-paper-page-edge" d="m866 444 558 166-67 237-558-166z"/>
    <path className="course-paper-kept" d="m881 421 554 174-71 227-554-174z"/>
    <path className="course-paper-binding" d="m906 456-64 205"/>
    <path className="course-paper-ink" d="m973 511 353 111m-369-58 303 95m-320-42 353 111"/>
    <path className="course-paper-bookmark" d="m1266 542 54 17-79 251-17-28-34 12z"/>
   </g>:null}
   {art.phase==='definition'?<g data-material="case-beside-course-plan">
    <path className="course-paper-sheet" d="m1012 451 427 134-98 310-427-134z"/>
    <path className="course-paper-plan-frame" d="m1058 522 303 95-54 171-303-95z"/>
    <path className="course-paper-ink" d="m1079 574 220 69m-230-35 174 55m-184-21 220 69"/>
    <path className="course-paper-case" d="m816 537 236 68-54 185-236-68z"/>
    <path className="course-paper-ink" d="m847 594 156 45m-165-14 123 36m-131-5 156 45"/>
    <path className="course-paper-clip" d="m1012 601 15-50c6-20 32-12 26 8l-15 50"/>
   </g>:null}
   {art.phase==='license-planned'?<g data-material="reserved-material-scope">
    <path className="course-paper-under" d="m919 559 490 140-55 195-490-140z"/>
    <path className="course-paper-sheet" d="m942 538 480 144-55 184-480-144z"/>
    <path className="course-paper-fold-line" d="m942 538 165 142 315 2"/>
    <path className="course-paper-dashed" d="m964 567 426 128m-441-76 426 128"/>
    <path className="course-paper-scope-tab" d="m1245 629 99 30-41 137-27-30-37 11z"/>
   </g>:null}
   {art.phase==='license-running'?<g data-material="material-and-scope-in-preparation">
    <path className="course-paper-case" d="m804 500 390 105-62 223-390-105z"/>
    <path className="course-paper-ink" d="m842 555 288 78m-301-35 214 58m-226-15 288 78"/>
    <path className="course-paper-scope" d="m1043 442 388 120-104 331-388-120z"/>
    <path className="course-paper-scope-frame" d="m1075 500 291 90-72 233-291-90z"/>
    <path className="course-paper-pencil" d="m1091 548 215 66m-231-16 176 54m-191-5 215 66"/>
   </g>:null}
   {art.phase==='license-ready'?<g data-material="kept-material-scope-pair">
    <path className="course-paper-case" d="m796 539 330 88-60 226-330-88z"/>
    <path className="course-paper-kept" d="m1072 495 344 103-82 271-344-103z"/>
    <path className="course-paper-scope-frame" d="m1102 544 254 76-56 186-254-76z"/>
    <path className="course-paper-ink" d="m835 599 227 61m-238-20 180 48m93-99 196 59m-209-17 152 46"/>
    <path className="course-paper-joined-clip" d="m1088 618-51 170c-11 36-60 20-49-14l43-143c7-23 38-12 31 10l-37 123"/>
   </g>:null}
   {art.phase==='sample-planned'?<g data-material="reserved-practice-leaf">
    <path className="course-paper-under" d="m920 544 502 144-61 216-502-144z"/>
    <path className="course-paper-sheet" d="m937 519 495 152-63 204-495-152z"/>
    <path className="course-paper-fold" d="m1354 647 78 24-17 55z"/>
    <path className="course-paper-practice-frame course-paper-dashed" d="m978 574 358 110-34 110-358-110z"/>
    <path className="course-paper-tie" d="m896 667 485 149m-223-193-56 183"/>
   </g>:null}
   {art.phase==='sample-running'?<g data-material="open-practice-spread">
    <path className="course-paper-under" d="m742 490 330-27 373 156-97 274-346-118-334-20z"/>
    <path className="course-paper-sheet" d="m762 461 310-25-76 310-306-21z"/>
    <path className="course-paper-warm-sheet" d="m1072 436 370 155-94 277-352-122z"/>
    <path className="course-paper-fold-line" d="m1072 436-76 310"/>
    <path className="course-paper-practice-frame" d="m808 517 186-13-38 156-186-13z"/>
    <path className="course-paper-pencil" d="m1098 539 237 98m-250-53 204 84m-216-40 237 98"/>
    <path className="course-paper-working-edge" d="m834 709 114 9-2 27-114-9z"/>
   </g>:null}
   {art.phase==='sample-ready'?<g data-material="kept-practice-pages">
    <path className="course-paper-under" d="m820 467 602 167-73 263-602-167z"/>
    <path className="course-paper-page-edge" d="m840 448 593 173-76 249-593-173z"/>
    <path className="course-paper-kept" d="m862 422 580 185-76 233-580-185z"/>
    <path className="course-paper-practice-frame" d="m918 491 174 56-39 121-174-56z"/>
    <path className="course-paper-ink" d="m1143 563 211 67m-222-32 174 55m-184-20 211 67m-437-79 159 51"/>
    <path className="course-paper-binding" d="m876 453-58 178"/>
    <path className="course-paper-bookmark" d="m1266 709 70 22-33 101-23-25-32 7z"/>
   </g>:null}
   {art.phase==='stopped'?<g data-material="stowed-preparation-and-retained-leaf">
    <path className="course-paper-muted" d="m863 536 556 151-55 209-556-151z"/>
    <path className="course-paper-fold-line" d="m863 536 199 151 357 0"/>
    <path className="course-paper-retained-tie" d="m837 693 555 152m-223-213-56 209"/>
    <path className="course-paper-retained" d="m1280 718 122 35-45 152-34-30-42 8z"/>
    <path className="course-paper-retained-line" d="m1297 755 74 21m-82 9 60 17"/>
   </g>:null}
   {art.phase==='history'?<g data-material="folded-preparation-history">
    <path className="course-paper-muted" d="m823 499 590 160-62 232-590-160z"/>
    <path className="course-paper-page-edge" d="m849 474 576 165-69 224-576-165z"/>
    <path className="course-paper-sheet" d="m849 474 308 88-164 65-213 71z"/>
    <path className="course-paper-fold-line" d="m1157 562-164 65-213 71"/>
    <path className="course-paper-binding" d="m850 523 27 8m-42 37 27 8m-42 37 27 8m-42 37 27 8"/>
   </g>:null}
  </svg>
 </span>
}
