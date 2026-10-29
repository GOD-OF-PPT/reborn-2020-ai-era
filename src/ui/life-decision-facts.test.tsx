import {afterAll,beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/equity-shared-closure-r221/normal75-input.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {captureLifeDecision,LifeDecisionFacts} from './LifeDecisionFacts.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import type {PlayFeatures} from './game-types.ts'

// Original normal source/preview, fake IDB and SSR; no browser or human claim.
let controller:GameController,store:IndexedDbRunStore
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'life-captured-costs'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw)})
afterAll(async()=>{await controller?.close();await store?.close()})
it('captures the actual personal cost, point and seven-day window for both ordinary choices without starting or paying',()=>{
 const before=controller.exportSaved(),view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures
 for(const kind of ['rest','workspace'] as const){const command=controller.prepare('StartLifeWork',{kind,personId:null,reference:null}),preview=controller.preview(command);expect(preview.allowed).toBe(true);const value=captureLifeDecision(command,preview,view,features)!;expect(value).toMatchObject({kind,startAt:'2025-01-20',completeAt:'2025-01-27',costFen:kind==='rest'?0:300000,points:1});const html=renderToStaticMarkup(<LifeDecisionFacts value={value}/>);expect(html).toContain('最早完成');expect(html).toContain('2025-01-27');expect(html).toContain(kind==='rest'?'¥0':'¥3,000');expect(html).toContain('1点')}
 expect(controller.exportSaved()).toBe(before)
})
it('keeps the complete original personal scope and responsibility readable inside the same captured confirmation',()=>{
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,command=controller.prepare('StartLifeWork',{kind:'rest',personId:null,reference:null}),preview=controller.preview(command),html=renderToStaticMarkup(<CommandDetails command={command} confirm={preview} features={features} view={view} accountName={()=> '个人账户'} clock={null}/>);expect(html).toContain('life-original-confirmation');expect(html).toContain('展开这份安排的完整说明');expect(html).toContain('企业或客户保护款');expect(html).toContain('休整不返AP')
})
it('does not summarize foreign, stale, readonly, candidate, mismatched cash, nonordinary or uncertain input as a valid cheap arrangement',()=>{
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,command=controller.prepare('StartLifeWork',{kind:'rest',personId:null,reference:null}),preview=controller.preview(command)
 expect(captureLifeDecision({...command,runId:'another-life'},preview,view,features)).toBeNull();expect(captureLifeDecision({...command,expectedRevision:view.revision-1},preview,view,features)).toBeNull();expect(captureLifeDecision(command,preview,{...view,readOnly:true},features)).toBeNull();expect(captureLifeDecision(command,preview,{...view,hasCandidate:true},features)).toBeNull();expect(captureLifeDecision(command,preview,{...view,accounts:[...view.accounts,view.accounts[0]!]},features)).toBeNull();expect(captureLifeDecision(command,preview,view,{...features,life:{...features.life,personalAvailableFen:features.life.personalAvailableFen+1}})).toBeNull();expect(captureLifeDecision({...command,payload:{kind:'rest',personId:'another-person',reference:null}},preview,view,features)).toBeNull();expect(captureLifeDecision({...command,payload:{kind:'portfolio',personId:null,reference:null}},preview,view,features)).toBeNull();expect(captureLifeDecision(command,{...preview,upfrontCostFen:1},view,features)).toBeNull()
})
