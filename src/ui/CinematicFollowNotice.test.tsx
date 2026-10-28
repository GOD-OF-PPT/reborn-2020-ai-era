import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/follow-native-r153/saved121-public-round-undecided.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {CinematicRoom} from './CinematicRoom.tsx'
import {equityFocusFor} from './equity-player-thread.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
let controller:GameController,store:IndexedDbRunStore
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-follow-letter'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw)})
afterAll(async()=>{await controller?.close();await store?.close()})
const p=():GamePanelProps=>{const view=controller.snapshot.view!;return{controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn()}}
function room(props:GamePanelProps,focus:OpeningFocus){return renderToStaticMarkup(<CinematicRoom {...props} headingRef={null} notice={null} openingFocus={focus} onNavigate={vi.fn()} onPeople={vi.fn()} onYear={vi.fn()} onOpeningFocus={vi.fn()}/>)}

it('keeps the real work focus while presenting one readable financing letter as another explicit choice',()=>{
 const props=p(),period=props.features.workbench.employment.filter(e=>e.quarter===props.features.workbench.quarter);expect(period).toHaveLength(1)
 const focus:OpeningFocus={runId:props.view.runId,kind:'work',accountId:'personal',entityId:period[0]!.id},before=controller.exportSaved(),html=room(props,focus)
 expect(html).toContain('工资收到过，日子仍在继续');expect(html).toContain('翻开这封融资来信');expect(html).toContain('equity-financing-letter-v1.png');expect(html).toContain('2025-09-15')
 expect(html.match(/class="equity-follow-notice/g)).toHaveLength(1);expect(props.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
})

it('uses the same material on the selected holding without duplicating a separate notice or implying payment',()=>{
 const props=p(),a=props.features.deepseek!.agreements[0]!,target={runId:props.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'agreement' as const,recordId:a.id},before=controller.exportSaved(),html=room(props,equityFocusFor(props,target))
 expect(html).toContain('愿不愿再留一笔钱');expect(html).toContain('equity-financing-letter-v1.png');expect(html).toContain('本轮选择至2025-09-15');expect(html).toContain('2027-04-15')
 expect(html).not.toContain('class="equity-follow-notice');expect(controller.exportSaved()).toBe(before)
})
