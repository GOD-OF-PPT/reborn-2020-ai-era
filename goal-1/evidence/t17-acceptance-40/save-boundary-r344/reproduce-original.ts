import fs from 'node:fs'
import path from 'node:path'
import {performance} from 'node:perf_hooks'
import {createHash} from 'node:crypto'
import {createCampaignCodec} from '../../../../.delivery/t17-u6-worker-r342/src/application/campaign.ts'
import {canonicalJson} from '../../../../.delivery/t17-u6-worker-r342/src/core/identity.ts'
import {hashText,utf8Length} from '../../../../.delivery/t17-u6-worker-r342/src/core/hash.ts'
import {inspectJsonInput} from '../../../../.delivery/t17-u6-worker-r342/src/core/json-input.ts'
import {MAX_ENCODED_SAVE_BYTES,MAX_LOGICAL_SAVE_BYTES,MAX_LOGICAL_SAVE_NODES} from '../../../../.delivery/t17-u6-worker-r342/src/persistence/save-packing.ts'
import {verifySeal,ident} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
const base='goal-1/evidence/t17-acceptance-40',out=base+'/save-boundary-r344',input=base+'/normal-capital-continue-r327/head.current.json',proposal=base+'/normal-capital-continue-r327/unwritten-proposal.json',codec=createCampaignCodec(),source=JSON.parse(fs.readFileSync(base+'/equity-worker-r329/snapshot342.json','utf8')),start=performance.now(),hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex')
const exact=()=>source.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(source.target,r.path)))===r.sha256)
if(!exact())throw Error('EXACT342_REQUIRED')
const seal=verifySeal(base+'/normal-capital-continue-r327');guard(out)
const log=fs.openSync(out+'/repro-progress.jsonl','wx'),progress=(phase:string,extra:unknown={})=>{const row={at:new Date().toISOString(),phase,...extra as object};fs.writeSync(log,JSON.stringify(row)+'\n');console.log(JSON.stringify(row))}
const raw=fs.readFileSync(input,'utf8'),unsaved=fs.readFileSync(proposal,'utf8')
if(hash(raw)!=='9fa6fda4b28cdbb7bfcf02a29cc660f6530f9a45d5a955ba0ecbce892daf0ee3'||hash(unsaved)!=='374e965a6bfd023935937f2cc10d65906d4090ccb6f5a5a90369afb646c14d80')throw Error('ORIGINAL_INPUT_REQUIRED')
progress('import-original304')
const saved=codec.import(raw);if(saved.revision!==304||saved.origin!=='normal')throw Error('NORMAL304_REQUIRED')
progress('export-original304');if(codec.export(saved)!==raw)throw Error('ORIGINAL304_BYTES_CHANGED')
const run=JSON.parse(unsaved);progress('validate-original-unsaved305')
const state=codec.validateRun(run);if(state.revision!==305||state.runId!==saved.runId||state.seed!==saved.seed)throw Error('ORIGINAL305_REQUIRED')
const attempts=[]
for(let i=0;i<2;i++){progress('original-export305',{attempt:i+1});const t=performance.now();let error:string|null=null,stack:string|null=null;try{codec.export(state)}catch(e){error=String(e);stack=e instanceof Error?e.stack??null:null}if(!error?.includes('SAVE_TOO_LARGE'))throw Error('SAME_ORIGINAL_FAILURE_REQUIRED');attempts.push({error,stack,wallMs:performance.now()-t});progress('original-export305-failed',{attempt:i+1,error})}
const body={saveVersion:1 as const,...state.versions,runId:state.runId,revision:state.revision,state},encodedBody=canonicalJson(body),checksum=hashText(encodedBody),envelope={...body,checksum},logical='{"checksum":'+JSON.stringify(checksum)+','+encodedBody.slice(1)
if(logical!==canonicalJson(envelope))throw Error('ORIGINAL_LOGICAL_ENCODING_CHANGED')
const nodes=inspectJsonInput(envelope,MAX_LOGICAL_SAVE_NODES),top=Object.entries(state).map(([field,value])=>({field,bytes:utf8Length(canonicalJson(value))})).sort((a,b)=>b.bytes-a.bytes)
const report={at:new Date().toISOString(),source:source.target,sourceRows:source.files.length,sourceExact:exact(),input:ident(input),unsavedProposal:ident(proposal),sourceSeal:seal,original304Canonical:true,normalRunId:state.runId,seed:state.seed,originalValidate305Passed:true,attempts,logicalBytes:utf8Length(logical),logicalHash:hashText(logical),nodes,bounds:{MAX_ENCODED_SAVE_BYTES,MAX_LOGICAL_SAVE_BYTES,MAX_LOGICAL_SAVE_NODES},topFields:top,wallMs:performance.now()-start,gameCommandsExecuted:0,newSavedRevision:0,proposalIsCanonicalInput:false,compatibility:0,wholeU6Complete:false}
if(!report.sourceExact)throw Error('SOURCE_DRIFT');guard(out);fs.writeFileSync(out+'/repro-result.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});progress('reproduction-complete',{logicalBytes:report.logicalBytes,nodes,wallMs:performance.now()-start});fs.closeSync(log)
