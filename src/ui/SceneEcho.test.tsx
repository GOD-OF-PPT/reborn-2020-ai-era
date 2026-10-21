import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'
import {committedEcho,SceneEcho,SceneTimeNotice} from './SceneEcho.tsx'
import {savedSceneResult} from './scene-result.ts'

it('shows the actual completed work and later cash receipt without opening the optional account reel',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d08-visible-time-result'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d08-echo-${++id}`})
 await controller.initialize()
 await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d08-visible-time-result'})
 try{
  expect((await controller.submit(controller.prepare('StartFirstOrder',{}))).status).toBe('saved')
  const beforeProduction=controller.snapshot.view!
  expect((await controller.submit(controller.prepare('AdvanceTime',{date:'2020-01-19'}))).status).toBe('saved')
  const completed=controller.snapshot.view!,rawCompleted=controller.exportSaved()
  const completedText=savedSceneResult('AdvanceTime','等待原作品完成',beforeProduction,completed)
  const completedHtml=renderToStaticMarkup(<SceneTimeNotice date={completed.date} text={completedText} frame={committedEcho(beforeProduction,completed)} accountName={()=>'个人账户'} onClose={()=>{throw Error('RENDER_MUST_NOT_CLOSE')}}/>)
  expect(completedHtml).toContain('这份作品已经做完')
  expect(completedHtml).toContain('下一步，要由你亲手交给客户')
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
