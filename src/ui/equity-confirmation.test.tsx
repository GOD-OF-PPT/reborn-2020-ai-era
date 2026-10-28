import {afterAll,beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t16-epilogue/native-exit-prefix/normal-before-exit-accept.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import type {PlayFeatures} from './game-types.ts'
import type {ComponentProps} from 'react'

type Facts=ComponentProps<typeof EquityDecisionFacts>
let controller:GameController,store:IndexedDbRunStore,sale:Facts,collection:Facts
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-equity-confirmation-facts'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await controller.initialize();await controller.importNew(raw)
 const capture=(kind:string,payload:unknown):Facts=>{const view=controller.snapshot.view!,command=controller.prepare(kind,payload);return {view,features:view.features as unknown as PlayFeatures,command,preview:controller.preview(command),accountName:id=>id==='personal'?'个人账户':'原企业账户'}}
 const v=controller.snapshot.view!.features as unknown as PlayFeatures,quotes=v.deepseek!.exits.filter(e=>e.buyerWilling===true&&e.operationId===null&&!e.quoteExpired);expect(quotes).toHaveLength(1)
 sale=capture('AcceptEquityExit',{exitId:quotes[0]!.id,shares:1000});expect(sale.preview.allowed).toBe(true)
 expect((await controller.submit(sale.command)).status).toBe('saved')
 const next=(controller.snapshot.view!.features as unknown as PlayFeatures).journey!.nextTailDate!
 expect((await controller.submit(controller.prepare('AdvanceEpilogueTime',{date:next}))).status).toBe('saved')
 collection=capture('CollectEquityExit',{exitId:quotes[0]!.id,amountFen:344835});expect(collection.preview.allowed).toBe(true)
})
afterAll(async()=>{if(controller)await controller.close();if(store)await store.close()})
const html=(facts:Facts)=>renderToStaticMarkup(<EquityDecisionFacts {...facts}/>)

it('reads the original sale preview including cumulative fees and receivable instead of presenting an immediate cash0 card',()=>{
 const before=controller.exportSaved(),text=html(sale)
 expect(sale.view.revision).toBe(142);expect(controller.snapshot.view!.revision).toBe(144)
 expect(text).toContain('1000模拟股');expect(text).toContain('¥7,110');expect(text).toContain('¥213.30');expect(text).toContain('¥6,896.70')
 expect(text).toContain('2027-07-15');expect(text).toContain('未转的1500股');expect(text).toContain('现金不增加')
 expect(text).toContain('2027-07-08');expect(text).toContain('本次使用0点');expect(controller.exportSaved()).toBe(before)
 const firstParagraph=text.match(/<p[^>]*>[\s\S]*?<\/p>/)?.[0]??''
 expect(firstParagraph).toContain('最早收款2027-07-15');expect(firstParagraph).toContain('确认后余1500股');expect(firstParagraph).toContain('现金暂不增加')
})

it('states the explicit original collection and remaining credit while keeping cash collection separate from income',()=>{
 const before=controller.exportSaved(),text=html(collection)
 expect(text).toContain('本次实际收取现金');expect(text.match(/¥3,448\.35/g)).toHaveLength(2)
 expect(text).toContain('本笔原未收¥6,896.70');expect(text).toContain('原先已收¥0');expect(text).toContain('收后仍待收取')
 expect(text).toContain('不重复确认投资收益');expect(text).toContain('确认保存后才增加本次现金');expect(controller.exportSaved()).toBe(before)
})

it('keeps unknown, stale and ambiguous original identities explicit without publishing another quote or an invented zero',()=>{
 const v=collection.features.deepseek!,exitId=(collection.command.payload as {exitId:string}).exitId,original=v.exits.find(e=>e.id===exitId)!
 const cases:Facts[]=[
  {...collection,view:{...collection.view,runId:'another-life'}},
  {...collection,view:{...collection.view,revision:collection.view.revision-1}},
  {...collection,command:{...collection.command,payload:{exitId:'missing-original',amountFen:344835}}},
  {...collection,features:{deepseek:{...v,exits:[...v.exits,original]}}},
  {...collection,view:{...collection.view,accounts:collection.view.accounts.filter(a=>a.accountId!=='personal')}},
 ]
 for(const facts of cases){const text=html(facts);expect(text).toContain('请返回这份原记录重新核对');expect(text).not.toContain('¥0');expect(text).not.toContain('¥3,448.35')}
})
