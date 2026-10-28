import {afterAll,beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeEquitySign.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import type {PlayFeatures} from './game-types.ts'
import type {ComponentProps} from 'react'

type Facts=ComponentProps<typeof EquityDecisionFacts>
let controller:GameController,store:IndexedDbRunStore,negotiation:Facts,signing:Facts
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-original-capital-confirmation'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await controller.initialize();await controller.importNew(raw)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,n=features.deepseek!.negotiations.filter(n=>n.accepted===true&&n.closedAt===null);expect(n).toHaveLength(1)
 const capture=(kind:string,payload:unknown):Facts=>{const command=controller.prepare(kind,payload),preview=controller.preview(command);expect(preview.allowed).toBe(true);return {view,features,command,preview,accountName:id=>id==='personal'?'个人账户':'原企业账户'}}
 negotiation=capture('StartEquityNegotiation',{invitationId:n[0]!.invitationId,acquisitionKind:'secondary',termsId:'liquidity',amountFen:800000,resources:['player-production'],startAt:view.date})
 signing=capture('SignEquityAgreement',{negotiationId:n[0]!.id})
})
afterAll(async()=>{await controller?.close();await store?.close()})
const html=(p:Facts)=>renderToStaticMarkup(<EquityDecisionFacts {...p}/>)

it('restates chosen principal, acquisition, original rights and actual negotiation cost without paying the proposal or predicting acceptance',()=>{
 const before=controller.exportSaved(),text=html(negotiation)
 expect(text).toContain('拟议本金，尚未付款');expect(text).toContain('¥8,000');expect(text).toContain('支付老股卖方，不增加项目资本')
 expect(text).toContain('¥500');expect(text).toContain('开工季度1点');expect(text).toContain('有限转让 / 较短锁定');expect(text).toContain('90日')
 expect(text).toContain('本人实际日期产能');expect(text).toContain('无董事权');expect(text).toContain('无跟投权');expect(text).toContain('对方仍可能拒绝')
 expect(text).toContain('这次只安排谈判');expect(text).toContain('不获得股份');expect(controller.exportSaved()).toBe(before)
})

it('states the original actual payment and original shares while keeping the acquisition separate from previous fees or income',()=>{
 const before=controller.exportSaved(),text=html(signing)
 expect(text).toContain('本次实际支付¥20,000，取得2500模拟股');expect(text).toContain('财务参与 / 长期锁定');expect(text).toContain('730日')
 expect(text).toContain('新增项目资本');expect(text).toContain('本次行动占用');expect(text).toContain('保存成功后，现金才转为这份投资资产')
 expect(text).toContain('本次不重复支付');expect(text).toContain('不保证收入或退出');expect(controller.exportSaved()).toBe(before)
 const v=signing.features.deepseek!,n=v.negotiations.find(n=>n.id===(signing.command.payload as {negotiationId:string}).negotiationId)!,i=v.invitations.find(i=>i.id===n.invitationId)!
 expect(text).toContain('原条款有效至'+n.expiresAt);expect(text).toContain('原邀请有效至'+i.expiresAt)
})

it('keeps foreign, duplicate, unknown and contradictory captured capital sources explicit without publishing invented numbers or another original choice',()=>{
 const v=signing.features.deepseek!,n=v.negotiations.find(n=>n.id===(signing.command.payload as {negotiationId:string}).negotiationId)!,cases:Facts[]=[
  {...signing,view:{...signing.view,revision:signing.view.revision-1}},
  {...signing,command:{...signing.command,payload:{negotiationId:'missing-original'}}},
  {...signing,features:{deepseek:{...v,negotiations:[...v.negotiations,n]}}},
  {...signing,view:{...signing.view,accounts:signing.view.accounts.filter(a=>a.accountId!=='personal')}},
  {...signing,preview:{...signing.preview,upfrontCostFen:1}},
  {...negotiation,command:{...negotiation.command,payload:{...(negotiation.command.payload as object),termsId:'missing-original'}}},
  {...negotiation,command:{...negotiation.command,payload:{...(negotiation.command.payload as object),resources:['missing-original']}}},
 ]
 for(const p of cases){const text=html(p);expect(text).toContain('请返回这份原记录重新核对');expect(text).not.toContain('¥0');expect(text).not.toContain('¥20,000');expect(text).not.toContain('¥8,000')}
})
