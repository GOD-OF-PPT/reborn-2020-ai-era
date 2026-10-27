import {beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignCodec} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import {relayPaperFor} from './relay-continuity.ts'
import {RelayServicePaperNotes} from './RelayServicePaper.tsx'
import {moneyText} from './game-text.ts'
import {relayCorrectionEffects} from './relay-correction-effects.ts'
import original101 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a03-saved101-before-negative-correction.json?raw'
import negative102 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a10-saved102-after-original-candidate-retry.json?raw'
import returned103 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a13-saved103-negative-supplier-credit-partial-return.json?raw'
import positive103 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n32-r4-saved103-positive-single-correction-new-due.json?raw'

type Input=Parameters<typeof relayPaperFor>[0]
const codec=createCampaignCodec()
function original(raw:string,corrected=true){
 const run=codec.import(raw),features=codec.registry.runtime!.project!(run) as unknown as Input['features'],relay=features.relay!,correction=corrected?relay.corrections[0]!:null,meter=relay.meters.find(m=>m.id===(correction?.meterId??'rly:74f69ecae52761965ccc78dd565ad1c1'))!,period=relay.periods.find(t=>t.id===meter.periodId)!,business=relay.businesses.find(b=>b.id===period.businessId)!,station=relay.stations.find(s=>s.businessId===business.id)!
 const p:Input={accountId:business.accountId,features,view:{...projectRun(run),busy:false,readOnly:false,hasCandidate:false,saveStatus:'saved'} as Input['view']},target={kind:'period' as const,runId:run.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id,meterId:meter.id}
 return {run,p,target,correction,meter,period,raw}
}
type Fixture=ReturnType<typeof original>
let old:Fixture,negative:Fixture,later:Fixture,positive:Fixture
// This one setup has an explicit 20s import budget. Every case retains the default 5s gate.
beforeAll(()=>{old=original(original101,false);negative=original(negative102);later=original(returned103);positive=original(positive103)},20000)
function paper(f:Fixture,p:Input=f.p){return relayPaperFor(p,f.target,{kind:'correction',recordId:f.correction!.id})!}
const markup=(art:NonNullable<ReturnType<typeof relayPaperFor>>)=>renderToStaticMarkup(<RelayServicePaperNotes art={art}/>)
const effectText=(art:NonNullable<ReturnType<typeof relayPaperFor>>)=>(art.responsibilities??[]).join('；')

it('prints the saved negative correction cash refund and restored supplier asset beside the unchanged original report and adjustment',()=>{
 const art=paper(negative),html=markup(art),effects=relayCorrectionEffects(negative.p,negative.target,negative.correction!.id)
 expect(effects.status).toBe('known');expect(art).toMatchObject({phase:'audit',state:'corrected',ticket:'correction',paymentNature:'correction'})
 expect(art.line).toContain('原报告 1112');expect(art.line).toContain('原已核实计 1011')
 expect(art.paymentLabel).toContain('客户收入调整 '+moneyText(-606));expect(art.paymentLabel).toContain('供应成本调整 '+moneyText(-202))
 expect(effectText(art)).toMatch(/累计实际退[^；]*6\.06/);expect(effectText(art)).toMatch(/恢复[^；]*2\.02/)
 expect(html).toMatch(/累计实际退[^；]*6\.06/);expect(html).toMatch(/恢复[^；]*2\.02/);expect(html).toContain('尚欠')
 expect(negative.p.features.relay!.businesses.find(b=>b.id===negative.target.businessId)!.funds.prepaidLiabilityFen).toBe(717578)
 expect(codec.export(negative.run)).toBe(negative102)
})

it('keeps the historical 2.02 restoration distinct from the later pool remaining 1.01 and does not re-publish the correction as a current cash result',()=>{
 const art=paper(later),html=markup(art),option=later.p.features.relay!.supplyOptions.find(o=>o.businessId===later.target.businessId&&o.supplierId===later.meter.supplierId)!
 expect(option.credit!.remainingFen).toBe(101);expect(effectText(art)).toMatch(/恢复[^；]*2\.02/)
 expect(effectText(art)).toMatch(/当前[^；]*1\.01/);expect(effectText(art)).not.toMatch(/恢复[^；]*1\.01/)
 expect(art.state).toBe('corrected');expect(art.ticket).toBe('correction');expect(html).toMatch(/恢复[^；]*2\.02/);expect(html).toMatch(/当前[^；]*1\.01/);expect(html).not.toContain('本次取回原供应资产')
 expect(codec.export(later.run)).toBe(returned103)
})

it('keeps each known side visible when only the other original operation chain is unavailable, and retains the adjustment even when both are unknown',()=>{
 const {p,target,correction}=negative,v=p.features.relay!,book=v.casebook!,customerIds=book.operations.filter(o=>correction!.operationIds.includes(o.id)&&o.kind==='refund_delivered').map(o=>o.id),supplierIds=book.operations.filter(o=>correction!.operationIds.includes(o.id)&&o.kind==='reverse_supplier_usage').map(o=>o.id)
 // Explicit public-view counterexamples test attribution only; never imported or saved as normal history.
 const customerUnknown:Input={...p,features:{...p.features,relay:{...v,casebook:{...book,transactions:book.transactions.map(t=>customerIds.includes(t.id)?{...t,referenceId:'another-original-refund-debt'}:t)}}}},supplierUnknown:Input={...p,features:{...p.features,relay:{...v,casebook:{...book,operations:book.operations.map(o=>supplierIds.includes(o.id)?{...o,referenceId:'another-original-supplier-cost'}:o)}}}}
 const customerMissing:Input={...p,features:{...p.features,relay:{...v,casebook:{...book,operations:book.operations.filter(o=>!customerIds.includes(o.id))}}}},supplierMissing:Input={...p,features:{...p.features,relay:{...v,casebook:{...book,operations:book.operations.filter(o=>!supplierIds.includes(o.id))}}}}
 const a=relayCorrectionEffects(customerUnknown,target,correction!.id),b=relayCorrectionEffects(supplierUnknown,target,correction!.id)
 expect(a.customer.status).toBe('unavailable');expect(a.supplier.status).toBe('known');expect(b.customer.status).toBe('known');expect(b.supplier.status).toBe('unavailable')
 expect(effectText(paper(negative,customerUnknown))).toMatch(/恢复[^；]*2\.02/)
 expect(effectText(paper(negative,supplierUnknown))).toMatch(/累计实际退[^；]*6\.06/)
 expect(markup(paper(negative,customerUnknown))).toMatch(/恢复[^；]*2\.02/);expect(markup(paper(negative,supplierUnknown))).toMatch(/累计实际退[^；]*6\.06/)
 for(const input of [customerMissing,supplierMissing]){const effects=relayCorrectionEffects(input,target,correction!.id);expect(effects.status).toBe('partial');expect(markup(paper(negative,input))).toMatch(input===customerMissing?/恢复[^；]*2\.02/:/累计实际退[^；]*6\.06/)}
 const unavailable:Input={...p,features:{...p.features,relay:{...v,casebook:{...book,status:'unavailable',reason:'Explicit unavailable history display counterexample'}}}}
 for(const input of [customerUnknown,supplierUnknown,customerMissing,supplierMissing,unavailable]){
  const art=paper(negative,input);expect(art.paymentLabel).toContain(moneyText(-606));expect(art.paymentLabel).toContain(moneyText(-202));expect(art.line).toContain('原报告 1112')
  expect(effectText(art)).toMatch(/不可核|无法核|未[^；]*核齐|待核|尚未取得|不完整/);expect(markup(art)).toContain('1112')
 }
 expect(codec.export(negative.run)).toBe(negative102)
})

it('publishes positive original new receivable and supplier due dates without turning their adjustments into cash received',()=>{
 const art=paper(positive),html=markup(art),effects=relayCorrectionEffects(positive.p,positive.target,positive.correction!.id)
 expect(effects.status).toBe('known');expect(art.line).toContain('原报告 136');expect(art.line).toContain('原已核实计 151')
 expect(art.paymentLabel).toContain('客户收入调整 '+moneyText(120));expect(art.paymentLabel).toContain('供应成本调整 '+moneyText(60))
 expect(effectText(art)).toContain('2025-01-18');expect(effectText(art)).toContain('2025-01-11');expect(html).toContain('应收');expect(html).toContain('2025-01-11到期');expect(html).toContain('当前尚欠 '+moneyText(60));expect(html).toContain('新增供应成本 '+moneyText(60));expect(html).toContain('2025-01-18');expect(html).toContain('2025-01-11')
 expect(art.state).toBe('corrected');expect(art.paymentNature).toBe('correction');expect(html).not.toContain('本次实际收取')
 expect(codec.export(positive.run)).toBe(positive103)
})

it('keeps the old committed paper during a candidate and preserves saved effects under later candidate or readonly overlays without requiring a new matching receipt',()=>{
 const correctionId=negative.correction!.id,oldProtected:Input={...old.p,view:{...old.p.view,hasCandidate:true,saveStatus:'unsaved'}},oldArt=relayPaperFor(oldProtected,old.target)!
 expect(relayPaperFor(oldProtected,old.target,{kind:'correction',recordId:correctionId})).toBeUndefined()
 expect(oldArt.state).toBe('reviewed');expect(markup(oldArt)).not.toContain('累计实际退');expect(markup(oldArt)).not.toContain('恢复')
 const savedArt=paper(negative),savedHtml=markup(savedArt),candidate:Input={...negative.p,view:{...negative.p.view,hasCandidate:true,saveStatus:'unsaved'}},readonly:Input={...negative.p,view:{...negative.p.view,readOnly:true,saveStatus:'read_only'}},foreignReceipt:Input={...negative.p,view:{...negative.p.view,receipts:negative.p.view.receipts.map((r,i)=>i===negative.p.view.receipts.length-1?{...r,commandId:'different-current-command'}:r)}}
 for(const input of [candidate,readonly,foreignReceipt])expect(markup(paper(negative,input))).toBe(savedHtml)
 expect(codec.export(old.run)).toBe(original101);expect(codec.export(negative.run)).toBe(negative102)
})
