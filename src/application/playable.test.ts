import { expect,it } from 'vitest'
import { playNormalInvestmentHalfYear } from '../testing/playable-scenarios.ts'
it('plays normal S01 through committed commands, keeping Q01 separate from the second quarter',async()=>{
 const result=await playNormalInvestmentHalfYear('technical_employee')
 expect(result.quarter).toMatchObject({cashFen:2700000,investmentValueFen:1100000,minimumCashFen:1100000,spent:4})
 expect(result.actual).toMatchObject({date:'2020-06-30',cashFen:3900000,quantity:100,quarterSpent:2,marketPoints:18,salaryPayments:6,worldAnchors:['H001']})
 expect(result.rejections).toEqual({noExtraAction:'INSUFFICIENT_ACTION_POINTS',noFutureCash:'INSUFFICIENT_AVAILABLE_FUNDS',noPastQuote:'NO_FUTURE_MATCHING_POINT'})
 expect(result.boundary).toEqual({newActionAtEnd:'allowed_preview',duplicateAtEnd:'duplicate'});expect(result.initial.origin).toBe('normal');expect(result.final.receipts.filter(r=>r.kind==='WorkQuarter')).toHaveLength(2)
},30000)
it('keeps the content-background investment salary independent through the same normal S01 path',async()=>{const result=await playNormalInvestmentHalfYear('content_employee');expect(result.quarter).toMatchObject({cashFen:2100000,investmentValueFen:1100000,minimumCashFen:1100000,spent:4});expect(result.actual).toMatchObject({date:'2020-06-30',cashFen:2700000,quantity:100,quarterSpent:2,salaryPayments:6});expect(result.initial.backgroundId).toBe('content_employee')},30000)
