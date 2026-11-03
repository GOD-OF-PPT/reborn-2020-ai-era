import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {isDeepStrictEqual} from 'node:util'
import {createHash} from 'node:crypto'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-resume623-r474',out=root+'/checkpoint624',execution=root+'/execution-r1',hash=value=>createHash('sha256').update(value).digest('hex'),read=file=>JSON.parse(fs.readFileSync(file,'utf8'))
if(fs.existsSync(out+'/stopped.json') || fs.existsSync(out+'/capture.json')) throw Error('FRESH_READ_ONLY_CAPTURE_REQUIRED')
const prepared=read(root+'/prepared-inputs.json'),pin=read(root+'/control623.json'),raw=fs.readFileSync(execution+'/head.current.json','utf8'),header=JSON.parse(raw),journal=fs.readFileSync(execution+'/commands.jsonl','utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line)),last=journal.at(-1)
if(header.revision!==624 || journal.length!==1 || last?.revision!==624 || last.sha256!==hash(raw) || last.bytes!==Buffer.byteLength(raw)) throw Error('WAIT_FOR_EXACT_ACTUAL624_HEAD_AND_JOURNAL')
const kernelCheck=read(execution+'/first624-golden-check.json')
if(!last.preview.allowed || !isDeepStrictEqual(last.command,pin.nextOriginalCommand) || kernelCheck.wholeRecomputedGameRunCanonicalSha256!==prepared.goldenActualUnwritten624CanonicalSha256 || !kernelCheck.wholeOriginalUnwrittenProposalEqual || hash(raw)!==prepared.golden473WireSha256) throw Error('ACTUAL624_ORIGINAL_IDENTITY_REQUIRED')
const put=(name,value)=>{if(fs.existsSync(out+'/stopped.json'))throw Error('CHECKPOINT_STOPPED');fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
put('input624.json',raw);put('journal624.json',last);put('kernel-golden-check.json',kernelCheck)
put('capture.json',{at:new Date().toISOString(),revision:624,date:last.date,bytes:Buffer.byteLength(raw),sha256:hash(raw),actualAtomicHeadAndJournalSameRevision:true,source:'Actual new producer disk head plus successful journal, not copied from prior candidate',newGameCommands:0,compatibility:0})
const core=read(root+'/source416.json'),codecSource=read(root+'/source473.json'),exact=source=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256),at=(source,name)=>import(pathToFileURL(path.join(source.target,'src',name)).href),started=Date.now();let phase='source'
try{
  if(!exact(core) || !exact(codecSource)) throw Error('FROZEN_SOURCE_CHANGED')
  const [{createCampaignCodec},{RunCodec},{canonicalJson},{fingerprintCommand,projectRun}]=await Promise.all([at(core,'application/campaign.ts'),at(codecSource,'persistence/codec.ts'),at(core,'core/identity.ts'),at(core,'core/commands.ts')])
  const codec=new RunCodec(createCampaignCodec().registry,['technical_employee','content_employee'])
  phase='import-actual624';console.log({phase})
  const run=codec.import(raw)
  if(run.revision!==624 || run.origin!=='normal' || run.seed!=='normal-relay-s03-v1' || run.runId!==pin.runId || hash(canonicalJson(run))!==prepared.goldenActualUnwritten624CanonicalSha256) throw Error('WHOLE_ACTUAL_GAME_RUN_DIFFERS_FROM_ORIGINAL_GOLDEN')
  phase='original623-prefix';console.log({phase})
  const prior=codec.import(fs.readFileSync(root+'/saved623.json','utf8')),prefixes=[]
  for(const [name,current,old] of [['commands',run.receipts,prior.receipts],['causes',run.causes,prior.causes],['ledger',run.economy.ledger.receipts,prior.economy.ledger.receipts],['timeline',run.timeline.receipts,prior.timeline.receipts]]){
    if(!isDeepStrictEqual(current.slice(0,old.length),old)) throw Error('WHOLE623_PREFIX_CHANGED:'+name)
    prefixes.push({name,originalCount:old.length,currentCount:current.length,completePrefixEqual:true})
  }
  const receipt=run.receipts.at(-1),f=fingerprintCommand(run,last.command,codec.registry,run.actorId)
  if(run.receipts.length!==624 || receipt.commandId!=='normal-capital-v2:624' || receipt.kind!=='AdvanceTime' || receipt.date!=='2024-10-20' || receipt.payloadSignature!==f.signature || receipt.payloadHash!==f.hash) throw Error('ACTUAL624_FINGERPRINT_CHANGED')
  phase='whole-wire';if(codec.export(run)!==raw) throw Error('WHOLE_ACTUAL624_WIRE_CHANGED')
  const reference=fs.readFileSync('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/save-capacity-r471/candidate624.json','utf8')
  if(raw!==reference || !exact(core) || !exact(codecSource)) throw Error('ACTUAL624_REFERENCE_WIRE_OR_SOURCE_CHANGED')
  const view=projectRun(run),result={at:new Date().toISOString(),revision:624,date:view.date,inputBytes:Buffer.byteLength(raw),inputSha256:hash(raw),actualDiskAndJournalCapture:true,wholeGameRunEqualsOriginalActualKernelProposal:true,whole623ImmutablePrefixesEqual:true,prefixes,uniqueNew624FingerprintEqual:true,payloadHash:f.hash,wholeCurrentCodecWireByteEqual:true,actualStoredWireByteEqualToPriorIndependentlyValidatedCandidate:true,oldReaderEvidenceExplicitlyReusedForIdenticalWire:true,budget:view.budget,personal:view.accounts.find(account=>account.accountId==='personal'),wallMs:Date.now()-started,source416Exact:true,source473Exact:true,newGameCommands:0,newNative:0,newIndexedDbWrites:0,wholeNormal2025Complete:false,wholeU6Complete:false,compatibility:0}
  put('result.json',result);console.log({phase:'actual624-independent-readback-passed',bytes:result.inputBytes,wholeState:true,whole623Prefixes:true,wholeWire:true})
}catch(error){put('failure.json',{at:new Date().toISOString(),phase,error:String(error),stack:error.stack,wallMs:Date.now()-started,newGameCommands:0,compatibility:0});throw error}
