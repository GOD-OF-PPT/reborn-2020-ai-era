import {useState,type Ref,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {sceneSeason} from './scene-season.ts'
import {roomSpots,roomExplorationReading,type RoomSpot} from './room-exploration-reading.ts'
import './room-exploration.css'

type Props={p:GamePanelProps;headingRef:Ref<HTMLHeadingElement>;onNavigate:(screen:RoomSpot)=>void;onReturn:()=>void;onResponsibilities:()=>void;urgent:boolean;calendar:ReactNode}
const marks:Record<RoomSpot,string>={
 routes:'M4 5h24v16H4z M16 21v6 M9 27h14 M8 9h16 M8 13h10',
 quarter:'M8 29V3h17v26 M4 29h25 M21 17h.1 M11 7h9v5h-9z',
 memory:'M3 5l13 3 13-3v22l-13 3-13-3z M16 8v22 M7 11l5 1 M7 16l5 1 M20 12l5-1 M20 17l5-1',
 life:'M3 27V12 M3 22h26v7 M8 22v-8h9l3 3h9v5 M7 10h6v5H7z',
}

/** The room is explored through objects; each click keeps its original single navigation. */
export function RoomExploration({p,headingRef,onNavigate,onReturn,onResponsibilities,urgent,calendar}:Props){
 const [hovered,setHovered]=useState<RoomSpot|null>(null),[focused,setFocused]=useState<RoomSpot|null>(null)
 const inspected=hovered??focused,spot=roomSpots.find(s=>s.screen===inspected),reading=roomExplorationReading(p,inspected),season=sceneSeason(p.features.workbench.quarter)
 return <>
  {spot?<div className="room-attention" aria-hidden="true" style={{left:spot.x+'%',top:spot.y+'%'}}/>:null}
  <header className="room-chapter room-exploration-heading"><p className="eyebrow">{p.features.workbench.quarter} / 第{season.chapter??'—'}幕</p><h1 ref={headingRef} tabIndex={-1}>今天，想走哪边？</h1><p className="room-exploration-guide">点一件物品，或按 1—4。</p>{urgent?<button type="button" className="exploration-responsibility" onClick={onResponsibilities}>有件事，等你回应 ↗</button>:null}</header>
  <nav className="room-objects room-exploration-objects" aria-label="探索住处">{roomSpots.map(s=><button type="button" className="room-hotspot room-exploration-spot" key={s.screen} style={{left:s.x+'%',top:s.y+'%'}} aria-label={s.object+' · '+s.verb+' · '+s.preview} aria-keyshortcuts={s.key} aria-describedby={inspected===s.screen?'room-inspection-copy':undefined} data-inspected={inspected===s.screen?'true':'false'} onPointerEnter={()=>setHovered(s.screen)} onPointerLeave={()=>setHovered(null)} onFocus={()=>{setFocused(s.screen);setHovered(null)}} onBlur={()=>setFocused(null)} onClick={()=>onNavigate(s.screen)}>
   {!p.textOnly?<svg className="exploration-object-mark" viewBox="0 0 32 34" fill="none" aria-hidden="true"><path d={marks[s.screen]}/></svg>:null}
   <span className="exploration-object-label"><span className="exploration-object-name">{s.object}<kbd aria-hidden="true">{s.key}</kbd></span><strong>{s.verb}<span aria-hidden="true"> ↗</span></strong></span>
  </button>)}</nav>
  <footer className="room-narrative room-exploration-narrative" data-inspecting={inspected!==null?'true':'false'}><div id="room-inspection-copy" aria-live="polite"><span className="narrative-speaker">{reading.speaker}</span><p>{reading.line}</p><small>{reading.hint}</small></div><div className="room-next"><button type="button" className="primary room-explore-return" onClick={onReturn}>回到刚才在意的事 →</button>{calendar}</div></footer>
 </>
}
