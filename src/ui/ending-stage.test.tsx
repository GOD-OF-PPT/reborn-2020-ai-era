import {expect,it} from 'vitest'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import earnedEnding from '../../goal-1/evidence/t16-epilogue/asset-a01/normal-asset-finished.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EndingStage} from './EndingStage.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import type {PlayFeatures} from './game-types.ts'

it('retains the actual old partial-sale ending and every dated recovery assumption in the public read-only review',async()=>{
 const codec=createCampaignCodec(),run=codec.import(earnedEnding),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t16-earned-ending-review'}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await controller.initialize();await controller.importNew(earnedEnding)
 try{
  const before=controller.exportSaved(),view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,e=features.journey!.ending!,archive=run.journey!.endings.at(-1)!
  expect(run.origin).toBe('normal');expect(features.journey!.closedQuarters).toBe(24);expect(run.deepseek!.exits.some(e=>e.collectedFen>0)).toBe(true)
  expect(e.archives.at(-1)).toMatchObject({date:archive.date,sourceRevision:archive.sourceRevision,estimates:archive.estimates})
  expect(e.archives.at(-1)!.estimates.some(a=>a.kind==='private_asset'&&a.estimatedFen<a.basisFen)).toBe(true)
  expect(e.lockedEquity[0]!.shares).toBe(1250)
  const noop=()=>{throw Error('READING_ENDING_MUST_NOT_ACT')},html=renderToStaticMarkup(createElement(EndingStage,{p:{controller,view,features,request:noop,accountId:'personal'},headingRef:null,onOpen:noop,onJourney:noop,onNewLife:noop}))
  expect(html).toContain('真实因果胶片');expect(html).toContain('选择分享片段');expect(html).toContain('从2020，再作选择')
  const scene=renderToStaticMarkup(createElement(NarrativeScene,{controller,view,features,request:noop,accountId:'personal',screen:'market',headingRef:null,personId:'tang-ying',onPerson:noop,onOpen:noop,onPeople:noop,onYear:noop,onNavigate:noop,receipt:null}))
  expect(scene).toContain('已经归档');expect(scene).toContain('核对原持仓与交收');expect(scene).not.toContain('再给判断一个仓位');expect(scene).not.toContain('2027-Q3')
  expect(controller.exportSaved()).toBe(before);expect(before).toBe(earnedEnding)
 }finally{await controller.close();await store.close()}
},20000)
