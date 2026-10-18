import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'
import {CinematicRoom} from './CinematicRoom.tsx'

it('renders a read-only room without advancing, including delivery and end-of-range UI projections',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d03-cinematic-room'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`cinema-${++id}`})
 await controller.initialize()
 await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'cinematic-read-only'})
 try{
  const original=controller.exportSaved(),view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures
  const request=()=>{throw Error('UI_READ_MUST_NOT_REQUEST_COMMAND')}
  const navigate=()=>{throw Error('UI_RENDER_MUST_NOT_NAVIGATE')}
  const common={controller,request,accountId:'personal',headingRef:null,notice:null,onNavigate:navigate,onPeople:navigate,onYear:navigate}
  const initial=renderToStaticMarkup(<CinematicRoom {...common} view={view} features={features}/>)
  expect(initial).toContain('电脑 · 经营')
  expect(initial).toContain('2020-01-01')
  expect(initial).toContain('推进下一节点')
  expect(initial).not.toContain('林舟</strong>')
  // These are explicit UI projections, not fabricated normal campaign completion evidence.
  const delivery={...features,workbench:{...features.workbench,progression:{...features.workbench.progression,requiresDelivery:true}}}
  const waiting=renderToStaticMarkup(<CinematicRoom {...common} view={view} features={delivery}/>)
  expect(waiting).toContain('处理这份交付')
  expect(waiting).not.toContain('推进下一节点')
  const ended={...features,workbench:{...features.workbench,atQuarterEnd:true}}
  const final=renderToStaticMarkup(<CinematicRoom {...common} view={{...view,date:'2025-12-31'}} features={ended}/>)
  expect(final).not.toContain('推进下一节点')
  expect(final).not.toContain('进入下一季')
  expect(controller.exportSaved()).toBe(original)
 }finally{await controller.close();await store.close()}
},20000)
