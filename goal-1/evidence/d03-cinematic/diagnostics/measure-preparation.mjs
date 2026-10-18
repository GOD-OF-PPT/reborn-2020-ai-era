import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {evidenceDirectory} from '../../../../scripts/evidence-output.ts'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {replayNormalRelay} from '../../../../src/testing/normal-relay-scenario.ts'
import {normalStoryPayrollReady,normalStoryPrepared} from '../../../../src/testing/normal-story-scenario.ts'

const root=fileURLToPath(new URL('../../../../',import.meta.url)),out=evidenceDirectory(root,'preparation-measurement.json'),index=process.argv.indexOf('--source-freeze'),freezePath=index<0?'goal-1/evidence/d03-cinematic/candidate1-source-freeze.json':process.argv[index+1]
if(readdirSync(out).length)throw Error('FRESH_PREPARATION_MEASUREMENT_REQUIRED')
const sha=v=>createHash('sha256').update(v).digest('hex'),freeze=JSON.parse(readFileSync(join(root,freezePath),'utf8')).sha256,codec=createCampaignCodec(),stages=[]
const verify=()=>{for(const [p,h] of Object.entries(freeze))if(sha(readFileSync(join(root,p)))!==h)throw Error('MEASUREMENT_SOURCE_CHANGED:'+p)}
verify()
function measure(name,build){
 const begin=performance.now(),cpu=process.cpuUsage(),result=build(),used=process.cpuUsage(cpu),wallMs=performance.now()-begin,run=result.run??result
 const proofStart=performance.now(),raw=codec.export(run)
 if(run.origin!=='normal'||codec.export(codec.import(raw))!==raw)throw Error('NORMAL_ROUNDTRIP_REQUIRED')
 writeFileSync(join(out,name+'.json'),raw,{flag:'wx'})
 const row={name,runId:run.runId,revision:run.revision,seed:run.seed,date:run.timeline.cursor.date,commands:run.receipts.length-1,wallMs,userMs:used.user/1000,systemMs:used.system/1000,proofExportMs:performance.now()-proofStart,file:name+'.json',sha256:sha(raw)}
 stages.push(row);console.log(JSON.stringify(row));return result
}
const base=measure('relay-base',()=>replayNormalRelay('technical_employee').run)
measure('payroll-ready',()=>normalStoryPayrollReady(base).h.run)
measure('risk-prepared',()=>{const normal=normalStoryPrepared('technical_employee','t14-normal-risk-4');codec.import(normal.firstResult);return normal.h.run})
verify()
writeFileSync(join(out,'preparation-measurement.json'),JSON.stringify({scope:'Standalone exact existing relay/payroll/risk setup functions; original gameplay commands retained. Measurements exclude proof exports, which occur between stages and can warm later work. Not Vitest/browser performance or unique timing-cause proof.',sourceFreeze:freezePath,stages},null,2)+'\n',{flag:'wx'})
