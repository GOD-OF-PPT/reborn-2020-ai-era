import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createServer} from 'vite'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {playerThread} from '../../../../src/ui/player-thread.ts'
import {sceneMeaning} from '../../../../src/ui/scene-meaning.ts'
import type {PlayFeatures} from '../../../../src/ui/game-types.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
const out='goal-1/evidence/t17-acceptance-39/cumulative-debug-r51',input='goal-1/evidence/t17-acceptance-11/chrome-production-r12/r105-audit-correction-real-cash-saved.json'
const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-legacy-diagnosis'}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
const put=(name:string,text:string)=>{guard(path.resolve(out));fs.writeFileSync(out+'/'+name,text,{flag:'wx'})}
const vite=await createServer({server:{middlewareMode:true,watch:null},appType:'custom'})
try{
 await controller.initialize();await controller.importNew(fs.readFileSync(input,'utf8'))
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,p={controller,view,features,accountId:'personal',request:()=>{throw Error('DIAGNOSTIC_RENDER_MUST_NOT_SUBMIT')}}
 const before=controller.exportSaved(),thread=playerThread(p),meaning=sceneMeaning({...p,accountId:thread.focus.accountId},thread)
 const {RoomMoment,roomMoment}=await vite.ssrLoadModule('/src/ui/RoomMoment.tsx')
 const html=renderToStaticMarkup(React.createElement(RoomMoment,{p,headingRef:null,onNavigate:()=>{},onExplore:()=>{}}))
 if(controller.exportSaved()!==before)throw Error('RENDER_CHANGED_ORIGINAL_SAVE')
 put('actual-room.html',html);put('actual-room.txt',html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' '))
 const report={input,date:view.date,revision:view.revision,budget:view.budget,fallback:roomMoment(p),thread,meaning,finance:features.workbench.finance.map(a=>({accountId:a.accountId,cashFen:a.cashFen,availableFen:a.availableFen,receivableFen:a.receivableFen,obligations:a.obligations})),relayReceivables:features.relay?.receivables,unchangedSave:true,newNative:0,compatibility:0}
 put('result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({date:view.date,revision:view.revision,focus:thread.focus,stage:thread.stage,legacy:thread.legacyFallbackRequired,meaning,unchangedSave:true}))
}finally{await vite.close();await controller.close();await store.close()}
