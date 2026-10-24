import './day-continuity.css'

export type DayContinuityArt={kind:'today'|'work'|'life'|'market';state:'history'|'result'|'ongoing'|'carry'}

/** The parent supplies committed context and all words. These papers have no business behaviour. */
export function DayContinuityPaper({art}:{art:DayContinuityArt}){
 return <svg className="day-continuity-art" data-kind={art.kind} data-state={art.state} viewBox="0 0 320 300" fill="none" aria-hidden="true" focusable="false">
  <ellipse className="day-paper-shadow" cx="166" cy="270" rx="119" ry="17"/>
  <path className="day-paper-bottom" d="m46 55 229 23-17 194-229-23z"/>
  {art.kind==='today'?<g data-material="empty-calendar">
   <path className="day-paper-sheet" d="m46 43 226 25-18 190-226-25z"/>
   <path className="day-paper-cover" d="m46 43 226 25-4 37-226-25z"/>
   <path className="day-paper-ring" d="m82 49 2-20c1-10 13-8 12 2l-2 20m127 12 2-20c1-10 13-8 12 2l-2 20"/>
   <path className="day-paper-grid" d="m57 112 187 20m-190 16 187 20m-190 16 187 20m-190 16 187 20M86 115l-10 119m38-116-10 119m38-116-10 119m38-116-10 119m38-116-10 119m38-116-10 119"/>
  </g>:null}
  {art.kind==='work'?<g data-material="work-calendar">
   <path className="day-paper-cover" d="m49 43 218 23-17 192-218-23z"/>
   <path className="day-paper-sheet" d="m64 39 205 31-24 178-205-31z"/>
   <path className="day-paper-grid" d="m82 91 160 24m-163-4 160 24m-163-4 160 24m-163-4 160 24m-163-4 160 24M105 72l-17 139m48-134-17 139m48-134-17 139m48-134-17 139m48-134-17 139"/>
   <path className="day-paper-clip" d="m84 46 3-20c2-11 17-9 15 3l-3 20"/>
   {art.state==='result'?<g data-material="wage-trace">
    <path className="day-paper-kept" d="m184 169 98 11-9 67-98-11z"/>
    <path className="day-paper-perforation" d="m187 181 83 9"/>
    <path className="day-paper-ink" d="m189 197 64 7m-66 6 46 5m-48 7 64 7"/>
   </g>:null}
  </g>:null}
  {art.kind==='life'?<g data-material="life-notebook">
   <path className="day-paper-cover" d="m38 67 116-16 129 35-23 169-117-23-120 4z"/>
   <path className="day-paper-sheet" d="m47 55 107-12-12 170-110 8z"/>
   <path className="day-paper-warm-sheet" d="m154 43 121 34-23 161-110-25z"/>
   <path className="day-paper-seam" d="m154 43-12 170"/>
   <path className="day-paper-ink" d="m63 92 65-7m-67 23 65-6m-67 23 65-7m51-19 71 19m-74-3 71 19m-73-3 70 19"/>
   <path className="day-paper-bookmark" d="m170 48 15 4-21 182-7-11-9 7z"/>
   {art.state==='result'?<g data-material="kept-life-page">
    <path className="day-paper-leaf" d="M201 169c-25-13-30 14-10 31 22 1 37-18 10-31z"/>
    <path className="day-paper-seam" d="m186 207 20-31m-11 17-7-11m10 6 13-1"/>
   </g>:null}
  </g>:null}
  {art.kind==='market'?<g data-material="market-records">
   <path className="day-paper-cover" d="m53 40 222 35-28 194-222-35z"/>
   <path className="day-paper-warm-sheet" d="m67 38 204 33-28 178-204-33z"/>
   <path className="day-paper-sheet" d="m81 36 190 40-34 161-190-40z"/>
   <path className="day-paper-ink" d="m99 77 133 28m-136-12 102 21m-106-4 131 27m-134-11 110 23"/>
   <path className="day-paper-tab" d="m48 102 24 5-9 43-24-5z"/>
   {art.state==='result'?<g data-material="execution-note">
    <path className="day-paper-kept" d="m170 175 110 14-8 54-110-14z"/>
    <path className="day-paper-ink" d="m181 192 84 11m-86 3 48 6m-50 7 84 10"/>
    <path className="day-paper-clip" d="m187 175 2-14c1-8 13-6 12 2l-2 14"/>
   </g>:<g data-material="reading-lens">
    <circle className="day-paper-lens" cx="222" cy="199" r="30"/>
    <circle className="day-paper-rim" cx="222" cy="199" r="35"/>
    <path className="day-paper-handle" d="m197 226-37 39"/>
   </g>}
  </g>:null}
  {art.state==='history'?<g data-material="archive-fold">
   <path className="day-paper-archive-under" d="m54 47 111 11-14 190-111-11z"/>
   <path className="day-paper-turned" d="m54 47 111 11-52 48-73 131z"/>
   <path className="day-paper-fold-edge" d="m165 58-52 48-73 131"/>
   <path className="day-paper-stitches" d="m61 80 12 1m-15 27 12 1m-15 27 12 1m-15 27 12 1m-15 27 12 1"/>
  </g>:art.state==='carry'?<g data-material="continuation-tab">
   <path className="day-paper-continuation" d="m238 114 55 8-21 143-19-16-23 10z"/>
   <path className="day-paper-fold-edge" d="m247 126 35 5-16 112"/>
   <path className="day-paper-perforation" d="m249 149 26 4m-30 24 26 4m-30 24 26 4"/>
  </g>:art.state==='ongoing'?<g data-material="open-page">
   <path className="day-paper-warm-sheet" d="m69 197 126 16-6 44-126-16z"/>
   <path className="day-paper-ink" d="m81 211 100 13m-102 0 78 10"/>
   <path className="day-paper-clip" d="m165 210 3-18c1-9 14-7 13 2l-3 18"/>
  </g>:<g data-material="kept-result-edge">
   <path className="day-paper-kept" d="m54 206 98 12-5 38-98-12z"/>
   <path className="day-paper-ink" d="m64 219 74 9m-76 2 48 6"/>
  </g>}
 </svg>
}
