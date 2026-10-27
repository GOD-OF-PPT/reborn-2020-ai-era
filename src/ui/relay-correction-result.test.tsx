import {beforeAll,expect,it} from 'vitest'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignCodec} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import type {GameRun} from '../core/run-types.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {relayResponseSceneResult} from './relay-response-result.ts'
import {SceneTimeNotice} from './SceneEcho.tsx'
import positive102 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n29-r4-saved102-33-audit-completed-known-difference.json?raw'
import positive103 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n32-r4-saved103-positive-single-correction-new-due.json?raw'
import negative101 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a03-saved101-before-negative-correction.json?raw'
import negative102 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a10-saved102-after-original-candidate-retry.json?raw'
import beforeBulk103 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a13-saved103-negative-supplier-credit-partial-return.json?raw'
import bulk104 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a15-saved104-rest-period-correction-for-old-responsibilities.json?raw'

type Frame={run:GameRun;view:PlayingView;features:PlayFeatures;raw:string}
const codec=createCampaignCodec()
const raws=[positive102,positive103,negative101,negative102,beforeBulk103,bulk104]
let frames:Frame[]
beforeAll(()=>{
 frames=raws.map(raw=>{
  const run=codec.import(raw),features=codec.registry.runtime!.project!(run) as unknown as PlayFeatures
  return {run,features,raw,view:{...projectRun(run),features:{...features},saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
 })
},20000)
const echo=(before:Frame,current:Frame,kind='CorrectRelayUsage')=>relayResponseSceneResult(kind,before.view,current.view)
const alter=(frame:Frame,update:(features:PlayFeatures)=>PlayFeatures):Frame=>{
 const features=update(frame.features)
 return {...frame,features,view:{...frame.view,features:{...features}}}
}

it('puts the actual consumed-money cash refund and restored supplier asset in the same visible first sentence after the original retry',()=>{
 const before=frames[2]!,after=frames[3]!,text=echo(before,after)!
 expect(after.view.revision).toBe(before.view.revision+1)
 expect(text.split('。')[0]).toContain('原多计款实际退客户¥6.06，尚欠¥0')
 expect(text.split('。')[0]).toContain('恢复供应未用资产¥2.02（尚未变现金）')
 expect(text).toContain('不是退回充值余额')
 expect(text).toContain('客户收入调整-¥6.06，供应成本调整-¥2.02')
 const business=after.features.relay!.businesses[0]!,old=before.features.relay!.businesses.find(b=>b.id===business.id)!
 expect(business.funds.cashFen-old.funds.cashFen).toBe(-606)
 expect(business.funds.prepaidLiabilityFen).toBe(old.funds.prepaidLiabilityFen)
 const visible=renderToStaticMarkup(createElement(SceneTimeNotice,{date:after.view.date,text,frame:null,onClose(){},accountName:id=>id,compact:true}))
 expect(visible).toContain('实际退客户¥6.06');expect(visible).toContain('供应未用资产¥2.02');expect(visible).not.toContain('这一张原票已按')
})

it('keeps a positive correction as its own dated receivable and supplier debt without pretending it is collected cash',()=>{
 const before=frames[0]!,after=frames[1]!,text=echo(before,after)!
 expect(text.split('。')[0]).toContain('新增原应收¥1.20，2025-01-18到期')
 expect(text.split('。')[0]).toContain('供应更正成本¥0.60，现金已付¥0、资产冲抵¥0、尚欠¥0.60')
 expect(text).toContain('2025-01-11')
 const business=after.features.relay!.businesses[0]!,old=before.features.relay!.businesses.find(b=>b.id===business.id)!
 expect(business.funds.cashFen).toBe(old.funds.cashFen)
 expect(after.view.budget).toEqual(before.view.budget)
 expect(text).not.toContain('实际退客户')
})

it('reports bulk cash refunds and new receivables separately instead of assigning their net income change to cash',()=>{
 const before=frames[4]!,after=frames[5]!,text=echo(before,after,'CorrectRelayPeriod')!
 const added=after.features.relay!.corrections.filter(c=>!before.features.relay!.corrections.some(old=>old.id===c.id))
 expect(added).toHaveLength(167)
 expect(added.reduce((n,c)=>n+c.customerDeltaFen,0)).toBe(-1212)
 expect(text).toContain('已按167条原计量追加更正记录')
 expect(text.split('。')[0]).toContain('原多计款实际退客户¥24.24，尚欠¥0')
 expect(text.split('。')[0]).toContain('新增原应收¥12.12，2025-03-21到期')
 expect(text.split('。')[0]).toContain('恢复供应未用资产¥8.08（尚未变现金）')
 expect(text.split('。')[0]).toContain('供应更正成本¥4.04')
 const business=after.features.relay!.businesses[0]!,old=before.features.relay!.businesses.find(b=>b.id===business.id)!
 expect(business.funds.cashFen-old.funds.cashFen).toBe(-2424)
 expect(text.split('。')[0]).not.toContain('实际退客户¥12.12')
})

it('never publishes the new cash or asset outcome from candidates, busy or readonly views, stale receipts, reentry or multiple commits',()=>{
 const before=frames[2]!,after=frames[3]!,last=after.view.receipts.at(-1)!
 for(const patch of [
  {hasCandidate:true},{busy:true},{readOnly:true},{saveStatus:'unsaved' as const},{saveStatus:'saving' as const},
  {runId:after.view.runId+'-other'}, {revision:after.view.revision+1},
  {receipts:[...after.view.receipts.slice(0,-1),{...last,kind:'ReadNews'}]},
  {receipts:[...after.view.receipts.slice(0,-1),{...last,revisionAfter:last.revisionAfter-1}]},
 ])expect(relayResponseSceneResult('CorrectRelayUsage',before.view,{...after.view,...patch})).toBeNull()
 expect(echo(after,after)).toBeNull()
 expect(relayResponseSceneResult('CorrectRelayUsage',null,after.view)).toBeNull()
})

it('keeps an unknown refund reference local while preserving the separately linked supplier effect and the public correction',()=>{
 const before=frames[2]!,after=frames[3]!,broken=alter(after,f=>{
  const relay=f.relay!,correction=relay.corrections[0]!,refund=relay.casebook!.operations.find(o=>correction.operationIds.includes(o.id)&&o.kind==='refund_delivered')!
  return {...f,relay:{...relay,casebook:{...relay.casebook!,transactions:relay.casebook!.transactions.filter(t=>t.id!==refund.id)}}}
 }),text=echo(before,broken)!
 expect(text.split('。')[0]).toContain('客户原款去向尚待核齐')
 expect(text.split('。')[0]).toContain('恢复供应未用资产¥2.02')
 expect(text).toContain('客户收入调整-¥6.06')
 expect(text).not.toContain('原多计款实际退客户¥0')
})

it('preserves every actual saved authority byte after the summary consumers and public-view counterexamples',()=>{
 for(const frame of frames)expect(codec.export(frame.run)).toBe(frame.raw)
})
