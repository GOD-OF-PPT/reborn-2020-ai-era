import type {CourseEntryReading} from './course-entry-reading.ts'
import type {CourseEntryExtras} from './CourseEntryAction.tsx'
import './course-entry.css'

export function CourseEntryFacts({reading}:{reading:CourseEntryReading}){return <><p className="moment-line">{reading.line}</p><p className="moment-terms">{reading.caseLine}</p></>}
export function CourseEntryOptions({value}:{value:CourseEntryExtras}){return <><div className="course-entry-options">{value.reading.route!=='today'?<button type="button" className="course-entry-option" disabled={value.today.disabled} onClick={value.today.activate}>{value.today.label} ↗</button>:null}<button type="button" className="course-entry-details" disabled={value.details.disabled} onClick={value.details.activate}>{value.details.label} ↗</button></div>{value.clock?<div className="course-entry-clock">{value.clock}</div>:null}</>}
