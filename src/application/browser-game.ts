import { GameController } from './game-controller.ts'
import { createCampaignCodec } from './campaign.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { WebWriterAccess } from '../persistence/writer-lock.ts'
import { guardUnsavedClose } from './session.ts'
export async function createBrowserGame(){
 const codec=createCampaignCodec();let factory=indexedDB,name='reborn-2020-local-v1';let diagnostics:{name:string;trace:{writeSucceeded:boolean;abortIssued:boolean}}|null=null
 // Dev-only fault seam: the actual product UI and controller use an isolated database.
 const storageTest=import.meta.env.DEV?new URLSearchParams(location.search).get('storageTest'):null
 if(import.meta.env.DEV&&(storageTest==='abort'||storageTest==='abort-income'||storageTest==='abort-video'||storageTest==='abort-course')){
  name=storageTest==='abort-course'?'reborn-2020-t11-course-abort-validation':storageTest==='abort-video'?'reborn-2020-t10-video-abort-validation':storageTest==='abort-income'?'reborn-2020-t09-income-abort-validation':'reborn-2020-t09-abort-validation';const {abortAfterHeadWrite}=await import('../testing/abort-after-write.ts');const fault=abortAfterHeadWrite(indexedDB,name,row=>storageTest==='abort-course'?((row as {envelope?:{state?:{course?:{payments?:unknown[]}}}})?.envelope?.state?.course?.payments?.length??0)>0:storageTest==='abort-video'?((row as {envelope?:{state?:{video?:{works?:unknown[]}}}})?.envelope?.state?.video?.works?.length??0)>0:storageTest!=='abort-income'||(row as {envelope?:{state?:{operations?:{contracts?:{status:string}[]}}}})?.envelope?.state?.operations?.contracts?.some(c=>c.status==='settled')===true);factory=fault.factory;diagnostics={name,trace:fault.trace}
 }
 const store=new IndexedDbRunStore({codec,factory,name}),controller=new GameController({codec,store,locks:new WebWriterAccess(),guard:guardUnsavedClose})
 return {controller,diagnostics}
}
