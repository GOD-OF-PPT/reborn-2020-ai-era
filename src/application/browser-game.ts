import { GameController } from './game-controller.ts'
import { createCampaignCodec } from './campaign.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { WebWriterAccess } from '../persistence/writer-lock.ts'
import { guardUnsavedClose } from './session.ts'
export async function createBrowserGame(){
 const codec=createCampaignCodec();let factory=indexedDB,name='reborn-2020-local-v1';let diagnostics:{name:string;trace:{writeSucceeded:boolean;abortIssued:boolean}}|null=null
 // Dev-only fault seam: the actual product UI and controller use an isolated database.
 const storageTest=import.meta.env.DEV?new URLSearchParams(location.search).get('storageTest'):null
 if(import.meta.env.DEV&&storageTest!==null&&['abort','abort-income','abort-video','abort-course','abort-relay','abort-routine','abort-equity','abort-ecosystem'].includes(storageTest)){
  const names:Record<string,string>={abort:'reborn-2020-t09-abort-validation','abort-income':'reborn-2020-t09-income-abort-validation','abort-video':'reborn-2020-t10-video-abort-validation','abort-course':'reborn-2020-t11-course-abort-validation','abort-relay':'reborn-2020-t12-relay-abort-validation','abort-routine':'reborn-2020-t12-routine-abort-validation','abort-equity':'reborn-2020-t13-equity-abort-validation','abort-ecosystem':'reborn-2020-t13-ecosystem-abort-validation'}
  name=names[storageTest]!;const {abortAfterHeadWrite}=await import('../testing/abort-after-write.ts')
  const fault=abortAfterHeadWrite(indexedDB,name,row=>{
   const saved=(row as {envelope?:{state?:{deepseek?:{agreements?:unknown[];contracts?:unknown[]};video?:{works?:unknown[]};course?:{payments?:unknown[]};relay?:{meters?:unknown[]};routines?:{plans?:{steps:{status:string}[]}[]};operations?:{contracts?:{status:string}[]}}}}).envelope?.state
   if(storageTest==='abort-equity')return (saved?.deepseek?.agreements?.length??0)>0
   if(storageTest==='abort-ecosystem')return (saved?.deepseek?.contracts?.length??0)>0
   if(storageTest==='abort-video')return (saved?.video?.works?.length??0)>0
   if(storageTest==='abort-course')return (saved?.course?.payments?.length??0)>0
   if(storageTest==='abort-relay')return (saved?.relay?.meters?.length??0)>0
   if(storageTest==='abort-routine')return saved?.routines?.plans?.some(p=>p.steps.some(s=>s.status==='completed'))===true
   return storageTest!=='abort-income'||saved?.operations?.contracts?.some(c=>c.status==='settled')===true
  });factory=fault.factory;diagnostics={name,trace:fault.trace}
 }

 const store=new IndexedDbRunStore({codec,factory,name}),controller=new GameController({codec,store,locks:new WebWriterAccess(),guard:guardUnsavedClose})
 return {controller,diagnostics}
}
