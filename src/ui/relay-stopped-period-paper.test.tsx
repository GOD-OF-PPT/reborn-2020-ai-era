import {beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignCodec} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import {relayPaperFor} from './relay-continuity.ts'
import {RelayServicePaperNotes} from './RelayServicePaper.tsx'
import {relaySceneProgress} from './relay-scene-progress.ts'
import {relayFocusFor,relayPlayerScene} from './relay-player-thread.ts'
import stopped95 from '../../goal-1/evidence/t17-acceptance-37/chrome-service-stop-r6/s05-saved95-zeroap-stopped-period-original-support-retained.json?raw'
import closing100 from '../../goal-1/evidence/t17-acceptance-37/chrome-support-interrupt-r6/i10-saved100-explicit-station-stop-old-protection-and-debt.json?raw'

type Input=Parameters<typeof relayPaperFor>[0]
const codec=createCampaignCodec()
function original(raw=stopped95){
 const run=codec.import(raw),features=codec.registry.runtime!.project!(run) as unknown as Input['features'],v=features.relay!,period=v.periods.find(t=>t.from==='2025-01-28'&&t.to==='2025-02-25')!,business=v.businesses.find(b=>b.id===period.businessId)!,station=v.stations.find(s=>s.businessId===business.id)!
 const p:Input={accountId:business.accountId,features,view:{...projectRun(run),busy:false,readOnly:false,hasCandidate:false,saveStatus:'saved'} as Input['view']},target={kind:'period' as const,runId:run.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id}
 return {run,p,target,period}
}
let f:ReturnType<typeof original>,closing:ReturnType<typeof original>
beforeAll(()=>{f=original();closing=original(closing100)},20000)

it('shows actual stopped requests while the same period still waits on its original future audit and independently reserved support',()=>{
 const {p,target,period}=f,art=relayPaperFor(p,target)!,html=renderToStaticMarkup(<RelayServicePaperNotes art={art}/>),v=p.features.relay!
 expect(period.stoppedAt).toBe('2025-01-28');expect(p.view.budget.available).toBe(0)
 expect(art).toMatchObject({phase:'audit',state:'planned',support:'planned',supportStatus:'planned'})
 expect(art.line).toBe('本期请求已停止 · 原复核尚未完成')
 expect(art.scopeLabel).toContain('2025-03-05—2025-03-08');expect(art.scopeLabel).toContain('已预留1点 / ¥100')
 expect(art.supportLabel).toContain('2025-02-25—2025-03-04');expect(html).toContain('本期请求已停止');expect(html).toContain('原复核尚未完成');expect(html).toContain('原支持')
 // Public display counterexamples leave the interrupted service job unchanged;
 // its status alone must never be called a saved StopRelayPeriod outcome.
 for(const stoppedAt of [null,'2025-01-29','2025-02-30','not-an-original-date']){
  const input:Input={...p,features:{...p.features,relay:{...v,periods:v.periods.map(t=>t.id===period.id?{...t,stoppedAt}:t)}}}
  const neutral=relayPaperFor(input,target)!
  expect(neutral.phase).toBe('audit');expect(neutral.state).toBe('planned');expect(neutral.line).not.toContain('本期请求已停止')
  expect(neutral.supportLabel).toBe(art.supportLabel)
 }
 expect(v.meters.every(m=>m.auditedUnits===null)).toBe(true);expect(codec.export(f.run)).toBe(stopped95)
})

it('keeps station closing and collection actionable without claiming an impossible or future request-stop date',()=>{
 const {p,target,period}=closing,v=p.features.relay!,context={runId:p.view.runId,accountId:p.accountId,operations:p.view.operations}
 const actual=relaySceneProgress(v,p.view.date,target,context)!
 expect(p.view.date).toBe('2025-03-05');expect(actual.phase).toBe('collection')
 expect(actual.title).toBe('本站收尾，原客户款仍待收取。')
 expect(actual.command?.kind).toBe('CollectRelayDue');expect(actual.line).toContain('本期后续请求已于2025-01-28停止')
 const scene=relayPlayerScene(p,relayFocusFor(p,target,p.accountId))
 expect(scene.line).toContain('本站已转入经营收尾');expect(scene.detail).toBe('')
 for(const stoppedAt of [null,'2025-03-06','2025-02-30','not-an-original-date']){
  const changed={...v,periods:v.periods.map(t=>t.id===period.id?{...t,stoppedAt}:t)},progress=relaySceneProgress(changed,p.view.date,target,context)!
  expect(progress.phase).toBe(actual.phase);expect(progress.command).toEqual(actual.command)
  expect(progress.title).toBe(actual.title);expect(progress.line).not.toContain('本期后续请求已于')
 }
 expect(codec.export(closing.run)).toBe(closing100)
})
