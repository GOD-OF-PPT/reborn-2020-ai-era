import {expect,it} from 'vitest'
import {relayPeriodGroups,ecoContractGroups} from './work-visibility.ts'
it('keeps a financially closed period visible when later independent evidence needs a correction',()=>{
 const periods=[{id:'closed-audit',status:'closed'},{id:'old-settled',status:'closed'},{id:'serving',status:'running'}]
 const meters=[{periodId:'closed-audit',reportedUnits:12,auditedUnits:9,correctionId:null}]
 const before=JSON.stringify({periods,meters}),group=relayPeriodGroups(periods,meters)
 expect(group.current.map(p=>p.id)).toEqual(['closed-audit','serving']);expect(group.archive.map(p=>p.id)).toEqual(['old-settled']);expect(group.pendingByPeriod.get('closed-audit')).toBe(1);expect(JSON.stringify({periods,meters})).toBe(before)
})
it('does not infer a hidden discrepancy before audit, including a reported zero',()=>{
 const hidden={periodId:'unknown',reportedUnits:0,auditedUnits:null,correctionId:null,hiddenActualUnits:99}
 const group=relayPeriodGroups([{id:'unknown',status:'closed'}],[hidden])
 expect(group.pendingByPeriod.size).toBe(0);expect(group.archive.map(p=>p.id)).toEqual(['unknown'])
})
it('archives corrected discrepancies and never treats matching audited zero as unfinished work',()=>{
 const group=relayPeriodGroups([{id:'corrected',status:'closed'},{id:'zero',status:'closed'}],[{periodId:'corrected',reportedUnits:10,auditedUnits:8,correctionId:'posted-original-reference'},{periodId:'zero',reportedUnits:0,auditedUnits:0,correctionId:null}])
 expect(group.current).toEqual([]);expect(group.archive).toHaveLength(2)
})
it('keeps another business audit out of the selected business attention queue',()=>{
 const group=relayPeriodGroups([{id:'this-business',status:'closed'}],[{periodId:'other-business',reportedUnits:10,auditedUnits:4,correctionId:null}])
 expect(group.pendingByPeriod.size).toBe(0);expect(group.current).toEqual([])
})
it('keeps completed credit and cancelled unpaid compensation in current contract work',()=>{
 const contracts=[{id:'delivered-credit',status:'completed',balance:{prepaidFen:0,receivableFen:180000}},{id:'cancelled-compensation',status:'cancelled',balance:{prepaidFen:0,receivableFen:0}},{id:'fully-settled',status:'completed',balance:{prepaidFen:0,receivableFen:0}}]
 const group=ecoContractGroups(contracts,[{contractId:'cancelled-compensation',remainingFen:60000}])
 expect(group.current.map(c=>c.id)).toEqual(['delivered-credit','cancelled-compensation']);expect(group.archive.map(c=>c.id)).toEqual(['fully-settled'])
})
it('does not call missing balances or an unreadable obligations account settled',()=>{
 expect(ecoContractGroups([{id:'unknown',status:'completed',balance:null}],[]).current).toHaveLength(1)
 expect(ecoContractGroups([{id:'unknown-account',status:'cancelled',balance:{prepaidFen:0,receivableFen:0}}],null).current).toHaveLength(1)
})
it('archives cancelled contracts only after their original obligation is actually paid',()=>{
 const contracts=[{id:'cancelled',status:'cancelled',balance:{prepaidFen:0,receivableFen:0}}]
 expect(ecoContractGroups(contracts,[{contractId:'cancelled',remainingFen:0}]).archive).toHaveLength(1)
})
