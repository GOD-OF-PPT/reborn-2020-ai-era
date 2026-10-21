import {expect,it} from 'vitest'
import {confirmationMoney} from './confirmation-money.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
const preview={allowed:true,reasonCodes:[],actionPoints:0,upfrontCostFen:0,releasedFen:0}
const command=(kind:string,payload:unknown):CommandEnvelope=>({runId:'display-case',actorId:'player',commandId:'display-case',expectedRevision:1,kind,payload})
it('shows actual owner capital when the rule correctly reports zero expense',()=>{
 const result=confirmationMoney(command('FundBusiness',{businessId:'company',amountFen:500000}),preview)
 expect(result.amountFen).toBe(500000);expect(result.label).toContain('不是费用')
})
it('does not silently replace missing transfer information with a zero cost',()=>{
 expect(confirmationMoney(command('OpenCourseStudio',{}),preview).amountFen).toBeNull()
})
it('keeps a scheduled first-order reservation distinct from already incurred cost',()=>{
 const result=confirmationMoney(command('StartFirstOrder',{}),{...preview,actionPoints:1,upfrontCostFen:50000})
 expect(result.amountFen).toBe(50000);expect(result.label).toContain('开工后')
})
it('a normal calendar advance labels only the instruction cost, with original dated costs reviewed separately',()=>{
 const result=confirmationMoney(command('AdvanceTime',{date:'2020-01-05'}),preview)
 expect(result.amountFen).toBe(0);expect(result.label).toContain('推进本身');expect(result.label).toContain('原费用')
})
it('keeps explicit zero follow-on participation visible as an investment decision',()=>{
 const result=confirmationMoney(command('FollowEquityRound',{agreementId:'position',amountFen:0}),preview)
 expect(result.amountFen).toBe(0);expect(result.label).toContain('投资本金')
})

it('separates a zero-new-cost stop from original earned service fees',()=>{const p={...preview,accruedServiceFeeFen:1333};expect(confirmationMoney(command('StopHengxingAuthority',{deploymentId:'old'}),p)).toMatchObject({amountFen:0});expect(confirmationMoney(command('StartRiskTask',{incidentId:'case',kind:'isolate'}),{...p,upfrontCostFen:41333})).toMatchObject({amountFen:40000})})
it('keeps the original zero refund operation fee separate from the student refund obligation',()=>{
 const result=confirmationMoney(command('RefundCourseLearners',{cohortId:'original-class',personIds:['original-person'],reason:'按原款退款'}),preview)
 expect(result).toEqual({label:'本次新增操作费用（学员退款另列）',amountFen:0})
})
