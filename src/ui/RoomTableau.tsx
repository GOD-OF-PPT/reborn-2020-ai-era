import type {ReactNode} from 'react'
import './room-tableau.css'

export interface RoomTableauProps{
 scene:string
 state:string
 perspective?:string|undefined
 textOnly?:boolean|undefined
 intention?:ReactNode
 heading:ReactNode
 context?:ReactNode
 feedback?:ReactNode
 facts?:ReactNode
 decisions:ReactNode
 object:ReactNode
 record?:ReactNode
}

/** A composed room, with no second rule, action, or save-state owner. */
export function RoomTableau({scene,state,perspective,textOnly=false,intention,heading,context,feedback,facts,decisions,object,record}:RoomTableauProps){
 return <div className="room-tableau" data-scene={scene} data-state={state} data-perspective={perspective} data-text-only={textOnly?'true':'false'}>
  <div className="tableau-intention">{intention}</div>
  <section className={'room-current-moment opening-current-moment tableau-content'+(scene==='today'?' today-current-moment':'')} data-stage={state} data-focus-scope={perspective} data-day-view={scene==='today'?'today':undefined} aria-label={scene==='today'?'今天这一幕':'眼前这一幕'}>
   {heading}
   <div className="tableau-context">{context}</div>
   <div className="moment-story tableau-feedback" aria-label="这次真实留下的回响">{feedback}</div>
   <div className="moment-story tableau-facts" aria-label="眼前的情况与原责任">{facts}</div>
   <div className="moment-decisions">{decisions}</div>
   <aside className="tableau-foreground" aria-label="眼前物件与同对象原记录"><div className="opening-room-object tableau-object"><svg className="tableau-desk-support" viewBox="0 0 360 88" fill="none" aria-hidden="true" focusable="false">
    <ellipse className="tableau-tray-contact-outer" cx="178" cy="73" rx="165" ry="11"/>
    <ellipse className="tableau-tray-contact" cx="178" cy="69" rx="153" ry="8"/>
    <path className="tableau-tray-side" d="m28 10 298 8 14 41-2 11-325-10 1-11z"/>
    <path className="tableau-tray-top" d="m28 10 298 8 14 41-326-10z"/>
    <path className="tableau-tray-front" d="m14 49 326 10-2 11-325-10z"/>
    <path className="tableau-tray-rim" d="m28 10 298 8m-312 31 326 10M28 10 14 49m312-31 14 41"/>
    <path className="tableau-tray-grain" d="m48 29 242 7m-260 9 222 7"/>
   </svg>{object}</div>
   <div className="tableau-record">{record}</div></aside>
  </section>
 </div>
}
