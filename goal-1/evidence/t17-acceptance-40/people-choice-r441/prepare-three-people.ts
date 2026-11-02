import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {createCampaignCodec} from '../../../../.delivery/t17-u6-people-r446/src/application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../../../../.delivery/t17-u6-people-r446/src/core/commands.ts'
import {canonicalJson} from '../../../../.delivery/t17-u6-people-r446/src/core/identity.ts'
const root='goal-1/evidence/t17-acceptance-40/people-choice-r441',snapshot=JSON.parse(fs.readFileSync(root+'/snapshot446.json','utf8'))
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex')
const exact=()=>snapshot.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(snapshot.target,r.path)))===r.sha256)
if(!exact()||fs.existsSync(root+'/stopped.json'))throw Error('EXACT_ACTIVE446_REQUIRED')
const codec=createCampaignCodec(),raw=fs.readFileSync(root+'/qa93.readonly-ui-export.json','utf8'),run=codec.import(raw),original=codec.import(fs.readFileSync('goal-1/evidence/t17-acceptance-40/equity-worker-r329/prelude-r1/before-winddown.json','utf8'))
if(hash(raw)!=='698187d8fcfff0e0cbc1ecfec846f36c5252ccb29ed53e47fc339f2c514471c5'||codec.export(run)!==raw||run.origin!=='normal'||run.revision!==93||run.runId!==original.runId||original.receipts.some((r,i)=>canonicalJson(r)!==canonicalJson(run.receipts[i])))throw Error('ORIGINAL_UI93_AND92_PREFIX_REQUIRED')
const previous=run.receipts.at(-1)!,view=projectRun(run)
if(previous.commandId===original.receipts.at(-1)!.commandId||JSON.parse(previous.payloadSignature).kind!=='AdvanceTime'||view.date!=='2025-04-03'||view.budget.available!==1)throw Error('ACTUAL_CLOCK93_REQUIRED')
const companies=view.operations!.businesses.filter(b=>b.definitionId==='ecosystem-service'&&b.company&&b.lifecycle==='operating')
if(companies.length!==1)throw Error('UNIQUE_ORIGINAL_COMPANY_REQUIRED')
const command={runId:run.runId,actorId:run.actorId,commandId:'u6-three-people-qa-v1:94',expectedRevision:run.revision,kind:'HireWorker',payload:{businessId:companies[0]!.id,definitionId:'assistant-zhou'}}
const preview=previewCommand(run,command,codec.registry,run.actorId)
if(!preview.allowed)throw Error('ORIGINAL_HIRE_REFUSED:'+preview.reasonCodes.join(','))
const result=evaluateCommand(run,command,codec.registry,run.actorId)
if(result.status!=='proposed')throw Error('ORIGINAL_HIRE_NOT_PROPOSED')
const next=codec.export(result.nextRun),loaded=codec.import(next),nextView=projectRun(loaded),active=nextView.operations!.workers.filter(w=>w.to===null)
if(canonicalJson(loaded)!==canonicalJson(result.nextRun)||loaded.revision!==94||nextView.date!==view.date||nextView.budget.available!==0||active.length!==2||!active.some(w=>w.definitionId==='assistant-zhou')||run.receipts.some((r,i)=>canonicalJson(r)!==canonicalJson(loaded.receipts[i]))||!exact())throw Error('EXACT_HIRE_RESULT_REQUIRED')
fs.writeFileSync(root+'/qa94-two-workers.json',next,{flag:'wx'})
const report={at:new Date().toISOString(),source:snapshot.target,sourceExact:true,original92PrefixSame:true,input93:{bytes:Buffer.byteLength(raw),sha256:hash(raw),date:view.date,budget:view.budget,accounts:view.accounts,lastReceipt:previous},command,preview,output94:{bytes:Buffer.byteLength(next),sha256:hash(next),date:nextView.date,budget:nextView.budget,accounts:nextView.accounts,workers:active,lastReceipt:loaded.receipts.at(-1)},fullCodecEqual:true,scope:'One original kernel recruitment after actual UI93; not Native recruitment, not Main, no state injection',compatibility:0,wholeU6Complete:false}
fs.writeFileSync(root+'/qa94-preparation.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log({revision:94,date:nextView.date,workers:active.length,budget:nextView.budget,bytes:Buffer.byteLength(next),sha256:hash(next)})
