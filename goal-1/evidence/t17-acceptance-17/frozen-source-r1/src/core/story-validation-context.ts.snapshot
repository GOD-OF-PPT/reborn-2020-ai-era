import type {GameRun} from './run-types.ts'
import type {RunOperation} from './content-types.ts'
import type {ScheduledEvent} from './timeline.ts'
export type StoryValidationEvent=ScheduledEvent<RunOperation>&{processed?:boolean;skippedReason?:string}
/** One invocation only: never reuse validation across mutable runs or skip a rule check. */
export function storyValidationContext(run:GameRun){
 const related=(e:ScheduledEvent<RunOperation>)=>e.payload.kind==='story_event'||e.instanceId.startsWith('story:')
 const events:StoryValidationEvent[]=[...run.timeline.pending.filter(related),...run.timeline.receipts.map(r=>({...JSON.parse(r.signature),processed:true,skippedReason:r.skippedReason}) as StoryValidationEvent).filter(related)]
 let economics:Map<string,ReturnType<typeof JSON.parse>>|null=null,financial:Map<string,ReturnType<typeof JSON.parse>>|null=null
 return {events,get economics(){return economics??=new Map(run.economy.receipts.map(r=>[r.id,JSON.parse(r.signature)]))},get financial(){return financial??=new Map(run.economy.ledger.receipts.map(r=>[r.id,JSON.parse(r.signature)]))}}
}
export type StoryValidationContext=ReturnType<typeof storyValidationContext>
