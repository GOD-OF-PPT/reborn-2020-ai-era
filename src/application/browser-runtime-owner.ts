import { GameController } from './game-controller.ts'
import { createCampaignCodec } from './campaign.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { WebWriterAccess } from '../persistence/writer-lock.ts'
export async function createRuntimeOwner(options:{storageTest:string|null}){
 const codec=createCampaignCodec();let factory=indexedDB,name='reborn-2020-local-v1';let diagnostics:{name:string;trace:{writeSucceeded:boolean;abortIssued:boolean}}|null=null
 // Dev-only fault seam: the actual product UI and controller use an isolated database.
 const storageTest=import.meta.env.DEV?options.storageTest:null
 if(import.meta.env.DEV&&storageTest!==null&&['abort','abort-income','abort-video','abort-course','abort-relay','abort-routine','abort-equity','abort-equity-follow','abort-ecosystem','abort-story','abort-risk-evidence','abort-story-support','abort-life-work','abort-life-promise','abort-life-scene','abort-epilogue','abort-ending'].includes(storageTest)){
  const names:Record<string,string>={abort:'reborn-2020-t09-abort-validation','abort-income':'reborn-2020-t09-income-abort-validation','abort-video':'reborn-2020-t10-video-abort-validation','abort-course':'reborn-2020-t11-course-abort-validation','abort-relay':'reborn-2020-t12-relay-abort-validation','abort-routine':'reborn-2020-t12-routine-abort-validation','abort-equity':'reborn-2020-t13-equity-abort-validation','abort-ecosystem':'reborn-2020-t13-ecosystem-abort-validation','abort-story':'reborn-2020-t14-authority-abort-validation','abort-risk-evidence':'reborn-2020-t14-risk-evidence-abort-validation','abort-story-support':'reborn-2020-t14-support-abort-validation','abort-life-work':'reborn-2020-t15-life-work-abort-validation','abort-life-promise':'reborn-2020-t15-life-promise-abort-validation','abort-life-scene':'reborn-2020-t15-life-scene-abort-validation','abort-epilogue':'reborn-2020-t16-epilogue-abort-validation','abort-ending':'reborn-2020-t16-ending-abort-validation'}
  name=storageTest==='abort-equity-follow'?'reborn-2020-t17-equity-follow-abort-validation':names[storageTest]!;const {abortAfterHeadWrite}=await import('../testing/abort-after-write.ts')
  const fault=abortAfterHeadWrite(indexedDB,name,row=>{
   const saved=(row as {envelope?:{state?:{phase?:string;life?:{jobs?:{kind:string;status:string}[];promises?:{status:string}[]};story?:{grants?:{level:string}[];evidence?:unknown[];supportUses?:unknown[]};deepseek?:{agreements?:{followDecision?:string;followAmountFen?:number}[];contracts?:unknown[]};video?:{works?:unknown[]};course?:{payments?:unknown[]};relay?:{meters?:unknown[]};routines?:{plans?:{steps:{status:string}[]}[]};operations?:{contracts?:{status:string}[]}}}}).envelope?.state
   if(storageTest==='abort-equity-follow')return saved?.deepseek?.agreements?.some(a=>a.followDecision==='participated'&&(a.followAmountFen??0)>0)===true
   if(storageTest==='abort-epilogue')return saved?.phase==='epilogue'
   if(storageTest==='abort-ending')return saved?.phase==='finished'
   if(storageTest==='abort-life-work')return (saved?.life?.jobs?.length??0)>0
   if(storageTest==='abort-life-promise')return saved?.life?.promises?.some(p=>p.status==='accepted')===true
   if(storageTest==='abort-life-scene')return saved?.life?.jobs?.some(j=>j.kind==='workspace'&&j.status==='completed')===true
   if(storageTest==='abort-story-support')return (saved?.story?.supportUses?.length??0)>0
   if(storageTest==='abort-story')return saved?.story?.grants?.some(g=>g.level==='cross_flow')===true
   if(storageTest==='abort-risk-evidence')return (saved?.story?.evidence?.length??0)>0
   if(storageTest==='abort-equity')return (saved?.deepseek?.agreements?.length??0)>0
   if(storageTest==='abort-ecosystem')return (saved?.deepseek?.contracts?.length??0)>0
   if(storageTest==='abort-video')return (saved?.video?.works?.length??0)>0
   if(storageTest==='abort-course')return (saved?.course?.payments?.length??0)>0
   if(storageTest==='abort-relay')return (saved?.relay?.meters?.length??0)>0
   if(storageTest==='abort-routine')return saved?.routines?.plans?.some(p=>p.steps.some(s=>s.status==='completed'))===true
   return storageTest!=='abort-income'||saved?.operations?.contracts?.some(c=>c.status==='settled')===true
  });factory=fault.factory;diagnostics={name,trace:fault.trace}
 }

 const store=new IndexedDbRunStore({codec,factory,name}),controller=new GameController({codec,store,locks:new WebWriterAccess(),yieldControl:()=>new Promise<void>(resolve=>setTimeout(resolve,0))})
 return {controller,diagnostics}
}
