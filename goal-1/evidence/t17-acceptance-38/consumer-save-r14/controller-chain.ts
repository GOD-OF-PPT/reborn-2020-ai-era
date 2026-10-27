import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../../../../src/testing/abort-after-write.ts'
import {ecosystemFocusFor,ecosystemFocusFromSaved,ecosystemJourneyFor} from '../../../../src/ui/ecosystem-player-thread.ts'
import type {GamePanelProps,PlayFeatures} from '../../../../src/ui/game-types.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'

const root='goal-1/evidence/t17-acceptance-38/consumer-save-r14',hash=(s:string)=>createHash('sha256').update(s).digest('hex'),rows:unknown[]=[]
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b),require=(condition:unknown,label:string)=>{if(!condition)throw Error(label)}
const write=(file:string,text:string,source:string)=>{guard(root);writeFileSync(root+'/'+file,text,{flag:'wx'});const state=JSON.parse(text).state,row={file,origin:'controller_fake_idb_not_native',source,bytes:Buffer.byteLength(text),sha256:hash(text),runId:state.runId,revision:state.revision};guard(root);writeFileSync(root+'/exports.jsonl',JSON.stringify(row)+'\n',{flag:'a'});return row}
for(const [backgroundId,productId] of [['technical_employee','deployment'],['content_employee','training']] as const){
 const start=Date.now(),marks:{phase:string;ms:number}[]=[],mark=(phase:string)=>{marks.push({phase,ms:Date.now()-start});console.log(JSON.stringify({backgroundId,...marks.at(-1)}))},raw=readFileSync('goal-1/evidence/t17-acceptance-38/normal-service-r13/'+backgroundId+'-before-contract.json','utf8'),codec=createCampaignCodec(),factory=new IDBFactory(),name='u5-r14-original-chain-'+productId,locks=new MemoryWriterAccess()
 const fault=abortAfterHeadWrite(factory,name,row=>((row as {envelope?:{state?:{deepseek?:{contracts?:readonly unknown[]}}}}).envelope?.state?.deepseek?.contracts?.length??0)>0),store=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name}),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks}),reader=new GameController({codec,store:physical,locks})
 try{
  await controller.initialize();await controller.importNew(raw);mark('original normal import')
  const before=controller.snapshot.view!,features=before.features as unknown as PlayFeatures,v=features.deepseek!,b=v.businesses.find(b=>b.definitionId==='ecosystem-service')!,price=v.catalog.products.find(p=>p.id===productId)!.priceFen,lead=v.leads.find(l=>l.productId===productId&&l.status==='open'&&l.maxPriceFen>=price)!
  require(before.origin==='normal'&&before.date==='2024-07-01'&&v.contracts.length===0&&lead,'NORMAL_BEFORE_CONTRACT_REQUIRED')
  const input:GamePanelProps={controller,view:before,features,accountId:b.accountId,request:()=>{}},target={kind:'lead' as const,recordId:lead.id,runId:before.runId,businessId:b.id,accountId:b.accountId},focus=ecosystemFocusFor(input,target),body={leadId:lead.id,scope:'standard',resources:['player-production'],startAt:'2024-07-02'},command=controller.prepare('AcceptEcoContract',body)
  require(controller.preview(command).allowed,'ORIGINAL_PREVIEW_REQUIRED');require((await controller.submit(command)).status==='unsaved','ACTUAL_ABORT_REQUIRED');require(fault.trace.writeSucceeded&&fault.trace.abortIssued,'ACTUAL_HEAD_WRITE_AND_ABORT_REQUIRED');mark('actual original head.put succeeded then aborted')
  const candidate=controller.exportCandidate(),afterAbort=controller.snapshot.view!,oldSaved=controller.exportSaved(),oldPhysical=await physical.exportStored(before.runId),candidateInput={...input,view:afterAbort,features:afterAbort.features as unknown as PlayFeatures}
  require(oldSaved===raw&&oldPhysical===raw&&afterAbort.revision===before.revision&&same(afterAbort.accounts,before.accounts)&&same(afterAbort.budget,before.budget),'OLD_PHYSICAL_AND_PUBLISHED_STATE_REQUIRED')
  require(ecosystemJourneyFor(candidateInput,focus).phase==='lead-open'&&ecosystemFocusFromSaved(input,candidateInput,'AcceptEcoContract',body,focus)===null,'CANDIDATE_MUST_NOT_PUBLISH_OBJECT')
  const oldRow=write(backgroundId+'-physical-old.json',oldPhysical!,'Original physical IndexedDbRunStore API after actual abort; fake IndexedDB functional check, not browser'),candidateRow=write(backgroundId+'-candidate.json',candidate,'Original controller candidate exported after actual head.put abort; no re-evaluation');mark('old scene and physical old bytes verified')
  await reader.initialize();await reader.continueLife(before.runId);const readOnlyResult=await reader.submit(reader.prepare('DeclineEcoLead',{leadId:lead.id}));require(reader.snapshot.view!.readOnly&&reader.exportSaved()===raw&&readOnlyResult.status==='rejected'&&readOnlyResult.reasonCodes.includes('READ_ONLY_SESSION'),'REAL_READER_READ_ONLY_REQUIRED');mark('second controller read-only and old bytes verified')
  require((await controller.retry()).status==='saved','ORIGINAL_RETRY_REQUIRED');const saved=controller.snapshot.view!,physicalNew=await physical.exportStored(before.runId);require(controller.exportSaved()===candidate&&physicalNew===candidate&&saved.revision===before.revision+1,'EXACT_ORIGINAL_CANDIDATE_COMMIT_REQUIRED')
  const savedInput={...input,view:saved,features:saved.features as unknown as PlayFeatures},next=ecosystemFocusFromSaved(input,savedInput,'AcceptEcoContract',body,focus),c=savedInput.features.deepseek!.contracts[0]!
  require(next?.ecosystemTarget?.kind==='contract'&&ecosystemJourneyFor(savedInput,next).phase==='production-planned'&&c.productId===productId&&c.balance?.prepaidFen===c.priceFen/2&&c.balance.recognizedIncomeFen===0,'SAVED_SAME_OBJECT_AND_REAL_PREPAYMENT_REQUIRED')
  await reader.reload();require(reader.snapshot.view!.readOnly&&reader.exportSaved()===candidate&&reader.snapshot.view!.revision===saved.revision,'PHYSICAL_NEW_READER_RELOAD_REQUIRED');mark('original retry physical new and reader reloaded')
  const newRow=write(backgroundId+'-physical-new.json',physicalNew!,'Original physical new bytes after original candidate retry; fake IndexedDB, not browser');rows.push({backgroundId,productId,originalRevision:before.revision,savedRevision:saved.revision,originalCommand:command,trace:{...fault.trace},oldRow,candidateRow,newRow,candidateExactlyCommitted:true,readerReadOnly:true,oldObjectPreservedBeforeSave:true,committedObjectAfterSave:next,marks,wallMs:Date.now()-start})
 }finally{await reader.close();await controller.close(true);await physical.close();await store.close()}
}
guard(root);writeFileSync(root+'/controller-result.json',JSON.stringify({at:new Date().toISOString(),scope:'Separate original controller/session/codec/fake-IndexedDB functional run plus pure saved-focus consumers; no React handler execution, no browser storage, not the original5s unit batch or Native/human acceptance',unitTimeoutsRetained:['checks-r43-normal-original-save'],newNativeCreate:0,newNativeCommands:0,allFunctionalChecksPassed:true,rows},null,2)+'\n',{flag:'wx'})
