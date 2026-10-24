import videoMakingKit from '../../assets/ui-redesign/cinematic/props/video-making-kit-v1.png'
import './video-continuity.css'

export type VideoPaperPhase='entry'|'planned'|'making'|'review'|'delivery'|'feedback'|'revision'|'settlement'|'result'|'non-success'|'history'
export interface VideoPaperState{phase:VideoPaperPhase}

/** A persistent original kit plus committed paper shapes; words and actions belong to the caller. */
export function VideoContinuityPaper({art}:{art:VideoPaperState}){
 return <span className="video-continuity-art" data-video-phase={art.phase} aria-hidden="true">
  <span className="video-kit-contact video-phone-contact"/>
  <span className="video-kit-contact video-book-contact"/>
  <img className="video-continuity-kit" src={videoMakingKit} alt="" width={1254} height={1254} decoding="async"/>
  <svg className="video-continuity-layers" viewBox="0 0 1254 1254" fill="none" aria-hidden="true" focusable="false">
   {art.phase==='entry'?<g data-material="open-request-paper">
    <path className="video-state-under" d="m809 634 302 81-54 207-302-81z"/>
    <path className="video-state-sheet" d="m829 604 287 92-67 207-287-92z"/>
    <path className="video-state-ink" d="m850 665 202 65m-215-22 168 54m-181-11 202 65"/>
    <path className="video-state-fold" d="m1065 679 51 17-12 40z"/>
   </g>:null}
   {art.phase==='planned'?<g data-material="reserved-production-paper">
    <path className="video-state-under" d="m671 751 440 112-23 90-440-112z"/>
    <path className="video-state-sheet" d="m678 735 438 119-20 75-438-119z"/>
    <path className="video-state-dashed" d="m693 755 400 109m-409-72 400 109"/>
    <path className="video-state-clip" d="m790 768 14-62c5-24 36-15 31 8l-14 62"/>
    <path className="video-state-tie" d="m956 810 25-90m-53 185 24-84"/>
   </g>:null}
   {art.phase==='making'?<g data-material="open-working-page">
    <path className="video-state-sheet" d="m664 517 339 104-74 236-339-104z"/>
    <path className="video-state-pencil" d="m692 588 233 72m-245-35 194 60m-206-23 233 72"/>
    <path className="video-state-film" d="m641 812 296 75-21 81-296-75z"/>
    <path className="video-state-film-ink" d="m668 836 235 60m-240-37 235 60m-198-61-13 52m70-37-13 52m70-37-13 52m70-37-13 52"/>
    <path className="video-state-pencil-tool" d="m1064 630-49 246-16-4 49-246 12-18z"/>
   </g>:null}
   {art.phase==='review'?<g data-material="version-inspection">
    <path className="video-state-sheet" d="m720 535 312 101-77 234-312-101z"/>
    <path className="video-state-frame" d="m758 590 217 70-36 111-217-70z"/>
    <path className="video-state-ink" d="m731 752 191 61m-201-30 133 42"/>
    <circle className="video-state-lens" cx="960" cy="801" r="78"/>
    <circle className="video-state-rim" cx="960" cy="801" r="89"/>
    <path className="video-state-lens-handle" d="m1017 869 89 105"/>
   </g>:null}
   {art.phase==='delivery'?<g data-material="ready-to-send-version">
    <path className="video-state-under" d="m827 574 306 101-85 254-306-101z"/>
    <path className="video-state-sheet" d="m846 549 298 105-82 242-298-105z"/>
    <path className="video-state-film" d="m870 619 209 74-38 112-209-74z"/>
    <path className="video-state-film-ink" d="m885 649 166 59m-176-28 166 59"/>
    <path className="video-state-tie" d="m799 802 294 100m-155-160-54 156"/>
    <path className="video-state-sheet" d="m1052 844 102 34-22 63-102-34z"/>
   </g>:null}
   {art.phase==='feedback'?<g data-material="sent-version-and-reply-slot">
    <path className="video-state-envelope" d="m798 632 345 107-64 207-345-107z"/>
    <path className="video-state-envelope-line" d="m798 632 123 159 222-52m-409 100 145-65m200 172-84-142"/>
    <path className="video-state-sheet" d="m670 882 136 35-21 81-136-35z"/>
    <path className="video-state-dashed" d="m688 915 88 23"/>
   </g>:null}
   {art.phase==='revision'?<g data-material="returned-version-and-change-fold">
    <path className="video-state-under" d="m710 579 325 106-76 231-325-106z"/>
    <path className="video-state-sheet" d="m740 559 310 107-72 211-310-107z"/>
    <path className="video-state-ink" d="m765 622 220 76m-233-39 178 61m-191-24 220 76"/>
    <path className="video-state-response" d="m1016 728 129 43-72 220-44-54-63 17z"/>
    <path className="video-state-response-line" d="m1035 762 77 26m-87 7 62 21"/>
    <path className="video-state-pencil-tool" d="m690 792 319 121-6 17-319-121-24-18z"/>
   </g>:null}
   {art.phase==='settlement'?<g data-material="accepted-version-awaiting-payment">
    <path className="video-state-sheet" d="m747 652 260 82-47 152-260-82z"/>
    <path className="video-state-double-rule" d="m772 698 194 61m-198-47 194 61"/>
    <path className="video-state-pending-slip" d="m1048 652 105 32-91 296-105-32"/>
    <path className="video-state-dashed" d="m1048 652 105 32m-111 35 78 24m-93 24 78 24m-93 24 78 24"/>
   </g>:null}
   {art.phase==='result'?<g data-material="kept-work-and-result-paper">
    <path className="video-state-under" d="m729 572 308 102-80 242-308-102z"/>
    <path className="video-state-kept" d="m752 554 302 106-80 228-302-106z"/>
    <path className="video-state-film" d="m787 620 204 72-37 105-204-72z"/>
    <path className="video-state-film-ink" d="m803 647 160 56m-170-26 160 56"/>
    <path className="video-state-result-paper" d="m1051 733 116 36-81 254-15-20-19 9-15-20-19 9-15-20-19 9-15-20-19 9z"/>
    <path className="video-state-ink" d="m1064 778 77 24m-90 16 77 24m-90 16 51 16"/>
    <path className="video-state-stamp" d="m1027 910 44 14-15 44-44-14z"/>
   </g>:null}
   {art.phase==='non-success'?<g data-material="stowed-work-and-retained-record">
    <path className="video-state-muted" d="m726 649 374 117-56 178-374-117z"/>
    <path className="video-state-fold" d="m726 649 139 130 235-13"/>
    <path className="video-state-retained-tie" d="m688 774 374 117m-167-187-54 177"/>
    <path className="video-state-sheet" d="m1025 897 99 30-31 96-99-30z"/>
    <path className="video-state-ink" d="m1035 927 66 20m-75 7 50 15"/>
   </g>:null}
   {art.phase==='history'?<g data-material="bound-history-page">
    <path className="video-state-muted" d="m672 556 413 127-84 270-413-127z"/>
    <path className="video-state-sheet" d="m680 533 220 64-125 102-179 127z"/>
    <path className="video-state-envelope-line" d="m900 597-125 102-179 127"/>
    <path className="video-state-binding" d="m696 601 26 8m-46 41 26 8m-46 41 26 8m-46 41 26 8"/>
    <path className="video-state-under" d="m1022 824 99 28-19 68-99-28z"/>
   </g>:null}
  </svg>
 </span>
}
