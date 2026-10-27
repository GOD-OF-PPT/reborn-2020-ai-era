import {beforeAll,expect,it} from 'vitest'
import {createCampaignCodec} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import type {GameRun} from '../core/run-types.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {savedSceneResult} from './scene-result.ts'
import raw114 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a22-saved114-requote-accepted-before-effective.json?raw'
import raw115 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r7/r7-22-new115-quote-actually-effective-no-cash-ap-change.json?raw'

type Frame={run:GameRun;view:PlayingView;features:PlayFeatures;raw:string}
const codec=createCampaignCodec()
let before:Frame,after:Frame
function frame(raw:string):Frame{
 const run=codec.import(raw),data=codec.registry.runtime!.project!(run),features=data as unknown as PlayFeatures
 return {run,features,raw,view:{...projectRun(run),features:data,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
}
beforeAll(()=>{before=frame(raw114);after=frame(raw115)},20000)
const quote=(f:Frame)=>f.features.relay!.quotes.find(q=>q.effectiveAt==='2025-04-09')!
const result=(current=after.view,previous=before.view)=>savedSceneResult('AdvanceTime','等这份报价的生效日',previous,current)
function changed(update:(f:PlayFeatures)=>PlayFeatures):PlayingView{return {...after.view,features:{...update(after.features)}}}

it('answers the actual quote wait with its effective price while preserving cash, attention and the completed period frozen quotes',()=>{
 const q=quote(after),customer=after.features.relay!.customers.find(c=>c.id===q.customerIds[0])!,old=before.features.relay!.customers.find(c=>c.id===customer.id)!,text=result()
 expect(after.view.revision).toBe(before.view.revision+1);expect(before.view.date).toBe('2025-04-08');expect(after.view.date).toBe('2025-04-09')
 expect(old.activeTerms).toMatchObject({unitPriceFen:6,serviceFeeFen:50000})
 expect(customer.activeTerms).toMatchObject({sourceId:q.id,effectiveAt:'2025-04-09',unitPriceFen:5,serviceFeeFen:0})
 expect(text).toContain('与客户2谈妥的报价已于2025-04-09生效；后续用量价¥0.05，周期支持基准¥0。')
 expect(text).toContain('旧计量和本期支持仍按原报价核对');expect(text).toContain('下一期服务另行决定');expect(text).toContain('报价生效本身没有现金入账')
 expect(after.view.budget).toEqual(before.view.budget)
 for(const account of before.view.accounts){const current=after.view.accounts.find(a=>a.accountId===account.accountId)!
  for(const key of ['cashFen','availableFen','heldFen','prepaidLiabilityFen','receivableFen','payableFen','supplierPrepaidFen'] as const)expect(current[key]).toBe(account[key])
 }
 expect(after.features.relay!.periods.map(p=>p.feeQuotes)).toEqual(before.features.relay!.periods.map(p=>p.feeQuotes))
 expect(after.features.relay!.meters.map(m=>[m.id,m.unitPriceFen,m.unitCostFen,m.termsId,m.rateId])).toEqual(before.features.relay!.meters.map(m=>[m.id,m.unitPriceFen,m.unitCostFen,m.termsId,m.rateId]))
 expect(after.features.workbench.finance.map(f=>f.metrics)).toEqual(before.features.workbench.finance.map(f=>f.metrics))
 expect(codec.export(before.run)).toBe(raw114);expect(codec.export(after.run)).toBe(raw115)
})

it('does not announce effective terms from a candidate, readonly or busy frame, an unrelated receipt, or an interval of more than one save',()=>{
 const last=after.view.receipts.at(-1)!
 for(const patch of [{hasCandidate:true},{readOnly:true},{busy:true},{saveStatus:'unsaved' as const},{saveStatus:'saving' as const},{receipts:[...after.view.receipts.slice(0,-1),{...last,kind:'ReadNews'}]}])expect(result({...after.view,...patch})).not.toContain('谈妥的报价已于')
 expect(result(after.view,{...before.view,revision:before.view.revision-1})).not.toContain('谈妥的报价已于')
 expect(result(after.view,after.view)).not.toContain('谈妥的报价已于')
})

it('requires a unique completed accepted quote and matching current customer term source rather than the calendar alone',()=>{
 const q=quote(after),variants=[
  changed(f=>({...f,relay:{...f.relay!,quotes:f.relay!.quotes.map(row=>row.id===q.id?{...row,completedAt:null}:row)}})),
  changed(f=>({...f,relay:{...f.relay!,quotes:f.relay!.quotes.map(row=>row.id===q.id?{...row,responses:row.responses.map(r=>({...r,accepted:false}))}:row)}})),
  changed(f=>({...f,relay:{...f.relay!,quotes:[...f.relay!.quotes,q]}})),
  changed(f=>({...f,relay:{...f.relay!,quotes:f.relay!.quotes.map(row=>row.id===q.id?{...row,effectiveAt:'2025-02-30'}:row)}})),
  changed(f=>({...f,relay:{...f.relay!,customers:f.relay!.customers.map(c=>q.customerIds.includes(c.id)?{...c,activeTerms:{...c.activeTerms,sourceId:'another-quote'}}:c)}})),
  {...after.view,date:'2025-04-08'},
 ]
 for(const current of variants)expect(result(current)).not.toContain('谈妥的报价已于')
 expect(codec.export(before.run)).toBe(raw114);expect(codec.export(after.run)).toBe(raw115)
})
