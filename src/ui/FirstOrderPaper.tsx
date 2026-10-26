export type FirstOrderArtState=(
 | {phase:'letter'|'planned'|'running'|'delivery'|'feedback'|'non-success'}
 | {phase:'paid';receipt:{receivedFen:number;receivedAt:string}}
)&{dateLabel?:string}

/** Paper shapes describe committed work; they do not decide its stage or execute it. */
export function FirstOrderPaper({phase}:{phase:FirstOrderArtState['phase']}){
 return <svg className="first-order-paper-layers" viewBox="0 0 320 300" fill="none" aria-hidden="true" focusable="false">
  {phase==='letter'?<g className="first-order-letter" transform="translate(-18 95)">
   <path className="first-order-sheet" d="m165 22 105 19-12 82-106-19z"/>
   <path className="first-order-fold" d="m246 37 24 4-4 24z"/>
   <path className="first-order-pencil" d="m179 52 52 9m-55 6 64 12m-66 4 45 8"/>
  </g>:null}
  {phase==='planned'?<g className="first-order-agreement" transform="translate(0 18)">
   <path className="first-order-sheet" d="m81 136 185 32-7 40-185-32z"/>
   <path className="first-order-dashed" d="m89 148 162 29m-166-6 162 28"/>
   <path className="first-order-clip" d="m126 141 4-25c2-10 16-8 14 3l-5 27"/>
  </g>:null}
  {phase==='running'?<g className="first-order-in-progress">
   <g transform="translate(-8 60)"><path className="first-order-sheet" d="m105 32 114 19-14 90-114-19z"/>
   <path className="first-order-pencil" d="m123 58 73 13m-76 6 49 9m-52 8 66 12"/></g>
   <path className="first-order-film" d="m43 144 103 18-8 40-103-18z"/>
   <path className="first-order-film-ink" d="m55 157 76 13m-78-4 76 13M61 152l-4 25m25-21-4 25m25-21-4 25m25-21-4 25"/>
   <path className="first-order-pencil-tool" d="m216 121 43 67-7 5-43-67 1-10z"/>
  </g>:null}
  {phase==='delivery'?<g className="first-order-ready-work" transform="translate(-14 74)">
   <path className="first-order-sheet" d="m135 18 111 18-13 90-112-18z"/>
   <path className="first-order-sheet-under" d="m125 26 111 18-13 90-111-18z"/>
   <path className="first-order-film" d="m141 50 80 13-6 36-80-13z"/>
   <path className="first-order-film-ink" d="m151 62 56 9m-59 6 56 9m-45-27-5 28m23-25-5 28m23-25-5 28"/>
   <path className="first-order-tie" d="m123 112 113 19m-54-12-3 17"/>
  </g>:null}
  {phase==='feedback'?<g className="first-order-sent-work">
   <path className="first-order-envelope" d="m161 119 122 21-11 74-122-21z"/>
   <path className="first-order-envelope-seam" d="m161 119 52 51 70-30m-133 53 49-30m73 51-36-44"/>
   <path className="first-order-reply-slot" d="m87 192 48 8-6 33-48-8z"/>
   <path className="first-order-dashed" d="m92 207 30 5"/>
  </g>:null}
  {phase==='paid'?<g className="first-order-kept-work">
   <g transform="translate(-14 68)"><path className="first-order-sheet" d="m115 31 106 19-13 86-106-19z"/>
   <path className="first-order-film" d="m131 58 66 12-5 30-66-12z"/>
   <path className="first-order-film-ink" d="m141 68 42 8m-44 3 42 8"/></g>
   <path className="first-order-receipt-shape" d="m231 134 51 9-15 104-6-5-6 3-6-5-6 3-6-5-6 3-6-5z"/>
   <path className="first-order-receipt-lines" d="m239 153 30 5m-32 9 30 5m-32 9 20 4"/>
   <path className="first-order-receipt-stamp" d="m237 198 21 4-3 19-21-4z"/>
  </g>:null}
  {phase==='non-success'?<g className="first-order-kept-record">
   <path className="first-order-folded-work" d="m114 113 137 25-13 73-137-25z"/>
   <path className="first-order-fold" d="m114 113 47 48 90-23"/>
   <path className="first-order-retained-tie" d="m111 167 129 23m-68-43-8 47"/>
   <path className="first-order-record-corner" d="m232 199 33 5-5 31-33-5z"/>
  </g>:null}
 </svg>
}
