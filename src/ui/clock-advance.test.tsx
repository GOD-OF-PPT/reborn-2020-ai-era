import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {ClockAdvance} from './ClockAdvance.tsx'
import {SceneTimeNotice} from './SceneEcho.tsx'
import type {PlayFeatures} from './game-types.ts'

it('time controls expose the original500 and optional review without rendering or executing a mandatory time dialog',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t17-clock-play'}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 try{
  await controller.initialize();await controller.newLife({backgroundId:'content_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'t17-clock-play'})
  expect((await controller.submit(controller.prepare('StartFirstOrder',{}))).status).toBe('saved')
  const view=controller.snapshot.view!,before=controller.exportSaved(),features=view.features as unknown as PlayFeatures
  const html=renderToStaticMarkup(<ClockAdvance p={{controller,view,features,accountId:'personal',request:()=>{throw Error('RENDER_MUST_NOT_ADVANCE')}}} date="2020-01-05" label="让日子向前 · 2020-01-05"/>)
  expect(html).toContain('个人已知待付¥500');expect(html).toContain('先核对');expect(html).toContain('Space');expect(html).not.toContain('<dialog')
  const stale=renderToStaticMarkup(<ClockAdvance p={{controller,view:{...view,date:'2020-02-01'},features,accountId:'personal',request:()=>{throw Error('RENDER_MUST_NOT_ADVANCE')}}} date="2020-01-05" label="旧界面的日期"/>)
  expect(stale).toContain('原支出待核对');expect(stale).not.toContain('个人已知待付¥500')
  const notice=renderToStaticMarkup(<SceneTimeNotice date={view.date} text="原实际记录" frame={null} onClose={()=>{throw Error('RENDER_MUST_NOT_DISMISS')}} accountName={()=>'个人账户'}/>)
  expect(notice).toContain('查看回响');expect(notice).not.toContain('<dialog');expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
})
