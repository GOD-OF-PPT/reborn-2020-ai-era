import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {replayNormalDeepseek} from '../../../../src/testing/normal-deepseek-scenario.ts'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import type {GameRun} from '../../../../src/core/run-types.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'

const root='goal-1/evidence/t17-acceptance-38/normal-service-r13',codec=createCampaignCodec(),sha=(s:string)=>createHash('sha256').update(s).digest('hex')
const source='src/testing/normal-deepseek-scenario.ts',sourceHash=sha(readFileSync(source,'utf8')),driverHash=sha(readFileSync(root+'/driver.ts','utf8')),stop=Symbol('Stop before original U6 equity command')
const rows:unknown[]=[]
const write=(name:string,text:string)=>{guard(root);writeFileSync(root+'/'+name,text,{flag:'wx'})}
for(const backgroundId of ['technical_employee','content_employee']){
 const saved=new Map<string,string>(),productId=backgroundId==='technical_employee'?'deployment':'training'
 const capture=(stage:string,run:GameRun)=>{
  if(saved.has(stage))return
  const raw=codec.export(run),file=backgroundId+'-'+stage+'.json'
  if(run.origin!=='normal'||run.deepseek?.counterfactualEnabledAt!==null||run.deepseek.agreements.length||run.deepseek.invitations.length)throw Error('NORMAL_SERVICE_ONLY_REQUIRED')
  write(file,raw);saved.set(stage,file)
  const b=run.operations!.businesses.find(b=>b.definitionId==='ecosystem-service'),c=run.deepseek.contracts[0],balance=c?run.economy.ledger.contracts.find(n=>n.id===c.id):null
  const paidCollections=run.deepseek.collections.filter(n=>n.contractId===c?.id).reduce((n,row)=>n+row.amountFen,0)
  rows.push({file,origin:'model_generated_normal_not_native',source:'Unmodified replayNormalDeepseek fixed normal-deepseek-s04-v1; callback captures only, no synthetic funds/qualifications/outcomes',stage,backgroundId,productId,runId:run.runId,revision:run.revision,date:run.timeline.cursor.date,bytes:Buffer.byteLength(raw),sha256:sha(raw),normal:true,newNativeCreate:0,business:b?{id:b.id,accountId:b.accountId,lifecycle:b.lifecycle}:null,contract:c?{id:c.id,modelId:c.modelId,productId:c.productId,scope:c.scope,status:c.status,priceFen:c.priceFen,hasRemediation:c.remediationJobId!==null}:null,balance,paidCollectionsFen:paidCollections})
 }
 try{
  replayNormalDeepseek(backgroundId,{runId:'u5-r13-normal-'+backgroundId,onCommitted(run){
   const day=run.timeline.cursor.date,quiet=run.timeline.pause===null&&run.timeline.cursor.phase==='snapshot'
   if(quiet&&day==='2024-05-06'&&!run.operations!.businesses.some(b=>b.definitionId==='ecosystem-service'))capture('before-open',run)
   if(quiet&&day==='2024-07-01'&&run.deepseek!.contracts.length===0)capture('before-contract',run)
   if(quiet&&day==='2025-04-01'){
    const c=run.deepseek!.contracts[0],balance=c&&run.economy.ledger.contracts.find(n=>n.id===c.id)
    if(!c||c.productId!==productId||c.status!=='completed'||!balance||balance.receivableFen!==0||balance.prepaidFen!==0||balance.recognizedIncomeFen!==c.priceFen)throw Error('ORIGINAL_FULL_SERVICE_RESULT_REQUIRED')
    capture('service-completed-before-equity',run);throw stop
   }
  }})
  throw Error('STOP_BEFORE_EQUITY_WAS_NOT_REACHED')
 }catch(error){if(error!==stop)throw error}
 if(saved.size!==3)throw Error('ALL_THREE_NORMAL_STAGES_REQUIRED:'+backgroundId)
 console.log(JSON.stringify({backgroundId,productId,stages:[...saved.keys()],newNativeCreate:0}))
}
if(sha(readFileSync(source,'utf8'))!==sourceHash||sha(readFileSync(root+'/driver.ts','utf8'))!==driverHash)throw Error('MODEL_DRIVER_OR_SOURCE_CHANGED')
write('result.json',JSON.stringify({at:new Date().toISOString(),scope:'Two normal model trajectories; not Native gameplay, not formal human or independent acceptance',seed:'normal-deepseek-s04-v1',source,sourceHash,driverHash,backgrounds:2,files:rows.length,newModelCreates:2,newNativeCreate:0,noEquityCommands:true,rows},null,2)+'\n')
