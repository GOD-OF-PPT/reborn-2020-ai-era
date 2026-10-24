import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRun,campaignVideo} from '../application/campaign.ts'
import {projectVideo} from '../core/video-projection.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import {VideoCommandDetails} from './VideoCommandDetails.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'

const run=createCampaignRun({runId:'video-terms-ui',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'video-terms-ui'})
const video=projectVideo(run,campaignVideo)
const command:CommandEnvelope={runId:run.runId,actorId:'player',commandId:'review-terms',expectedRevision:run.revision,kind:'AcceptVideoCommission',payload:{}}
it('separates the actual quote, protected prepayment, zero current income and future balance',()=>{
 const html=renderToStaticMarkup(<VideoCommandDetails command={command} video={video}/>)
 for(const text of ['¥3,000','¥900','会同时保护这笔钱','原单交付或退款','¥0','自有资金','2天复核','¥2,100','7天后才收款','5%'])expect(html).toContain(text)
})
it('uses the captured catalog including a no-prepayment contract instead of global defaults',()=>{
 const custom=video?{...video,catalog:{...video.catalog,commercial:{...video.catalog.commercial,priceFen:200000,prepaymentFen:0,reviewDays:3,paymentDays:14,feeBps:300}}}:null
 const html=renderToStaticMarkup(<VideoCommandDetails command={command} video={custom}/>)
 for(const text of ['¥2,000','本次不收预款','¥0','3天复核','14天后才收款','3%'])expect(html).toContain(text)
 expect(html).not.toContain('¥900');expect(html).not.toContain('¥3,000')
})
it('does not promise commission revenue when merely arranging an uncontracted sample',()=>{
 expect(renderToStaticMarkup(<VideoCommandDetails command={{...command,kind:'StartVideoWork'}} video={video}/>)).toBe('')
})

async function normalExit(name:string,startAt:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'video-exit-terms-'+name})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++id)})
 const current=()=>{const view=controller.snapshot.view!;return {view,features:view.features as unknown as PlayFeatures}}
 const send=async(kind:string,payload:unknown)=>{expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')}
 const advance=async(date:string)=>{for(let i=0;i<20;i++){
  const p=current(),w=p.features.workbench
  if(w.pause){const event=w.events.find(event=>event.isBlocking),choice=event?.choices.find(choice=>choice.isDefault);expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event!.id,choiceId:choice!.id});continue}
  if(p.view.date>=date&&!p.view.operations?.jobs.some(job=>['planned','running'].includes(job.status)&&job.completeAt<=date))return
  await send('AdvanceTime',{date})
 }throw Error('NORMAL_EXIT_CLOCK_LIMIT')}
 try{
  await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'s3-video-paper-normal'})
  await send('OpenVideoChannel',{name:'退出前核对的同一账号',segment:'local_merchants'})
  const channel=current().features.video!.channels.find(channel=>channel.name==='退出前核对的同一账号')!
  await send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:'2020-01-01'});await advance('2020-01-08')
  const lead=current().features.video!.channels.find(row=>row.id===channel.id)!.leads[0]!
  await send('AcceptVideoCommission',{channelId:channel.id,clientId:lead.personId,cohortId:lead.cohortId,modeId:'manual',materialId:'original',resources:['player-production'],startAt})
  return {controller,current,send,advance,channelId:channel.id,close:async()=>{await controller.close();await store.close()}}
 }catch(error){await controller.close();await store.close();throw error}
}

it('shows the exact original refund before a normal planned exit and releases only its unused reservation',async()=>{
 const h=await normalExit('planned-exit','2020-01-10')
 try{
  const p=h.current(),contract=p.features.video!.contracts.find(contract=>contract.channelId===h.channelId)!,exit=h.controller.prepare('ExitVideoCommission',{contractId:contract.id}),raw=h.controller.exportSaved()
  const account=p.features.workbench.finance.find(account=>account.accountId==='personal')!,balance=account.contracts.find(balance=>balance.id===contract.id)!
  expect(balance.prepaidFen).toBe(90000);expect(h.controller.preview(exit).upfrontCostFen).toBe(0)
  const html=renderToStaticMarkup(<CommandDetails command={exit} confirm={h.controller.preview(exit)} features={p.features} view={p.view} accountName={id=>id} clock={null}/>)
  for(const text of ['退出前核对的同一账号','将退还未履约预款','¥900','尚未执行这次退款','未付部分','行动不会退回','尚未开工的原计划将取消'])expect(html).toContain(text)
  expect(h.controller.exportSaved()).toBe(raw)
  await h.send('ExitVideoCommission',{contractId:contract.id})
  const after=h.current(),money=after.features.workbench.finance.find(row=>row.accountId==='personal')!
  expect(money.cashFen).toBe(account.cashFen-90000);expect(money.contracts.find(row=>row.id===contract.id)?.prepaidFen).toBe(0)
  expect(after.view.budget.available).toBe(p.view.budget.available+1)
  expect(after.features.video!.works.find(work=>work.id===contract.workId)?.production?.status).toBe('cancelled')
 }finally{await h.close()}
})

it('keeps a normal running exit tied to captured ledger money, preserves spent action, and refuses missing or mixed confirmation records',async()=>{
 const h=await normalExit('running-exit','2020-01-08')
 try{
  const stale=h.controller.prepare('ExitVideoCommission',{contractId:h.current().features.video!.contracts[0]!.id})
  await h.advance('2020-01-09')
  const p=h.current(),v=p.features.video!,contract=v.contracts.find(contract=>contract.channelId===h.channelId)!,exit=h.controller.prepare('ExitVideoCommission',{contractId:contract.id}),raw=h.controller.exportSaved(),finance=p.features.workbench.finance
  const account=finance.find(account=>account.accountId==='personal')!,balance=account.contracts.find(balance=>balance.id===contract.id)!
  const render=(props:Partial<Parameters<typeof VideoCommandDetails>[0]>={})=>renderToStaticMarkup(<VideoCommandDetails command={exit} video={v} view={p.view} finance={finance} {...props}/>)
  const html=render();expect(html).toContain('将退还未履约预款<strong>¥900</strong>');expect(html).toContain('仍在进行的原任务会中断');expect(html).toContain('行动不会退回')
  for(const props of [{finance:[]},{command:stale},{finance:finance.map(row=>({...row,accountId:'unrelated-account'}))},{video:{...v,contracts:[...v.contracts,contract]}}])expect(render(props)).toContain('请返回重新核对')
  // Public presentation counterexamples only; neither modifies the normal saved ledger.
  const changedBalance=finance.map(row=>({...row,contracts:row.contracts.map(item=>item.id===balance.id?{...item,prepaidFen:45000}:item)}))
  expect(render({finance:changedBalance})).toContain('将退还未履约预款<strong>¥450</strong>')
  const shortCash=finance.map(row=>({...row,cashFen:0}))
  expect(render({finance:shortCash})).toContain('未付部分仍保留为本单退款欠款');expect(render({finance:shortCash})).toContain('¥900')
  expect(h.controller.exportSaved()).toBe(raw)
  await h.send('ExitVideoCommission',{contractId:contract.id})
  const after=h.current(),money=after.features.workbench.finance.find(row=>row.accountId==='personal')!
  expect(money.cashFen).toBe(account.cashFen-90000);expect(after.view.budget).toEqual(p.view.budget)
  expect(after.features.video!.works.find(work=>work.id===contract.workId)?.production?.status).toBe('interrupted')
  expect(money.contracts.find(row=>row.id===contract.id)?.prepaidFen).toBe(0)
 }finally{await h.close()}
})
