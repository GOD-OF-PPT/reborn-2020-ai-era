import {expect,it} from 'vitest'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import normalOldAsset from '../../goal-1/evidence/t16-epilogue/native-exit-prefix/normal-before-exit-accept.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import EquityPanel from './EquityPanel.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import type {PlayFeatures} from './game-types.ts'

it('keeps an actual no-buyer reply distinct from an expired real quote while preserving the later willing buyer',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t16-old-exit-history'}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await controller.initialize();await controller.importNew(normalOldAsset)
 try{
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=controller.exportSaved()
  expect(features.deepseek!.exits.map(e=>e.buyerWilling)).toEqual([false,true])
  const noop=()=>{throw Error('READING_QUOTE_HISTORY_MUST_NOT_ACT')},html=renderToStaticMarkup(createElement(EquityPanel,{controller,view,features,request:noop,accountId:'personal',assignment:{resources:['player-production'],startAt:view.date}}))
  expect(html).toContain('本次没有可接受的买方窗口，保留全部未售股份。')
  expect(html).toContain('¥7.11');expect(html).not.toContain('报价已经到期，未自动转让')
  const scene=renderToStaticMarkup(createElement(NarrativeScene,{controller,view,features,request:noop,accountId:'personal',screen:'deepseek',headingRef:null,personId:'tang-ying',onPerson:noop,onOpen:noop,onPeople:noop,onYear:noop,onNavigate:noop,receipt:null}))
  expect(scene).toContain('有限尾声');expect(scene).toContain('核对原协议与转让应收');expect(scene).not.toContain('寻找合作与核对参与条件');expect(scene).not.toContain('2027-Q3')
  expect(controller.exportSaved()).toBe(before);expect(before).toBe(normalOldAsset)
 }finally{await controller.close();await store.close()}
},60000)
