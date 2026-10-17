import {beforeAll,expect,it} from 'vitest'
import {approvedRoutine} from '../testing/routine-scenarios.ts'
import {hashValue} from '../core/hash.ts'
let scenario:ReturnType<typeof approvedRoutine>,raw:string
beforeAll(()=>{scenario=approvedRoutine();scenario.input.steps=scenario.input.steps.slice(0,1);scenario.h.send('CreateRoutinePlan',scenario.input);const p=scenario.h.run.routines!.plans[0]!;scenario.h.send('ConfirmRoutinePlan',{planId:p.id});scenario.h.send('RunRoutineStep',{planId:p.id,stepId:p.steps[0]!.id});raw=scenario.h.codec.export(scenario.h.run)},60000)
it.each(['budget-expansion','new-action','false-completion','fake-run','plan-scope','duplicate-step','false-job'])('refuses a resigned inconsistent routine authorization: %s',variant=>{
 const value=JSON.parse(raw),p=value.state.routines.plans[0]
 if(variant==='budget-expansion')p.cashLimitFen++
 if(variant==='new-action')p.steps[0].kind='SubmitStockOrder'
 if(variant==='false-completion'){p.steps[0].status='pending';p.steps[0].executedAt=null;p.steps[0].executionCommandId=null}
 if(variant==='fake-run')p.runId='other-run'
 if(variant==='plan-scope')p.businessIds=[]
 if(variant==='duplicate-step')p.steps.push({...p.steps[0]})
 if(variant==='false-job')p.steps[0].createdJobIds=['no-job']
 const {checksum:_,...body}=value;value.checksum=hashValue(body);expect(()=>scenario.h.codec.import(JSON.stringify(value))).toThrow();expect(scenario.h.codec.export(scenario.h.codec.import(raw))).toBe(raw)
})
