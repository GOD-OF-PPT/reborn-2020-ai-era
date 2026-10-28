import {afterAll,beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/follow-native-r153/saved121-public-round-undecided.json?raw'
import referenceRaw from '../../goal-1/evidence/t17-acceptance-40/follow-rule-reference-r158/golden.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {evaluateCommand} from '../core/commands.ts'
import {hashText} from '../core/hash.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import type {ComponentProps} from 'react'
import type {PlayFeatures} from './game-types.ts'

type Facts=ComponentProps<typeof EquityDecisionFacts>
const reference:{inputSha256:string;cases:{name:string;command:unknown;sha256:string;bytes:number}[]}=JSON.parse(referenceRaw)
let codec:ReturnType<typeof createCampaignCodec>,controller:GameController,store:IndexedDbRunStore
beforeAll(async()=>{codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-follow-confirmation'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw);expect(hashText(raw)).toBe(reference.inputSha256)})
afterAll(async()=>{await controller?.close();await store?.close()})
function capture(amountFen:number):Facts{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,a=features.deepseek!.agreements.filter(a=>a.followDecision==='pending');expect(a).toHaveLength(1);const command=controller.prepare('FollowEquityRound',{agreementId:a[0]!.id,amountFen}),preview=controller.preview(command);expect(preview.allowed).toBe(true);return {command,preview,view,features,accountName:id=>id==='personal'?'个人账户':'原企业账户'}}
const html=(p:Facts)=>renderToStaticMarkup(<EquityDecisionFacts {...p}/>)

it('publishes only the same declared pending round and its original whole-share terms',()=>{
 const p=capture(0),v=p.features.deepseek!,a=v.agreements[0]!,offer=Reflect.get(a,'followOffer')
 expect(offer).toMatchObject({version:1,runId:p.view.runId,sourceRevision:p.view.revision,agreementId:a.id,businessId:a.businessId,accountId:a.accountId,baseRoundId:v.rounds.at(-1)!.id,unitPriceFen:800,issuedShares:312500,totalSharesBefore:1250000,totalSharesAfter:1562500,maxAmountFen:500000})
 expect(a.followDecision).toBe('pending');expect(p.preview.actionPoints).toBe(0)
})

it.each(reference.cases)('preserves every original persisted byte for the $name core choice',item=>{
 const run=codec.import(raw),result=evaluateCommand(run,item.command,codec.registry,run.actorId);expect(result.status).toBe('proposed');if(result.status!=='proposed')throw Error('ORIGINAL_LEGAL_FOLLOW_REQUIRED')
 const text=codec.export(result.nextRun);expect(hashText(text)).toBe(item.sha256);expect(new TextEncoder().encode(text).length).toBe(item.bytes);expect(result.nextRun.random).toEqual(run.random)
})

it('explains explicit zero as retained cash and shares with the original known dilution',()=>{
 const before=controller.exportSaved(),text=html(capture(0))
 expect(text).toContain('本次不新增付款');expect(text).toContain('2500');expect(text).toContain('1562500');expect(text).toContain('0.16%');expect(text).toContain('¥271,633.33')
 expect(text).toContain('原锁定至2027-04-15');expect(text).toContain('不是退款或投资收益');expect(controller.exportSaved()).toBe(before)
})

it('states an actual partial principal, new shares and retained available cash without publishing it as already saved',()=>{
 const before=controller.exportSaved(),text=html(capture(249600))
 expect(text).toContain('¥2,496');expect(text).toContain('312');expect(text).toContain('2812');expect(text).toContain('1562500');expect(text).toContain('0.18%');expect(text).toContain('¥269,137.33')
 expect(text).toContain('保存成功后');expect(text).toContain('原锁定至2027-04-15');expect(controller.exportSaved()).toBe(before)
})

it('keeps stale, missing and ambiguous quote sources neutral instead of publishing another agreement or made-up shares',()=>{
 const p=capture(249600),v=p.features.deepseek!,a=v.agreements[0]!,cases:Facts[]=[{...p,view:{...p.view,revision:p.view.revision-1}},{...p,features:{deepseek:{...v,agreements:[...v.agreements,a]}}},{...p,command:{...p.command,payload:{agreementId:'missing-original',amountFen:249600}}}]
 for(const value of cases){const text=html(value);expect(text).toContain('请返回这份原记录重新核对');expect(text).not.toContain('2812');expect(text).not.toContain('¥0')}
})
