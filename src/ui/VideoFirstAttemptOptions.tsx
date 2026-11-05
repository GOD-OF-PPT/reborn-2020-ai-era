import type {VideoFirstAttemptReading} from './video-first-attempt.ts'
import type {VideoFirstAttemptExtras} from './VideoFirstAttemptAction.tsx'
import {moneyText} from './game-text.ts'
import './video-first-attempt.css'

export function VideoFirstAttemptFacts({reading}:{reading:VideoFirstAttemptReading}){return <p className="moment-line">{reading.line}</p>}
export function VideoFirstAttemptOptions({value,room=false}:{value:VideoFirstAttemptExtras;room?:boolean}){
 const m=value.reading.marketing
 return <><button type="button" className={'video-attempt-option'+(room?' moment-decision':'')} disabled={value.marketing.disabled} onClick={value.marketing.activate}><b aria-hidden="true">02</b><span>{value.marketing.label}<small>{moneyText(m.costFen)} · {m.points}点 · {m.days}日；完成后才看实际询价。</small></span><i aria-hidden="true">↗</i></button>{value.marketing.reason?<small className="reason">{value.marketing.reason}</small>:null}<button type="button" className="scene-text-action video-attempt-more" disabled={value.overview.disabled} onClick={value.overview.activate}>{value.overview.label} ↗</button></>
}
