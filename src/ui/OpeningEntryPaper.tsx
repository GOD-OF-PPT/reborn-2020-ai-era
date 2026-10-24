export type OpeningEntryPaperKind='calendar'|'market'

/** Blank planning and reference materials; no invented event, quote or completed research. */
export function OpeningEntryPaper({kind}:{kind:OpeningEntryPaperKind}){
 return <svg className="opening-entry-paper" viewBox="0 0 320 300" fill="none" aria-hidden="true" focusable="false">
  {kind==='calendar'?<g className="entry-calendar-material">
   <path className="entry-paper-under" d="m52 58 228 19-16 197-228-19z"/>
   <path className="entry-paper-sheet" d="m43 47 228 19-16 197-228-19z"/>
   <path className="entry-calendar-binding" d="m43 47 228 19-4 43-228-19z"/>
   <path className="entry-paper-rings" d="m84 53 2-21c1-10 13-9 12 2l-2 21m125 10 2-21c1-10 13-9 12 2l-2 21"/>
   <path className="entry-calendar-grid" d="m60 113 180 15m-183 19 180 15m-182 19 179 15m-183 18 180 15M86 115l-9 111m39-108-9 111m39-108-9 111m39-109-9 111m39-108-9 111"/>
   <path className="entry-paper-pencil" d="m259 152 28 98-7 3-29-98 1-13z"/>
  </g>:<g className="entry-market-material">
   <path className="entry-reference-cover" d="m49 44 215 31-24 194-215-31z"/>
   <path className="entry-paper-under" d="m62 38 208 35-25 180-208-35z"/>
   <path className="entry-paper-sheet" d="m81 32 192 42-36 167-192-42z"/>
   <path className="entry-reference-rule" d="m99 68 139 30m-142-13 100 22m-104-5 136 30m-140-13 116 26m-120-8 104 23"/>
   <path className="entry-reference-tab" d="m51 102 23 5-10 49-23-5z"/>
   <circle className="entry-reading-lens" cx="224" cy="199" r="33"/>
   <circle className="entry-reading-rim" cx="224" cy="199" r="38"/>
   <path className="entry-reading-handle" d="m196 227-37 42m-7-7 14 13"/>
  </g>}
 </svg>
}
