import { expect,it } from 'vitest'
import { createCampaignRun,createCampaignRegistry,createCampaignCodec } from './campaign.ts'
import { evaluateCommand,projectRun } from '../core/commands.ts'
import type { GameRun } from '../core/run-types.ts'
import { createOperationsFixture } from '../testing/operations-fixture.ts'

it.each([['technical_employee',4200000],['content_employee',3600000]])('settles actual monthly employment for %s after a single two-point quarterly commitment',(backgroundId,cashFen)=>{
 const registry=createCampaignRegistry();const codec=createCampaignCodec();let run=createCampaignRun({runId:`employment-${backgroundId}`,actorId:'player',commandId:'create',seed:'employment-seed',backgroundId})
 const apply=(state:GameRun,kind:string,payload:unknown)=>{const result=evaluateCommand(state,{runId:state.runId,actorId:'player',commandId:`c-${state.revision}`,expectedRevision:state.revision,kind,payload},registry,'player');if(result.status!=='proposed')throw new Error(JSON.stringify(result));return codec.import(codec.export(result.nextRun))}
 run=apply(run,'WorkQuarter',{})
 while(run.timeline.cursor.date!=='2020-03-31'||run.timeline.pause){if(run.timeline.pause?.reason==='CONTENT_DECISION_PENDING'){const instance=run.world?.instances.find(i=>i.openedBy===run.timeline.pause?.instanceId);run=apply(run,'ChooseEvent',{instanceId:instance?.id,choiceId:'defer'})}else run=apply(run,'AdvanceTime',{date:'2020-03-31'})}
 expect(projectRun(run).accounts[0]?.cashFen).toBe(cashFen);expect(projectRun(run).budget.spent).toBe(2);expect(run.operations?.payroll.filter(p=>p.kind==='salary')).toHaveLength(3)
})
it('prorates earned wages through resignation, resumes without refunding or recharging the quarterly commitment',()=>{
 const f=createOperationsFixture();let run=f.apply(f.run,'WorkQuarter',{});run=f.apply(run,'AdvanceTime',{date:'2020-01-15'});run=f.apply(run,'QuitWork',{});run=f.apply(run,'AdvanceTime',{date:'2020-01-20'});run=f.apply(run,'WorkQuarter',{});run=f.apply(run,'AdvanceTime',{date:'2020-01-31'})
 expect(run.operations?.payroll.find(p=>p.kind==='salary')?.amountFen).toBe(696774);expect(projectRun(run).budget.spent).toBe(2)
})
it('does not backdate employment after a payday has already passed',()=>{
 const f=createOperationsFixture();let run=f.apply(f.run,'AdvanceTime',{date:'2020-01-31'});run=f.apply(run,'WorkQuarter',{});run=f.apply(run,'AdvanceTime',{date:'2020-02-29'})
 expect(run.operations?.payroll.filter(p=>p.kind==='salary').map(p=>p.amountFen)).toEqual([800000]);expect(run.operations?.employment[0]?.segments[0]?.from).toBe('2020-02-01')
})
