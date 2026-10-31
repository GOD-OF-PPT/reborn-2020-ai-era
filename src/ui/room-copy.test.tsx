import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-36/chrome-normal-r1/n09-saved18-life-complete.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'

// Existing actual normal18 is read through the original controller. Fake IDB
// and SSR check presentation/side effects, not Chrome or human comprehension.
it('makes the ordinary post-opening day a short life/work choice while retaining actual resource terms and the unchanged save',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'ordinary-room-copy'}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 try{await controller.initialize();await controller.importNew(raw);const view=controller.snapshot.view!,request=vi.fn(),p:GamePanelProps={controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request},before=controller.exportSaved(),focus={runId:view.runId,kind:'free' as const,accountId:'personal',entityId:null}
  expect(p.features.workbench.quarter).not.toBe('2020-Q1');const html=renderToStaticMarkup(<OpeningMoment p={p} focus={focus} focusQuarter={p.features.workbench.quarter} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} feedback="已从本机存档继续。" onNavigate={vi.fn()} onExplore={vi.fn()}/>);
  expect(html).toContain('今天，想怎样过？');expect(html).toContain('歇几天');expect(html).toContain('今天的日历 歇几天');expect(html).not.toContain('今天的日历 走近这件事');expect(html).toContain('1点');expect(html).toContain('7天');expect(html).not.toContain('不必立刻接单或买股');expect(html).not.toContain('阅读与探索不消耗行动');expect(html).not.toContain('已从本机存档继续。');expect(request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
  expect(html).toContain('data-material="empty-calendar"');expect(html).not.toContain('first-attempt-v1.png')
 }finally{await controller.close();await store.close()}
})
