import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'
import {committedEcho,sceneTimeNarrative,SceneEcho,SceneTimeNotice} from './SceneEcho.tsx'
import {savedSceneResult} from './scene-result.ts'
import earnedEpilogue from '../../goal-1/evidence/t16-epilogue/chrome-abort-finish/old-epilogue-s99.json?raw'

it('shows the actual completed work and later cash receipt without opening the optional account reel',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d08-visible-time-result'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d08-echo-${++id}`})
 await controller.initialize()
 await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d08-visible-time-result'})
 try{
  const beforePlan=controller.snapshot.view!
  expect((await controller.submit(controller.prepare('StartFirstOrder',{}))).status).toBe('saved')
  const beforeProduction=controller.snapshot.view!
  const plannedRaw=controller.exportSaved(),plannedFrame=committedEcho(beforePlan,beforeProduction)
  expect(plannedFrame).toMatchObject({pointsBefore:4,pointsAfter:3,reservedBefore:0,reservedAfter:1,spentBefore:0,spentAfter:0})
  expect(beforeProduction.accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(beforePlan.accounts.find(a=>a.accountId==='personal')!.cashFen)
  const plannedHtml=renderToStaticMarkup(<SceneEcho text={savedSceneResult('StartFirstOrder','接下手工小单',beforePlan,beforeProduction)} frame={plannedFrame} accountName={()=>'个人账户'} onClose={()=>{}}/>)
  expect(plannedHtml).toContain('预留行动')
  expect(plannedHtml).toContain('0 → 1 点')
  expect(plannedHtml).toContain('已用行动')
  expect(plannedHtml).toContain('0 点 · 未变')
  expect(plannedHtml).toContain('本次预留制作费¥500和1点，开工时才实际使用')
  expect(controller.exportSaved()).toBe(plannedRaw)
  expect((await controller.submit(controller.prepare('AdvanceTime',{date:'2020-01-19'}))).status).toBe('saved')
  const completed=controller.snapshot.view!,rawCompleted=controller.exportSaved()
  expect(committedEcho(beforeProduction,completed)).toMatchObject({pointsBefore:3,pointsAfter:3,reservedBefore:1,reservedAfter:0,spentBefore:0,spentAfter:1})
  const completedText=savedSceneResult('AdvanceTime','等待原作品完成',beforeProduction,completed)
  const completedHtml=renderToStaticMarkup(<SceneTimeNotice date={completed.date} text={completedText} frame={committedEcho(beforeProduction,completed)} accountName={()=>'个人账户'} onClose={()=>{throw Error('RENDER_MUST_NOT_CLOSE')}}/>)
  expect(completedHtml).toContain('这份作品已经做完')
  expect(completedHtml).toContain('下一步，要由你亲手交给客户')
  expect(completedHtml).not.toContain('scene-time-result">'+completed.date+'，')
  expect(completedHtml).not.toContain('scene-time-result">'+completed.date+'。')
  expect(completedHtml).not.toContain('<dialog')
  expect((completed.features as unknown as PlayFeatures).firstOrder.result.paymentFen).toBe(0)
  expect(controller.exportSaved()).toBe(rawCompleted)
  const contractId=(completed.features as unknown as PlayFeatures).firstOrder.contractId
  expect((await controller.submit(controller.prepare('SubmitDelivery',{contractId}))).status).toBe('saved')
  const beforePayment=controller.snapshot.view!
  expect((await controller.submit(controller.prepare('AdvanceTime',{date:'2020-01-20'}))).status).toBe('saved')
  const paid=controller.snapshot.view!,rawPaid=controller.exportSaved(),frame=committedEcho(beforePayment,paid)
  const paidText=savedSceneResult('AdvanceTime','等待客户原反馈',beforePayment,paid)
  const notice=renderToStaticMarkup(<SceneTimeNotice date={paid.date} text={paidText} frame={frame} accountName={()=>'个人账户'} onClose={()=>{}}/>)
  const details=renderToStaticMarkup(<SceneEcho text={paidText} frame={frame} accountName={()=>'个人账户'} onClose={()=>{}}/>)
  expect((paid.features as unknown as PlayFeatures).firstOrder.result).toMatchObject({paymentFen:130000,directCostFen:50000,netOrderFen:80000})
  for(const html of [notice,details]){
   expect(html).toContain('客户实际付来了¥1,300')
   expect(html).toContain('制作成本¥500')
   expect(html).toContain('这一单净得¥800')
  }
  expect(notice).not.toContain('<dialog')
  expect(details).toContain('可用行动')
  expect(controller.exportSaved()).toBe(rawPaid)
 }finally{await controller.close();await store.close()}
},20000)

it('keeps amounts and later obligations intact while treating supplied result text as text',()=>{
 const text='原应付¥1,234.56仍保留。2025-03-08前还须处理客户保护¥789.01；<img src=x onerror="danger()">不作为网页执行。'
 const props={date:'2025-03-04',text,frame:null,accountName:()=>'<script>account</script>',onClose:()=>{}}
 const notice=renderToStaticMarkup(<SceneTimeNotice {...props}/>),details=renderToStaticMarkup(<SceneEcho {...props}/>)
 for(const html of [notice,details]){
  expect(html).toContain('¥1,234.56')
  expect(html).toContain('2025-03-08前还须处理客户保护¥789.01')
  expect(html).toContain('&lt;img src=x onerror=&quot;danger()&quot;&gt;')
  expect(html).not.toContain('<img')
 }
})

it('shows today once without deleting another milestone date or changing the full saved result',()=>{
 const date='2025-07-19',text=date+'。客户已验收。支持安排到2025-07-26；¥3,600到期款仍归合作账户。'
 expect(sceneTimeNarrative(date,text)).toBe('客户已验收。支持安排到2025-07-26；¥3,600到期款仍归合作账户。')
 expect(sceneTimeNarrative(date,date+'，客户已验收。支持到2025-07-26。')).toBe('客户已验收。支持到2025-07-26。')
 expect(sceneTimeNarrative(date,'2025-07-18。客户寄来了回信。')).toBe('2025-07-18。客户寄来了回信。')
 expect(sceneTimeNarrative(date,'回信落款2025-07-19。')).toBe('回信落款2025-07-19。')
 expect(sceneTimeNarrative(date,date+'。')).toBe(date+'。')
 expect(sceneTimeNarrative('2025-07',text)).toBe(text)
 const notice=renderToStaticMarkup(<SceneTimeNotice date={date} text={text} frame={null} accountName={()=>'合作账户'} onClose={()=>{}}/>)
 expect(notice).toMatch(/<time[^>]*>2025-07-19<\/time>/)
 expect(notice).not.toContain('scene-time-result">2025-07-19。')
 const details=renderToStaticMarkup(<SceneEcho text={text} frame={null} accountName={()=>'合作账户'} onClose={()=>{}}/>)
 expect(details).toContain(text)
})

it('does not renew the Q4 action budget when the earned finite epilogue crosses New Year',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d10-epilogue-echo-budget'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d10-epilogue-echo-${++id}`})
 await controller.initialize()
 await controller.importNew(earnedEpilogue)
 try{
  const before=controller.snapshot.view!
  expect(before.origin).toBe('normal');expect(before.phase).toBe('epilogue');expect(before.date).toBe('2025-12-31');expect(before.budget.quarter).toBe('2025-Q4')
  const command=controller.prepare('AdvanceEpilogueTime',{date:'2026-01-01'})
  expect(controller.preview(command).allowed).toBe(true)
  expect((await controller.submit(command)).status).toBe('saved')
  const after=controller.snapshot.view!,raw=controller.exportSaved(),frame=committedEcho(before,after)
  expect(after.date).toBe('2026-01-01');expect(after.budget.quarter).toBe('2025-Q4');expect(after.budget.total).toBe(4)
  expect(frame).toMatchObject({quarterChanged:false,pointsBefore:before.budget.available,pointsAfter:after.budget.available,reservedBefore:before.budget.reserved,reservedAfter:after.budget.reserved,spentBefore:before.budget.spent,spentAfter:after.budget.spent})
  const html=renderToStaticMarkup(<SceneEcho text={savedSceneResult('AdvanceEpilogueTime','等候尚未结束的约定',before,after)} frame={frame} accountName={()=> '个人账户'} onClose={()=>{}}/>)
  expect(html).not.toContain('新季度');expect(html).toContain('已用行动');expect(html).toContain('预留行动')
  expect(controller.exportSaved()).toBe(raw)
 }finally{await controller.close();await store.close()}
},20000)
