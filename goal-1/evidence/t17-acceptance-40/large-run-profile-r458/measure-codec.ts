import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {createCampaignCodec} from '../../../../.delivery/t17-u6-art-r416/src/application/campaign.ts'
import {canonicalJson} from '../../../../.delivery/t17-u6-art-r416/src/core/identity.ts'
const root='goal-1/evidence/t17-acceptance-40/large-run-profile-r458',label=process.argv[2],mode=process.argv[3]??'roundtrip'
if(!/^[-a-z0-9]+$/.test(label??'')||!['roundtrip','import'].includes(mode)||fs.existsSync(root+'/stopped.json'))throw Error('ACTIVE_EXPLICIT_PROFILE_REQUIRED')
const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex'),meta=JSON.parse(fs.readFileSync(root+'/baseline.json','utf8')),source=JSON.parse(fs.readFileSync(root+'/source416.json','utf8')),exact=()=>source.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(source.target,r.path)))===r.sha256),log=fs.openSync(root+'/'+label+'.phases.jsonl','wx'),measurements:unknown[]=[],started=performance.now()
const note=(row:unknown)=>{const line=JSON.stringify(row);fs.writeSync(log,line+'\n');console.log(line)}
function phase<T>(name:string,fn:()=>T):T{note({phase:name,status:'start',wallMs:performance.now()-started});const start=performance.now(),cpu=process.cpuUsage();const value=fn(),spent=process.cpuUsage(cpu),row={phase:name,status:'end',wallMs:performance.now()-start,cpuUserMs:spent.user/1000,cpuSystemMs:spent.system/1000,memory:process.memoryUsage()};measurements.push(row);note(row);return value}
let status='running'
try{
 if(!phase('source-before',exact))throw Error('FROZEN416_CHANGED')
 const raw=phase('read-input',()=>fs.readFileSync(root+'/input-normal.json','utf8'));if(Buffer.byteLength(raw)!==meta.input.bytes||hash(raw)!==meta.input.sha256)throw Error('PINNED_INPUT_CHANGED')
 const parsed=phase('JSON-parse-only',()=>JSON.parse(raw));if(parsed.revision!==meta.input.revision)throw Error('EXACT_REVISION_REQUIRED')
 const codec=phase('create-codec',()=>createCampaignCodec()),run=phase('codec-import',()=>codec.import(raw));if(run.revision!==meta.input.revision||run.origin!=='normal')throw Error('EXACT_NORMAL_STATE_REQUIRED')
 note({phase:'imported-counts',revision:run.revision,date:run.timeline.cursor.date,commandReceipts:run.receipts.length,ledgerReceipts:run.economy.ledger.receipts.length,ledgerTransactions:run.economy.ledger.transactions.length,timelineReceipts:run.timeline.receipts.length,pendingEvents:run.timeline.pending.length,causes:run.causes.length,relayPeriods:run.relay?.periods.length,relayStateKeys:run.relay?Object.keys(run.relay):[]})
 let exportEqual:boolean|null=null,logical:{bytes:number;sha256:string}|null=null
 if(mode==='roundtrip'){
  const exported=phase('codec-export',()=>codec.export(run));exportEqual=exported===raw;if(!exportEqual)throw Error('WHOLE_ORIGINAL_WIRE_CHANGED')
  logical=phase('canonical-whole-run',()=>{const text=canonicalJson(run);return{bytes:Buffer.byteLength(text),sha256:hash(text)}})
 }
 if(!phase('source-after',exact))throw Error('FROZEN416_CHANGED');status='complete'
 const report={at:new Date().toISOString(),label,mode,node:process.version,pid:process.pid,source:416,input:meta.input,status,measurements,wholeOriginalWireEqual:exportEqual,logicalWholeRun:logical,totalWallMs:performance.now()-started,controllerOrNative:false,formalPerformancePass:false,compatibility:0,wholeU6Complete:false};fs.writeFileSync(root+'/'+label+'.result.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});note({phase:'complete',totalWallMs:report.totalWallMs,wholeOriginalWireEqual:exportEqual})
}catch(error){status='failed';fs.writeFileSync(root+'/'+label+'.error.json',JSON.stringify({at:new Date().toISOString(),status,error:String(error),stack:error instanceof Error?error.stack:null,measurements,totalWallMs:performance.now()-started,compatibility:0},null,2)+'\n',{flag:'wx'});throw error}finally{fs.closeSync(log)}
