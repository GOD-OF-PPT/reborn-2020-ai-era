import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {createPublicRiskIncident,createPublicRiskInvestigation,createPublicRiskSceneFixture} from '../testing/public-risk-scene-fixture.ts'
import type {PlayFeatures} from './game-types.ts'
import {NarrativeScene} from './NarrativeScene.tsx'
import StoryPanel from './StoryPanel.tsx'
import {RiskLetter,riskPayers} from './RiskSceneChoice.tsx'
import {savedSceneResult} from './scene-result.ts'

it('keeps the viewed personal account separate from a real bound business and retains every letter identity',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'risk-scene-public-boundaries'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`risk-film-${++id}`})
 const noAction=()=>{throw Error('PUBLIC_RENDER_MUST_NOT_WRITE')}
 try{
  await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'risk-ui-public-only'})
  expect((await controller.submit(controller.prepare('OpenVideoChannel',{name:'实际账户边界',segment:'local_merchants'}))).status).toBe('saved')
  const view=controller.snapshot.view!,original=view.features as unknown as PlayFeatures,channel=original.video!.channels[0]!,before=controller.exportSaved()
  const c=createPublicRiskIncident({businessIds:[channel.businessId]}),features={...original,story:createPublicRiskSceneFixture([c])}
  const p={controller,view,features,request:noAction,accountId:'personal'}
  expect(riskPayers(p,c).map(a=>a.accountId)).toEqual([channel.accountId])
  expect(riskPayers(p,createPublicRiskIncident({businessIds:['missing-bound-business']}))).toEqual([])
  const scene={...p,screen:'story' as const,headingRef:null,personId:'tang-ying' as const,onPerson:noAction,onOpen:noAction,onPeople:noAction,onYear:noAction,onNavigate:noAction,receipt:null}
  const unknown=renderToStaticMarkup(<NarrativeScene {...scene}/>)
  expect(unknown).toContain('安排这封来信的独立核查');expect(unknown).not.toContain('核对回信并确认本次评估');expect(unknown).not.toContain('核对有限停止')
  const completed=createPublicRiskIncident({businessIds:[channel.businessId],stage:'investigating'},createPublicRiskInvestigation({status:'completed',result:'ordinary'}))
  const futureCalendar={...features.workbench,progression:{...features.workbench.progression,nextDate:'2025-04-12',quarterTarget:'2025-06-30'}}
  const ready={...features,workbench:futureCalendar,story:createPublicRiskSceneFixture([completed])},readyView={...view,date:'2025-04-11'}
  const readonly=renderToStaticMarkup(<NarrativeScene {...scene} features={ready} view={{...readyView,readOnly:true}}/>)
  expect(readonly.match(/<button[^>]*aria-label="核对回信并确认本次评估"[^>]*>/)?.[0]).toContain('disabled=""')
  const unsaved=renderToStaticMarkup(<NarrativeScene {...scene} features={ready} view={{...readyView,hasCandidate:true,saveStatus:'unsaved'}}/>)
  expect(unsaved.match(/<button[^>]*aria-label="核对回信并确认本次评估"[^>]*>/)?.[0]).toContain('disabled=""')
  const waiting={...features,workbench:futureCalendar,story:createPublicRiskSceneFixture([createPublicRiskIncident({stage:'investigating'},createPublicRiskInvestigation())])}
  const waitingHtml=renderToStaticMarkup(<NarrativeScene {...scene} features={waiting} view={{...view,date:'2025-04-09'}}/>)
  expect(waitingHtml).toContain('尚未完成，不提前下结论');expect(waitingHtml).not.toContain('核对回信并确认本次评估')
  const known=createPublicRiskIncident({businessIds:[channel.businessId],stage:'normal',verdict:'ordinary'},createPublicRiskInvestigation({status:'completed',result:'ordinary'}))
  const full=renderToStaticMarkup(<StoryPanel {...p} features={{...features,story:createPublicRiskSceneFixture([known])}}/>)
  expect(full).toContain('本次已核实 / 已完成范围的原记录（1）');expect(full).toContain('准备与历史');expect(full).toContain('代理支持')
  const six=createPublicRiskSceneFixture(Array.from({length:6},(_,i)=>createPublicRiskIncident({id:'letter-'+i,businessIds:[channel.businessId]})))
  for(const c of six.incidents){const html=renderToStaticMarkup(<RiskLetter p={{...p,features:{...features,story:six}}} incident={c} index={six.incidents.indexOf(c)} count={6} onNext={noAction}/>);expect(html).toContain('翻到下一封来信');expect(html).toContain(`${six.incidents.indexOf(c)+1} / 6`)}
  const jobs=createPublicRiskSceneFixture([]);jobs.jobs=[{...createPublicRiskInvestigation(),entityId:'public-case',actionId:'public-action',releasedAt:null}]
  // Public display fixture: a newly committed revision is required even when the facts differ.
  const resultView={...view,revision:view.revision+1,features:{...features,story:jobs}}
  expect(savedSceneResult('StartRiskTask','独立委托',view,resultView)).toContain('实际支付¥100、使用1点')
  expect(savedSceneResult('StartRiskTask','独立委托',view,{...resultView,revision:view.revision})).not.toContain('实际支付')
  expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
},20000)
