import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/equity-season-repair-r177/original128-native-quarter-input.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {seasonRecollection} from './season-thread.ts'
import {SeasonRecollection} from './SeasonRecollection.tsx'
import {moneyText} from './game-text.ts'
import {seasonMeaning} from './scene-meaning.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'

// Original actual normal128; model/SSR checks do not replace its Chrome record.
let controller:GameController,store:IndexedDbRunStore
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-quarter-equity'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw)})
afterAll(async()=>{await controller?.close();await store?.close()})
const p=():GamePanelProps=>{const view=controller.snapshot.view!;return{controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn()}}

it('keeps the actual partial follow alongside original work and life in Q3, with the same agreement and round sources',()=>{
 const props=p(),before=controller.exportSaved(),a=props.features.deepseek!.agreements[0]!,quarter=seasonRecollection(props,'2025-Q3')!,node=quarter.allNodes.find(n=>n.id.startsWith('equity-follow:'))!
 expect(node).toBeDefined();expect(node.date).toBe('2025-09-01');expect(node.line).toContain(moneyText(249600));expect(node.line).toContain('新增312模拟股');expect(node.line).toContain('1562500');expect(node.line).toContain('不是现金收入')
 expect(node.inspect.target).toMatchObject({accountId:'personal',deepseekPane:'equity',openRecord:true,equityTarget:{runId:props.view.runId,businessId:a.businessId,kind:'agreement',recordId:a.id}})
 expect(node.sourceRefs.some(ref=>ref.kind==='round'&&props.features.deepseek!.rounds.some(r=>r.id===ref.id&&r.playerMoneyFen===249600))).toBe(true)
 expect(quarter.allNodes).toHaveLength(6);expect(quarter.nodes).toContain(node);expect(quarter.nodes.some(n=>n.sourceRefs[0]?.kind==='payroll')).toBe(true);expect(quarter.nodes.some(n=>n.id.startsWith('life-result:'))).toBe(true)
 expect(controller.exportSaved()).toBe(before)
})

it('reads original Q2 signature quantities rather than the later diluted holding and augmented principal',()=>{
 const props=p(),a=props.features.deepseek!.agreements[0]!,before=controller.exportSaved(),quarter=seasonRecollection(props,'2025-Q2')!,node=quarter.allNodes.find(n=>n.id==='equity-signed:'+a.id)!
 expect(a.shares).toBe(2812);expect(a.costFen).toBe(2249600)
 expect(node).toBeDefined();expect(node.date).toBe('2025-04-15');expect(node.line).toContain(moneyText(2000000));expect(node.line).toContain('原2500 / 1250000模拟股');expect(node.line).not.toContain('2812');expect(node.line).not.toContain(moneyText(2249600))
 // The normalized ordering fixes the mixed-sequence counterexample without
 // changing either real quarter already observed in the original Chrome run.
 for(const id of ['2025-Q2','2025-Q3']){const all=seasonRecollection(props,id)!.allNodes,old=[...all].sort((a,b)=>b.date.localeCompare(a.date)||(a.sequence!==undefined&&b.sequence!==undefined?b.sequence-a.sequence:0)||a.id.localeCompare(b.id));expect(all.map(n=>n.id)).toEqual(old.map(n=>n.id))}
 expect(node.sourceRefs.some(r=>r.kind==='command')).toBe(true);expect(controller.exportSaved()).toBe(before)
})

it('renders the real quarter follow outcome without executing, navigating or modifying the saved life',()=>{
 const props=p(),before=controller.exportSaved(),onNavigate=vi.fn(),html=renderToStaticMarkup(<SeasonRecollection p={props} onClose={()=>{}} onNavigate={onNavigate}/>)
 expect(html).toContain('这轮架空融资，已经实际追加本金');expect(html).toContain('新增312模拟股');expect(html).toContain(moneyText(249600));expect(html).toContain('翻看同一份权益原册')
 expect(props.request).not.toHaveBeenCalled();expect(onNavigate).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
})

it('retains a normal holding as a record rather than unfinished work and keeps its original reading target',()=>{
 const props=p(),a=props.features.deepseek!.agreements[0]!,before=controller.exportSaved(),quarter=seasonRecollection(props)!,holding=quarter.remaining.find(item=>item.continuation==='retained')!
 expect(holding).toBeDefined();expect(holding.urgent).toBe(false);expect(holding.dueAt).toBeNull();expect(holding.line).toContain('不要求新增付款');expect(holding.inspect.target).toMatchObject({accountId:a.accountId,deepseekPane:'equity',openRecord:true,equityTarget:{runId:props.view.runId,businessId:a.businessId,kind:'agreement',recordId:a.id}})
 expect(quarter.remaining.filter(item=>item.continuation!=='retained')).toHaveLength(0);expect(quarter.nextQuestion).not.toContain('原来的约定仍在');expect(seasonMeaning(props,quarter)!.question).not.toContain('先续上仍答应')
 const html=renderToStaticMarkup(<SeasonRecollection p={props} onClose={()=>{}} onNavigate={()=>{}}/>)
 expect(html).toContain('持股与原记录，还在');expect(html).toContain('保留不要求新增付款');expect(controller.exportSaved()).toBe(before)
})

it('retains old committed quarter outcomes while a candidate is unsaved, and rejects a foreign published source',()=>{
 const props=p(),original=seasonRecollection(props)!,old={...props,view:{...props.view,hasCandidate:true,saveStatus:'unsaved' as const}},before=controller.exportSaved()
 expect(seasonRecollection(old)!.allNodes).toEqual(original.allNodes)
 const foreign={...props,features:{...props.features,sceneCommands:{...props.features.sceneCommands!,runId:'different-life'}}}
 expect(seasonRecollection(foreign)!.allNodes.some(n=>n.id.startsWith('equity-'))).toBe(false)
 expect(seasonRecollection(foreign)!.nextQuestion).toContain('来源仍待核对');expect(seasonMeaning(foreign,seasonRecollection(foreign)!)!.question).toContain('待核原记录')
 expect(controller.exportSaved()).toBe(before)
})
