import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {MarketPanel} from './MarketPanel.tsx'
import {QuarterPanel} from './QuarterPanel.tsx'
import LifePanel from './LifePanel.tsx'

async function normal(name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s1-record-'+name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s1-record-${name}-${++sequence}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'s1-record-'+name})
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('READING_AN_ORIGINAL_RECORD_MUST_NOT_SUBMIT')}}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status,kind).toBe('saved')
 const company=async()=>{await send('DiscoverBusiness',{definitionId:'course-studio'});return p().view.operations!.businesses.find(b=>b.definitionId==='course-studio')!.accountId}
 return {controller,p,send,company,close:async()=>{await controller.close();await store.close()}}
}
const noAction=()=>{throw Error('SERVER_RENDER_MUST_NOT_NAVIGATE')}
function quarter(p:GamePanelProps,initialRecordId:string,initialPhase:'brief'|'plan'='brief'){return <QuarterPanel {...p} initialRecordId={initialRecordId} initialPhase={initialPhase} guideHidden={false} onHideGuide={noAction} onLife={noAction} onPeople={noAction} onMarket={noAction} onDeepseek={noAction} onCourse={noAction} onRelay={noAction} onRoutines={noAction} onStory={noAction}/>}

it('opens the requested original order while preserving other orders and rejects a real different account',async()=>{
 const h=await normal('orders')
 try{
  const first=h.p().features.market
  await h.send('PlaceStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen:11988,quoteId:first.quoteId,validUntil:first.matchingCalendar[0]!.id})
  await h.send('PlaceStockOrder',{accountId:'personal',symbol:'SIM-AI02',side:'buy',quantity:50,limitPriceFen:2500,quoteId:first.quoteId,validUntil:first.matchingCalendar[1]!.id})
  const companyId=await h.company(),p=h.p(),order=p.features.market.orders[1]!,before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<MarketPanel {...p} initialRecordId={order.id}/>)
  expect(html).toContain('个人账户 · 青棱互联')
  expect(html).toContain('href="#'+encodeURIComponent('market-record-'+order.id)+'"')
  expect(html).toContain('id="market-record-'+order.id+'"')
  expect(html).toContain('SIM-AI01 · 买 100股');expect(html).toContain('SIM-AI02 · 买 50股')
  expect(html).toContain('预留为计划');expect(html).toContain('限价（元/股）')
  for(const [accountId,recordId] of [[companyId,order.id],['personal','missing-original-order'],['personal','']] as const){
   const invalid=renderToStaticMarkup(<MarketPanel {...p} accountId={accountId} initialRecordId={recordId}/>)
   expect(invalid).toContain('请重新选择原记录');expect(invalid).toContain('重新选择市场记录')
   expect(invalid).not.toContain('href="#'+encodeURIComponent('market-record-'+order.id)+'"')
   expect(invalid).not.toContain('<form');expect(invalid).not.toContain('预览买单');expect(invalid).not.toContain('预留为计划')
   expect(invalid.match(/<button\b/g)??[]).toHaveLength(1)
  }
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it('opens an actual position, filled history and its later original sale settlement without treating the receivable as cash',async()=>{
 const h=await normal('settlement')
 try{
  let p=h.p();const q=p.features.market.stocks.find(s=>s.symbol==='SIM-AI02')!
  await h.send('PlaceStockOrder',{accountId:'personal',symbol:q.symbol,side:'buy',quantity:50,limitPriceFen:q.upperFen!,quoteId:p.features.market.quoteId,validUntil:p.features.market.matchingCalendar[1]!.id})
  await h.send('AdvanceTime',{date:'2020-01-11'});p=h.p()
  const position=p.features.market.positions[0]!,order=p.features.market.orders[0]!,beforePosition=h.controller.exportSaved()
  expect(position.quantity).toBe(50)
  const positionHtml=renderToStaticMarkup(<MarketPanel {...p} initialRecordId={position.id}/>),history=renderToStaticMarkup(<MarketPanel {...p} initialRecordId={order.id}/>)
  expect(positionHtml).toContain('id="market-record-'+position.id+'"');expect(positionHtml).toContain('青棱互联 · 原持仓');expect(positionHtml).toContain('持有50股')
  expect(history).toContain('<details class="order-history" open="">');expect(history).toContain('已成交50股')
  expect(h.controller.exportSaved()).toBe(beforePosition)
  const current=p.features.market.stocks.find(s=>s.symbol===position.symbol)!
  await h.send('PlaceStockOrder',{accountId:'personal',symbol:current.symbol,side:'sell',quantity:position.quantity,limitPriceFen:current.lowerFen!,quoteId:p.features.market.quoteId,validUntil:p.features.market.matchingCalendar[0]!.id})
  await h.send('AdvanceTime',{date:'2020-01-20'});p=h.p()
  const settlement=p.features.market.settlements.find(s=>s.paidAt===null)!,beforeSettlement=h.controller.exportSaved()
  expect(settlement.dueAt).toBe('2020-01-21')
  const html=renderToStaticMarkup(<MarketPanel {...p} initialRecordId={settlement.id}/>)
  expect(html).toContain('id="market-record-'+settlement.id+'"');expect(html).toContain('href="#'+encodeURIComponent('market-record-'+settlement.id)+'"')
  expect(html).toContain('2020-01-21');expect(html).toContain('待到账，尚不可花')
  expect(h.controller.exportSaved()).toBe(beforeSettlement)
 }finally{await h.close()}
},20000)

it('locates real personal research and refuses to present it as another account record',async()=>{
 const h=await normal('research')
 try{
  await h.send('ResearchMarket',{definitionId:'market-overview'})
  const companyId=await h.company(),p=h.p(),research=p.features.market.researches[0]!,before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<MarketPanel {...p} initialRecordId={research.id}/>)
  expect(html).toContain('id="market-record-'+research.id+'"');expect(html).toContain('2020-01-02');expect(html).toContain('原费用¥0 / 1点')
  const foreign=renderToStaticMarkup(<MarketPanel {...p} accountId={companyId} initialRecordId={research.id}/>)
  expect(foreign).toContain('请重新选择原记录');expect(foreign).not.toContain('href="#'+encodeURIComponent('market-record-'+research.id)+'"')
  expect(foreign).not.toContain('<form');expect(foreign).not.toContain('预览买单');expect(foreign.match(/<button\b/g)??[]).toHaveLength(1)
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it('locates the actual first offer, job, paid contract and employment in their original quarter phases without executing',async()=>{
 const h=await normal('quarter')
 try{
  let p=h.p(),before=h.controller.exportSaved()
  const offer=renderToStaticMarkup(quarter(p,p.features.firstOrder.offerId))
  expect(offer).toContain('id="quarter-first-order"');expect(offer).toContain('预览手工第一单');expect(offer).toContain('最迟2020-01-05答复')
  expect(h.controller.exportSaved()).toBe(before)
  await h.send('WorkQuarter',{});await h.send('StartFirstOrder',{});await h.send('AdvanceTime',{date:'2020-01-19'});p=h.p();before=h.controller.exportSaved()
  const first=p.features.firstOrder,delivery=renderToStaticMarkup(quarter(p,first.jobId!))
  expect(delivery).toContain('将完成的作品提交客户');expect(delivery).not.toContain('客户实际回款')
  expect(delivery).toMatch(/aria-current="step"[^>]*><span>03<\/span>抉择/)
  expect(h.controller.exportSaved()).toBe(before)
  await h.send('SubmitDelivery',{contractId:first.contractId});await h.send('AdvanceTime',{date:'2020-01-20'});p=h.p();before=h.controller.exportSaved()
  const paid=renderToStaticMarkup(quarter(p,first.contractId!)),employment=p.features.workbench.employment[0]!,work=renderToStaticMarkup(quarter(p,employment.id))
  expect(paid).toContain('客户实际回款');expect(paid).toContain('¥1,300');expect(paid).toMatch(/aria-current="step"[^>]*><span>04<\/span>结果/)
  expect(work).toContain('id="quarter-work"');expect(work).toContain('data-record-id="'+employment.id+'"');expect(work).toContain('2020-Q1 · 原工作安排')
  for(const label of ['简报','计划','抉择','结果'])expect(work).toContain(label)
  for(const missing of ['missing-employment','']){const invalid=renderToStaticMarkup(quarter(p,missing,'plan'));expect(invalid).toContain('这份本季记录已失效');expect(invalid).toContain('重新选择本季记录');expect(invalid).not.toContain('href="#quarter-work"');expect(invalid).not.toContain('安排本季工作 · 2点');expect(invalid).not.toContain('停止后续在岗安排');expect(invalid.match(/<button\b/g)??[]).toHaveLength(1)}
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it('opens a completed original rest job in personal life instead of changing it into a Tang Ying activity',async()=>{
 const h=await normal('rest')
 try{
  await h.send('StartLifeWork',{kind:'rest',personId:null,reference:null});await h.send('AdvanceTime',{date:'2020-01-08'})
  const p=h.p(),job=p.features.life.jobs[0]!,before=h.controller.exportSaved()
  expect(job).toMatchObject({status:'completed',result:'rested',personId:null})
  const html=renderToStaticMarkup(<LifePanel {...p} initialPane="people" initialPersonId="tang-ying" initialRecordId={job.id}/>)
  expect(html).toContain('id="life-record-'+job.id+'"');expect(html).toContain('留出七天休整');expect(html).toContain('2020-01-08');expect(html).toContain('已实际完成')
  expect(html).not.toContain('安排与唐萤的共同活动');expect(html).toContain('确认留出七天休整')
  for(const missing of ['missing-life-job','']){const invalid=renderToStaticMarkup(<LifePanel {...p} initialPane="people" initialPersonId="tang-ying" initialRecordId={missing}/>);expect(invalid).toContain('这份生活记录已失效');expect(invalid).toContain('重新选择生活记录');expect(invalid).not.toContain('安排与唐萤的共同活动');expect(invalid).not.toContain('确认留出七天休整');expect(invalid.match(/<button\b/g)??[]).toHaveLength(1)}
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it('opens the actual original promise owner and rejects a different controlled account',async()=>{
 const h=await normal('promise')
 try{
  await h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});await h.send('AdvanceTime',{date:'2020-01-04'})
  const companyId=await h.company(),p=h.p(),promise=p.features.life.promises[0]!,before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<LifePanel {...p} initialPane="today" initialPersonId="chen-yu" initialRecordId={promise.id}/>)
  expect(html).toContain('id="life-record-'+promise.id+'"');expect(html).toContain('<h2>唐萤</h2>');expect(html).toContain(promise.deadline)
  expect(html).not.toContain('<h2>陈屿</h2>');expect(html).toContain('核对条款后接受这项约定')
  const foreign=renderToStaticMarkup(<LifePanel {...p} accountId={companyId} initialRecordId={promise.id}/>)
  expect(foreign).toContain('请重新选择原记录');expect(foreign).not.toContain('href="#'+encodeURIComponent('life-record-'+promise.id)+'"')
  expect(foreign).not.toContain('确认留出七天休整');expect(foreign).not.toContain('确认改善桌椅与照明');expect(foreign.match(/<button\b/g)??[]).toHaveLength(1)
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)
