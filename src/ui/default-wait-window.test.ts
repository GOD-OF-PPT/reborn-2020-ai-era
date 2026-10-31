import {beforeAll,expect,it} from 'vitest'
import {createCampaignCodec} from '../application/campaign.ts'
import type {WorkbenchProjection} from '../application/workbench-projection.ts'
import {defaultWaitDate,defaultWaitLabel} from './default-wait-window.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import raw19 from '../../goal-1/evidence/t17-acceptance-39/public-wait-model-r1/reconstructed-original19.json?raw'

let workbench:WorkbenchProjection,date:string
beforeAll(()=>{const codec=createCampaignCodec(),run=codec.import(raw19);workbench=codec.registry.runtime!.project!(run).workbench as WorkbenchProjection;date=run.timeline.cursor.date})
it('uses the actual known rest deadline as an upper bound while the legacy direct path keeps its original earlier date',()=>{
 const before=JSON.stringify(workbench)
 expect(defaultWaitDate(workbench,false)).toBe('2020-04-10')
 expect(defaultWaitDate(workbench,true)).toBe('2020-04-11')
 expect(defaultWaitLabel(workbench,true)).toBe('等下一次反馈（最迟）')
 expect(defaultWaitLabel(workbench,false)).toBe('让日子向前')
 expect(JSON.stringify(workbench)).toBe(before)
})
it('does not turn the date selector into authority to cross an original delivery barrier',()=>{
 // Isolated public reason, not a new normal save or permission.
 const blocked={...workbench,progression:{...workbench.progression,requiresDelivery:true}}
 const limit=defaultWaitDate(blocked,true)
 expect(()=>playableAdvanceDate(blocked,date,limit)).toThrow('DELIVERY_DECISION_PENDING')
})
