import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {relayBusinessTarget,relayFocusFor} from './relay-player-thread.ts'
import {playerThread} from './player-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import actual94 from '../../goal-1/evidence/t17-acceptance-27/chrome-main-r1/main-saved94-period-ended.json?raw'

it('shows the actual r94 due collection sentence once while preserving customer 5, its full due scope and original support',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'relay-copy-actual94'})
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 try{
  await controller.initialize();await controller.importNew(actual94)
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,period=features.relay!.periods[0]!,identity=relayBusinessTarget({view,features},period.businessId)!
  expect(view.origin).toBe('normal');expect(view.revision).toBe(94);expect(view.date).toBe('2025-02-25');expect(view.budget).toMatchObject({available:1,reserved:0})
  expect(period.job?.status).toBe('completed');expect(period.supportJob?.status).toBe('running');expect(period.supportJob?.completeAt).toBe('2025-03-04')
  const p:GamePanelProps={view,features,controller,accountId:identity.accountId,request:vi.fn()},target={...identity,kind:'period' as const,periodId:period.id},focus=relayFocusFor(p,target),thread=playerThread(p,focus),raw=controller.exportSaved(),receipts=view.receipts
  const sentence='本期有原单到期；本次命令收取该客户全部到期原单¥897.78，可能包括其他账期。回款不重复确认收入。'
  expect(thread.stage).toBe('relay-collection');expect(thread.line).toBe(sentence);expect(thread.detail).toBe('')
  expect(thread.command).toMatchObject({kind:'CollectRelayDue',payload:{customerId:features.relay!.customers[4]!.id},confirm:true})
  expect(thread.inspect.target?.relayTarget).toEqual(target)
  const html=renderToStaticMarkup(<OpeningMoment p={p} headingRef={null} fallback={roomMoment(p)} focus={focus} onFocus={vi.fn()} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
  expect(html.split(sentence)).toHaveLength(2);expect(html).not.toContain('class="moment-terms"')
  expect(html).toContain('2025-01-28—2025-02-25的服务约定');expect(html).toContain('核对这位原客户全部到期原款');expect(html).toContain('尚待实际收取')
  expect(p.request).not.toHaveBeenCalled();expect(controller.snapshot.view!.revision).toBe(94);expect(controller.snapshot.view!.receipts).toBe(receipts);expect(controller.exportSaved()).toBe(raw)
 }finally{await controller.close()}
})
