import {expect,it} from 'vitest'
import {endingSharePreview,type EndingFrame} from './ending-projection.ts'

it('shares only selected known fragments and requires a separate financial opt-in',()=>{
 const frame:EndingFrame={id:'known-fragment',date:'2025-12-31',title:'有限的回响',body:'这是已经发生的本局片段。',classification:'fictional',financial:false,sourceIds:['private-source-id']}
 const frames=[{...frame,seed:'private-seed',privateNotes:'private-note',facts:{hidden:'private-fact'},commandPayload:{secret:'private-command'},runId:'private-run-id',actorId:'private-actor-id'},{...frame,id:'money',title:'实际现金',body:'已核对的模拟现金。',financial:true}]
 const safe=endingSharePreview(frames,['known-fragment','money'],false)
 expect(safe.fragments).toHaveLength(1);expect(Object.keys(safe.fragments[0]!)).toEqual(['date','title','body','classification'])
 for(const secret of ['private-seed','private-note','private-fact','private-command','private-run-id','private-actor-id','private-source-id'])expect(JSON.stringify(safe)).not.toContain(secret)
 expect(endingSharePreview(frames,['known-fragment','money'],true).fragments).toHaveLength(2)
 expect(endingSharePreview(frames,[],true).fragments).toHaveLength(0)
 expect(endingSharePreview(frames,['unselected-unknown-id'],true).fragments).toHaveLength(0)
})
