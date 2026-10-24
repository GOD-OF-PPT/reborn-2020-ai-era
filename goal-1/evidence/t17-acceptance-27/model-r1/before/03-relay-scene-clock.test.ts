import {expect,it} from 'vitest'
import {createCampaignRun,campaignRuntime,campaignOperations,campaignMarket,campaignRelay} from '../application/campaign.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {relaySceneProgress} from './relay-scene-progress.ts'
import {relaySceneAdvanceDate} from './relay-scene-clock.ts'

const initial=createCampaignRun({runId:'relay-clock-display',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'relay-clock-display'})
const base=projectWorkbench(initial,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog)
const w={...base,quarter:'2025-Q1',quarterStart:'2025-01-01',quarterEnd:'2025-03-31',progression:{...base.progression,nextDate:'2025-02-07',quarterTarget:'2025-03-31'}}
// Public display dates test the convenience policy, never an earned service or a new time rule.
const progress={...relaySceneProgress(projectRelay(initial,campaignRelay),'2025-02-06')!,phase:'service' as const,nextDate:'2025-02-25'}

it('offers a service or support feedback day while preserving original barriers, quarter entry and year limit',()=>{
 expect(relaySceneAdvanceDate(progress,w,'2025-02-06','2025-02-07')).toBe('2025-02-25')
 expect(relaySceneAdvanceDate(progress,{...w,progression:{...w.progression,quarterTarget:'2025-02-12'}},'2025-02-06','2025-02-07')).toBe('2025-02-12')
 expect(relaySceneAdvanceDate({...progress,nextDate:'2025-04-08'},{...w,atQuarterEnd:true,progression:{...w.progression,nextQuarterDate:'2025-04-01'}},'2025-03-31','2025-04-01')).toBe('2025-04-01')
 expect(relaySceneAdvanceDate({...progress,nextDate:'2026-01-03'},{...w,quarter:'2025-Q4',quarterStart:'2025-10-01',quarterEnd:'2025-12-31',progression:{...w.progression,quarterTarget:'2025-12-31'}},'2025-12-30','2025-12-31')).toBe('2025-12-31')
})

it('keeps original fallback for missing or same-day feedback and never bypasses a delivery decision',()=>{
 expect(relaySceneAdvanceDate(null,w,'2025-02-06','2025-02-07')).toBe('2025-02-07')
 expect(relaySceneAdvanceDate({...progress,nextDate:null},w,'2025-02-06','2025-02-07')).toBe('2025-02-07')
 for(const nextDate of ['2025-02-05','2025-02-06'])expect(relaySceneAdvanceDate({...progress,nextDate},w,'2025-02-06','2025-02-07')).toBe('2025-02-07')
 expect(relaySceneAdvanceDate(progress,w,'2025-02-06',null)).toBeNull()
 expect(relaySceneAdvanceDate(progress,{...w,progression:{...w.progression,requiresDelivery:true}},'2025-02-06','2025-02-07')).toBeNull()
})
