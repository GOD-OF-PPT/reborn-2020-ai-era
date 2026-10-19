import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {ClockCommandDetails} from './ClockCommandDetails.tsx'

it('renders the actual original dated500 payment and reservation separately from a free clock instruction',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t17-clock-context-view'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`clock-view-${++id}`})
 try{
  await controller.initialize();await controller.newLife({backgroundId:'content_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'t17-clock-context-view'})
  expect((await controller.submit(controller.prepare('StartFirstOrder',{}))).status).toBe('saved')
  const before=controller.exportSaved(),projection=controller.clockCommitments(controller.prepare('AdvanceTime',{date:'2020-01-05'}))
  const html=renderToStaticMarkup(<ClockCommandDetails projection={projection} accountName={()=>'个人账户'}/>)
  expect(html).toContain('2020-01-05');expect(html).toContain('¥500');expect(html).toContain('已列为资金占款');expect(html).toContain('不另占一份');expect(html).toContain('未到账不能支持当前支出')
  expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
})
