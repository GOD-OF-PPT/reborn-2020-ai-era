import {beforeAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignCodec} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import {OpeningObject} from './OpeningObject.tsx'
import {RelayServicePaper,type RelayServicePaperState} from './RelayServicePaper.tsx'
import {relayPaperFor} from './relay-continuity.ts'
import working89 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n09-r4-saved89-support-actual-completion.json?raw'
import settled92 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n17-r4-saved92-all-current-due-collected-period-financial-closed.json?raw'
import future93 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n19-r4-saved93-future-quarter-33-audit-planned.json?raw'
import stopped95 from '../../goal-1/evidence/t17-acceptance-37/chrome-service-stop-r6/s05-saved95-zeroap-stopped-period-original-support-retained.json?raw'
import closed115 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r7/r7-23-reentered-new115-exact.json?raw'

type Input=Parameters<typeof relayPaperFor>[0]
const codec=createCampaignCodec()
function original(raw:string,from:string){
 const run=codec.import(raw),features=codec.registry.runtime!.project!(run) as unknown as Input['features'],v=features.relay!,period=v.periods.find(t=>t.from===from)!,business=v.businesses.find(b=>b.id===period.businessId)!,station=v.stations.find(s=>s.businessId===business.id)!,request=vi.fn()
 const p:Input={accountId:business.accountId,features,view:{...projectRun(run),busy:false,readOnly:false,hasCandidate:false,saveStatus:'saved'} as Input['view']},target={kind:'period' as const,runId:run.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id}
 return {run,p,target,period,request,raw}
}
type Fixture=ReturnType<typeof original>
let working:Fixture,settled:Fixture,future:Fixture,stopped:Fixture,closed:Fixture
beforeAll(()=>{working=original(working89,'2024-10-09')},20000)
beforeAll(()=>{settled=original(settled92,'2024-10-09')},20000)
beforeAll(()=>{future=original(future93,'2024-10-09')},20000)
beforeAll(()=>{stopped=original(stopped95,'2025-01-28')},20000)
beforeAll(()=>{closed=original(closed115,'2025-01-28')},20000)
function consumer(f:Fixture,art:RelayServicePaperState,protection?:'readonly'|'unsaved',textOnly=false){
 return renderToStaticMarkup(<OpeningObject kind="work" appearance="relay" title="同一原期" displayTitle="" detail="原记录" stageLabel="同一份服务" actionLabel="同一原动作" onActivate={f.request} disabled={!!protection} {...(protection?{protection}:{})} textOnly={textOnly} copyMode="tableau" relayPaper={art}/>)
}
function preservesFacts(html:string,art:RelayServicePaperState){
 for(const value of [art.heading,art.dateLabel,art.line,art.supportLabel,art.ticketLabel,art.scopeLabel,art.paymentLabel,art.protectedBalanceLabel,art.responsibility,...(art.responsibilities??[])])if(value)expect(html).toContain(value)
}
function untouched(f:Fixture){expect(codec.export(f.run)).toBe(f.raw);expect(f.request).not.toHaveBeenCalled()}

it('expands the real89 working folio without closing its outstanding original invoices or replacing the support state',()=>{
 const art=relayPaperFor(working.p,working.target)!,html=consumer(working,art)
 expect(art.composition).toEqual({kind:'working'});expect(art.support).toBe('completed');expect(art.paymentLabel).toContain('本期原单未收')
 expect(html).toContain('data-relay-composition="working"');expect(html).toContain('expanded-original-working-folio');expect(html).not.toContain('closed-original-folio-closed')
 preservesFacts(html,art);untouched(working)
})

it('stores real92 received leaves while keeping all33 unknown original meters open, including real93 commissioned future review',()=>{
 for(const f of [settled,future]){
  const art=relayPaperFor(f.p,f.target)!,html=consumer(f,art)
  expect(art.composition).toEqual({kind:'settled-unreviewed',unreviewedCount:33,retained:'received'})
  expect(html).toContain('stored-actual-received-leaf');expect(html).toContain('independent-unreviewed-original-leaf');expect(html).not.toContain('closed-original-folio-closed')
  expect(f.p.features.relay!.meters.filter(m=>m.periodId===f.period.id&&m.supplierId!==null&&m.auditedUnits===null)).toHaveLength(33)
  preservesFacts(html,art);untouched(f)
 }
 expect(relayPaperFor(settled.p,settled.target)).toMatchObject({phase:'result',state:'received'})
 const waiting=relayPaperFor(future.p,future.target)!
 expect(waiting).toMatchObject({phase:'audit',state:'planned'});expect(waiting.scopeLabel).toContain('2025-Q1开工季度（非本季）已预留1点 / ¥100')
})

it('folds the actual95 stopped request but leaves its original planned audit and support readable under readonly and a later unsaved candidate',()=>{
 const art=relayPaperFor(stopped.p,stopped.target)!
 expect(art.composition).toEqual({kind:'kept',reason:'stopped'});expect(art).toMatchObject({phase:'audit',state:'planned',support:'planned'})
 for(const protection of ['readonly','unsaved'] as const){
  const p={...stopped.p,view:{...stopped.p.view,readOnly:protection==='readonly',hasCandidate:protection==='unsaved',saveStatus:protection==='unsaved'?'unsaved' as const:'saved' as const}},same=relayPaperFor(p,stopped.target)!,html=consumer(stopped,same,protection)
  expect(same).toEqual(art);expect(html).toContain('closed-original-folio-stopped');expect(html).toContain('independent-retained-obligation-leaf');expect(html).toContain('data-protection="'+protection+'"')
  expect(html).toContain('原复核尚未完成');expect(html).toContain('2025-03-05—2025-03-08');expect(html).toContain('2025-02-25—2025-03-04');preservesFacts(html,art)
 }
 const plain=consumer(stopped,art,'unsaved',true);preservesFacts(plain,art);expect(plain).not.toMatch(/<svg\b|<img\b/)
 untouched(stopped)
})

it('closes the real115 stored period silhouette without inventing a new receipt, cash figure, action or hidden meter comparison',()=>{
 const art=relayPaperFor(closed.p,closed.target)!,html=consumer(closed,art),decoration=renderToStaticMarkup(<RelayServicePaper art={art}/>)
 expect(closed.period.status).toBe('closed');expect(closed.period.stoppedAt).toBeNull();expect(art.composition).toEqual({kind:'kept',reason:'closed'})
 expect(html).toContain('closed-original-folio-closed');expect(html).not.toContain('expanded-original-working-folio');expect(html).not.toContain('independent-unreviewed-original-leaf')
 expect(art.paymentLabel).not.toContain('本次收到');expect(decoration).not.toMatch(/<(?:text|foreignObject|button|script)\b|¥|收入|20\d{2}-\d{2}-\d{2}/)
 preservesFacts(html,art);untouched(closed)
})

it('does not label unknown, foreign or unpaid public records as settled-unreviewed, and never infers a stopped request from a line or an interrupted job',()=>{
 const {p,target,period}=settled,v=p.features.relay!,invoice=v.receivables.find(i=>i.sourceId===period.id||v.meters.some(m=>m.periodId===period.id&&m.id===i.sourceId))!
 const variants:Input[]=[
  {...p,features:{...p.features,relay:{...v,periods:v.periods.map(t=>t.id===period.id?{...t,status:'settling' as const}:t)}}},
  {...p,features:{...p.features,relay:{...v,receivables:v.receivables.map(i=>i.id===invoice.id?{...i,amountFen:i.amountFen+1}:i)}}},
  {...p,features:{...p.features,relay:{...v,receivables:v.receivables.map(i=>i.id===invoice.id?{...i,customerId:'another-station-customer'}:i)}}},
  {...p,features:{...p.features,relay:{...v,meters:[]}}},
  {...p,view:{...p.view,date:'2025-02-30' as Input['view']['date']}},
 ]
 for(const input of variants)expect(relayPaperFor(input,target)?.composition?.kind).not.toBe('settled-unreviewed')
 expect(relayPaperFor(p,{...target,runId:'another-life'})).toBeUndefined()
 const supplier=relayPaperFor(p,target,{kind:'supplier',recordId:period.supplierIds[0]!})!
 expect(supplier.ticket).toBe('supplier-asset');expect(supplier.composition).toBeUndefined()
 expect(renderToStaticMarkup(<RelayServicePaper art={supplier}/>)).not.toContain('independent-unreviewed-original-leaf')
 const stoppedRelay=stopped.p.features.relay!
 for(const stoppedAt of [null,'2025-01-29','2025-02-30','not-a-date']){
  const input={...stopped.p,features:{...stopped.p.features,relay:{...stoppedRelay,periods:stoppedRelay.periods.map(t=>t.id===stopped.period.id?{...t,stoppedAt}:t)}}},art=relayPaperFor(input,stopped.target)!
  expect(art.composition).not.toEqual({kind:'kept',reason:'stopped'});expect(art.line).not.toContain('本期请求已停止')
 }
 untouched(settled);untouched(stopped)
})
