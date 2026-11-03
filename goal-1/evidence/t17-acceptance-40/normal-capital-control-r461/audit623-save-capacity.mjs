import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {isDeepStrictEqual} from 'node:util'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',out=root+'/save-capacity-r471',meta=json(out+'/source.json'),core=json(meta.originalCoreManifest),codecSource=json(meta.originalCodecManifest),intake=json(meta.intake),started=Date.now()
const exact=source=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256)
const at=(source,name)=>import(pathToFileURL(path.join(source.target,'src',name)).href)
const put=(name,value)=>{
  if(fs.existsSync(out+'/stopped.json')) throw Error('EVIDENCE_STOPPED')
  fs.writeFileSync(out+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'})
}
let phase='source'
try {
  if(fs.existsSync(out+'/audit623-result.json') || !exact(core) || !exact(codecSource)) throw Error('FRESH_EXACT_SOURCE_AUDIT_REQUIRED')
  for(const row of [...intake.closedExecutionFiles,...intake.outsideClosedExecutionFiles]) if(hash(fs.readFileSync(row.path))!==row.sha256) throw Error('ORIGINAL_FAILURE_ARTIFACT_CHANGED:'+row.path)
  const [{createCampaignCodec,campaignRelay},{RunCodec},{projectRun,fingerprintCommand},{projectRelay}]=await Promise.all([at(core,'application/campaign.ts'),at(codecSource,'persistence/codec.ts'),at(core,'core/commands.ts'),at(core,'core/relay-projection.ts')])
  const codec=new RunCodec(createCampaignCodec().registry,['technical_employee','content_employee'])
  const raw=fs.readFileSync(meta.input623,'utf8'),physical=fs.readFileSync(root+'/execution-r1/head.current.json','utf8')
  if(raw!==physical || hash(raw)!==meta.original623Sha256) throw Error('SAME_LAST_ACTUAL623_REQUIRED')
  phase='import623';console.log({phase})
  const run=codec.import(raw)
  if(run.revision!==623 || run.runId!=='u6-board-capital-pilot-v1' || run.seed!=='normal-relay-s03-v1' || run.origin!=='normal' || run.timeline.cursor.date!=='2024-10-10') throw Error('NORMAL623_IDENTITY_REQUIRED')
  phase='export623';console.log({phase})
  if(codec.export(run)!==raw) throw Error('ENTIRE_ORIGINAL623_WIRE_CHANGED')
  phase='import605-prefix';console.log({phase})
  const prior=codec.import(fs.readFileSync(root+'/saved605.json','utf8'))
  if(prior.revision!==605 || prior.runId!==run.runId || prior.seed!==run.seed || !isDeepStrictEqual(prior.versions,run.versions)) throw Error('SAME_ORIGINAL605_REQUIRED')
  const prefixes=[]
  for(const [name,current,old] of [['commands',run.receipts,prior.receipts],['causes',run.causes,prior.causes],['ledger',run.economy.ledger.receipts,prior.economy.ledger.receipts],['timeline',run.timeline.receipts,prior.timeline.receipts]]) {
    if(!isDeepStrictEqual(current.slice(0,old.length),old)) throw Error('WHOLE605_PREFIX_CHANGED:'+name)
    prefixes.push({name,originalCount:old.length,currentCount:current.length,completePrefixEqual:true})
  }
  const journal=fs.readFileSync(root+'/execution-r1/commands.jsonl','utf8').trim().split('\n').map(line=>JSON.parse(line))
  if(journal.length!==18 || journal.at(-1).sha256!==hash(raw) || journal.at(-1).bytes!==Buffer.byteLength(raw)) throw Error('EXACT18_ORIGINAL_SAVED_COMMANDS_REQUIRED')
  const checked=[]
  for(const [index,row] of journal.entries()) {
    const revision=606+index,command=row.command,receipt=run.receipts[revision-1],fingerprint=fingerprintCommand(run,command,codec.registry,run.actorId)
    if(row.revision!==revision || command.commandId!=='normal-capital-v2:'+revision || command.expectedRevision!==revision-1 || receipt.commandId!==command.commandId || receipt.kind!==command.kind || receipt.date!==row.date || receipt.payloadSignature!==fingerprint.signature || receipt.payloadHash!==fingerprint.hash || !row.preview.allowed) throw Error('ORIGINAL_SAVED_FINGERPRINT_CHANGED:'+revision)
    checked.push({revision,kind:command.kind,date:row.date,payloadHash:fingerprint.hash})
  }
  const pending=json(root+'/execution-r1/result.json').pending
  if(!isDeepStrictEqual(pending,intake.pendingUnsavedCommand) || pending.commandId!=='normal-capital-v2:624' || run.receipts.some(receipt=>receipt.commandId===pending.commandId)) throw Error('624_MUST_STILL_BE_UNSAVED')
  const view=projectRun(run),relay=projectRelay(run,campaignRelay),order=journal.find(row=>row.revision===622)
  if(order?.command.kind!=='StartRelayServicePeriod') throw Error('ORIGINAL_Q4_SERVICE_REQUIRED')
  const periods=relay.periods.filter(period=>period.businessId===order.command.payload.businessId && period.from===order.command.payload.startAt)
  if(periods.length!==1 || !isDeepStrictEqual(periods[0].customerIds,order.command.payload.customerIds) || periods[0].supportMode!==order.command.payload.supportMode) throw Error('EXACT_PUBLIC_SERVICE_IDENTITY_REQUIRED')
  const period=periods[0]
  const lastBuy=run.receipts.filter(receipt=>receipt.kind==='PlaceStockOrder' && JSON.parse(receipt.payloadSignature).payload.side==='buy').at(-1)
  const report={at:new Date().toISOString(),source416Exact:exact(core),source459Exact:exact(codecSource),revision:623,date:view.date,phase:run.timeline.cursor.phase,inputBytes:Buffer.byteLength(raw),inputSha256:hash(raw),entireOriginal623WireByteEqual:true,physicalAndPreservedCopyEqual:true,whole605ImmutablePrefixesEqual:true,prefixes,all18OriginalCommandFingerprintsEqual:true,checked,pending624Unsaved:true,pendingOriginalCommand:pending,earlier417And372ReusedFromOriginal605Audit:true,new417Or372Audit:false,controlFacts:{quarter:'2024-Q4',serviceCommandRevision:622,serviceCommand:order.command,period:{id:period.id,status:period.status,from:period.from,to:period.to,job:period.job,supportJob:period.supportJob},budget:view.budget,personal:view.accounts.find(account=>account.accountId==='personal'),lastActualBuyDate:lastBuy?.date??null,lastBoughtMonth:lastBuy?.date.slice(0,7)??null},wallMs:Date.now()-started,readOnlyAuthorAudit:true,newGameCommands:0,newNative:0,newIndexedDbWrites:0,wholeNormal2025Complete:false,wholeU6Complete:false,compatibility:0}
  if(!report.source416Exact || !report.source459Exact) throw Error('SOURCE_CHANGED_DURING_AUDIT')
  put('audit623-result.json',report)
  console.log({phase:'actual623-audited',revision:623,wireByteEqual:true,originalFingerprints:checked.length,pending624Unsaved:true,periodStatus:period.status,wallMs:report.wallMs})
} catch(error) {
  put('audit623-failure.json',{at:new Date().toISOString(),phase,error:String(error),stack:error.stack,wallMs:Date.now()-started,newGameCommands:0,compatibility:0})
  throw error
}
