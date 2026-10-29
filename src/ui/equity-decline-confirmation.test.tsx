import {afterAll,beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeEquitySign.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import {domainSceneResult} from './scene-domain-results.ts'
import type {ComponentProps} from 'react'
import type {PlayFeatures} from './game-types.ts'

type Facts=ComponentProps<typeof EquityDecisionFacts>
let controller:GameController,store:IndexedDbRunStore,captured:Facts
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-decline-original-normal'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw);const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,rows=features.deepseek!.negotiations.filter(n=>n.accepted===true&&n.closedAt===null);expect(rows).toHaveLength(1);const command=controller.prepare('DeclineEquityTerms',{negotiationId:rows[0]!.id}),preview=controller.preview(command);expect(preview.allowed).toBe(true);captured={view,features,command,preview,accountName:id=>id==='personal'?'个人账户':'原企业账户'}})
afterAll(async()=>{await controller?.close();await store?.close()})
const html=(value:Facts)=>renderToStaticMarkup(<EquityDecisionFacts {...value}/>)
it('reviews the original zero new payment separately from the unpaid20000 quotation and already spent costs without refunding or closing other work',()=>{const before=controller.exportSaved(),text=html(captured);expect(text).toContain('本次新增费用');expect(text).toContain('¥0');expect(text).toContain('0点');expect(text).toContain('本条款报价本金，尚未支付');expect(text).toContain('¥20,000');expect(text).toContain('已付调查与谈判费用不退');expect(text).toContain('其它已确认安排和旧约继续保留');expect(controller.exportSaved()).toBe(before)})
it('keeps stale or ambiguous captured sources explicit instead of inventing a zero-cost decision from another proposal',()=>{const v=captured.features.deepseek!,n=v.negotiations.find(n=>n.id===(captured.command.payload as {negotiationId:string}).negotiationId)!,cases:Facts[]=[{...captured,view:{...captured.view,revision:captured.view.revision-1}},{...captured,command:{...captured.command,payload:{negotiationId:'missing-original'}}},{...captured,features:{deepseek:{...v,negotiations:[...v.negotiations,n]}}}];for(const value of cases){const text=html(value);expect(text).toContain('请返回这份原记录重新核对');expect(text).not.toContain('¥0');expect(text).not.toContain('¥20,000')}})
it('actually closes only the original quotation without paying principal, altering cash/AP/shares, or rendering a candidate or stale multi-command result as saved',async()=>{const before=controller.snapshot.view!,accounts=before.accounts,budget=before.budget,oldHtml=html(captured);expect((await controller.submit(captured.command)).status).toBe('saved');const after=controller.snapshot.view!,v=after.features as unknown as PlayFeatures;expect(after.accounts).toEqual(accounts);expect(after.budget).toEqual(budget);expect(after.date).toBe(before.date);expect(v.deepseek!.agreements).toEqual((before.features as unknown as PlayFeatures).deepseek!.agreements);expect(v.deepseek!.negotiations.find(n=>n.id===(captured.command.payload as {negotiationId:string}).negotiationId)).toMatchObject({closedAt:before.date,closedKind:'declined'});expect(html(captured)).toBe(oldHtml);expect(domainSceneResult('DeclineEquityTerms',before,after)).toContain('原报价本金¥20,000未支付给本条款');expect(domainSceneResult('DeclineEquityTerms',before,{...after,hasCandidate:true})).toBeNull();expect(domainSceneResult('DeclineEquityTerms',before,{...after,revision:after.revision+1})).toBeNull()})
