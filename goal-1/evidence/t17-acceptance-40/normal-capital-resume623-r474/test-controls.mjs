import fs from 'node:fs'
import assert from 'node:assert/strict'
import ts from 'typescript'
import {createHash} from 'node:crypto'
import {original623Remainder} from './control623.ts'
import {daysBefore} from './calendar-offsets.ts'
import {addDays,quarterOf,monthEnd} from '../../../../.delivery/t17-u6-art-r416/src/core/calendar.ts'
import {canonicalJson} from '../../../../.delivery/t17-u6-art-r416/src/core/identity.ts'
import {AuthorSelectionError} from './paused-default-choice.ts'

const root='goal-1/evidence/t17-acceptance-40/normal-capital-resume623-r474',oldRoot='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',pin=JSON.parse(fs.readFileSync(root+'/control623.json','utf8')),oldText=fs.readFileSync(oldRoot+'/run605.ts','utf8'),newText=fs.readFileSync(root+'/run623.ts','utf8'),hash=value=>createHash('sha256').update(value).digest('hex')
const parse=(name,text)=>ts.createSourceFile(name,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
const oldFile=parse('old.ts',oldText),newFile=parse('new.ts',newText)
const functions=file=>new Map(file.statements.filter(ts.isFunctionDeclaration).map(node=>[node.name.text,node.getText(file)]))
const original=functions(oldFile),current=functions(newFile),identities=[]
for(const [name,text] of original){assert.equal(current.get(name),text,'Original function changed: '+name);identities.push({name,sha256:hash(text)})}
assert.equal(identities.length,24)
const q=original.get('serviceQuarter'),quarterTail=q.slice(q.indexOf(' while(count<2'),q.lastIndexOf('\n}'))
assert.ok(current.get('restoreOriginal623Remainder').includes(quarterTail))
const original2025=oldText.slice(oldText.indexOf(" advance('2025-01-01');"),oldText.indexOf('\n}catch(error)'))
assert.equal(newText.slice(newText.indexOf(" advance('2025-01-01');"),newText.indexOf('\n}catch(error)')),original2025)
assert.ok(newText.indexOf("if(process.argv[2]==='--preflight')")<newText.indexOf('const commandLog='))
assert.ok(newText.includes("'normal-capital-v2:'+String(run.revision+1)"))

const matchedDates=['2024-10-10','2024-10-20','2024-10-30','2024-11-10','2024-11-20','2024-11-30','2024-12-10','2024-12-20','2024-12-30']
function initialModel(options){return{run:{revision:621,runId:pin.runId,actorId:pin.actorId,origin:pin.origin,seed:pin.seed,timeline:{pause:null,cursor:{date:'2024-10-01',phase:'snapshot'}}},budget:{available:4,quarter:'2024-Q4',reserved:0,spent:0,total:4},periods:[],unread:false,distributed:[],extraApApplied:false,options}}
function build(model){
  const commands=[],aux=[];let capture=null,cutCommands=-1,cutAux=-1
  const date=()=>model.run.timeline.cursor.date
  const b={id:pin.businessId,accountId:pin.accountId,lifecycle:'operating'}
  const budget=()=>({...model.budget})
  function beginResource(job){if(quarterOf(job.startAt)==='2024-Q4'){model.budget.reserved--;model.budget.spent++}}
  function send(kind,payload){
    const command={runId:pin.runId,actorId:pin.actorId,commandId:'normal-capital-v2:'+(model.run.revision+1),expectedRevision:model.run.revision,kind,payload:structuredClone(payload)}
    if(command.commandId==='normal-capital-v2:624' && capture===null){capture=structuredClone(model);cutCommands=commands.length;cutAux=aux.length}
    commands.push(command);model.run.revision++
    if(kind==='StartRelayServicePeriod'){
      const first=model.periods.length===0,from=payload.startAt,to=addDays(from,28),id=first?pin.period.id:'second-original-period'
      const job={...pin.period.job,id:first?pin.period.job.id:'second-work',status:'planned',startAt:from,completeAt:to}
      const supportJob={...pin.period.supportJob,id:first?pin.period.supportJob.id:'second-support',status:'planned',startAt:to,completeAt:addDays(to,7)}
      model.periods.push({id,businessId:b.id,status:'planned',from,to,customerIds:payload.customerIds,supportMode:payload.supportMode,job,supportJob,jobStarted:false,supportStarted:false})
      for(const task of [job,supportJob])if(quarterOf(task.startAt)==='2024-Q4'){model.budget.reserved++;model.budget.available--}
    }
    if(kind==='AdvanceTime'){
      const previous=date();model.run.timeline.cursor.date=payload.date
      if(previous.slice(0,7)!==date().slice(0,7))model.unread=true
      for(const p of model.periods){
        if(date()>=p.job.startAt&&!p.jobStarted){p.jobStarted=true;beginResource(p.job);p.job.status='running';p.status='running'}
        if(date()>=p.job.completeAt)p.job.status='completed'
        if(date()>=p.supportJob.startAt&&!p.supportStarted){p.supportStarted=true;beginResource(p.supportJob);p.supportJob.status='running'}
        if(date()>=p.supportJob.completeAt){p.supportJob.status='completed';p.status='closed'}
      }
      if(!model.extraApApplied&&date()>='2024-11-01'){model.extraApApplied=true;model.budget.spent+=model.options.extraAp;model.budget.available-=model.options.extraAp}
    }
    if(kind==='WorkQuarter'){model.budget.spent+=2;model.budget.available-=2}
    if(kind==='AcknowledgeRelayMarket')model.unread=false
  }
  const acknowledge=()=>{aux.push(['acknowledge',date()]);if(model.unread)send('AcknowledgeRelayMarket',{businessId:b.id})}
  const distribute=()=>{aux.push(['distribute',date()]);if(!model.distributed.includes(date())){model.distributed.push(date());send('DistributeProfit',{businessId:b.id,amountFen:1})}}
  const relay=()=>({businesses:[b],periods:model.periods,customers:pin.customerIds.map(id=>({id,businessId:b.id,closedAt:null})),applications:[{id:'same-public-permission',businessId:b.id,supplierId:'cedar-direct',read:true,approved:true,expiresAt:model.options.permissionEnd}]})
  function readPublic623Control(){
    const periods=model.periods.filter(p=>p.businessId===b.id&&p.from>='2024-10-01'&&p.from<='2024-12-31'),p=periods[0]
    return{revision:model.run.revision,date:date(),phase:'snapshot',quarter:quarterOf(date()),runId:pin.runId,actorId:pin.actorId,origin:pin.origin,seed:pin.seed,businessId:b.id,accountId:b.accountId,lifecycle:b.lifecycle,periodCount:periods.length,activePeriodIds:model.periods.filter(p=>!['closed','stopped'].includes(p.status)).map(p=>p.id),period:{id:p.id,status:p.status,from:p.from,to:p.to,customerIds:p.customerIds,supportMode:p.supportMode,job:p.job,supportJob:p.supportJob},budget:budget(),lastBoughtMonth:'2024-09',pauseReason:null}
  }
  const env={run:model.run,business:()=>b,quarterOf,monthEnd,addDays,daysBefore,date,budget,relay,send,acknowledge,distribute,readPublic623Control,original623Remainder,pin,AuthorSelectionError,
    decision:(name,details)=>{if(!name.startsWith('resume-original-'))aux.push(['decision',name,structuredClone(details)])},
    marketMaintenance:()=>aux.push(['marketMaintenance',date()]),renewSupply:()=>aux.push(['renewSupply',date()]),renewCustomers:to=>aux.push(['renewCustomers',date(),to]),recharge:()=>aux.push(['recharge',date()]),
    activeOrders:()=>[{}],hasLiquidationPosition:()=>true,market:()=>({matchingCalendar:matchedDates.map(date=>({date}))}),
    one:rows=>{assert.equal(rows.length,1);return rows[0]},
    preview:(kind,payload)=>{aux.push(['preview',kind,structuredClone(payload)]);return{allowed:!(kind==='StartRelayServicePeriod'&&model.periods.length>0&&model.options.refuseSecond),reasonCodes:[],actionPoints:0,upfrontCostFen:0,releasedFen:0}},
  }
  const selected=['advance','finishPeriod','serviceQuarter'].map(name=>original.get(name)).join('\n')+'\n'+current.get('restoreOriginal623Remainder')
  const js=ts.transpileModule(selected,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.None}}).outputText
  const api=Function(...Object.keys(env),js+';return {serviceQuarter,restoreOriginal623Remainder};')(...Object.values(env))
  return{model,commands,aux,api,control:readPublic623Control,getCapture:()=>({model:capture,cutCommands,cutAux})}
}

const traceResults=[]
for(const options of [{name:'normal-two-periods',permissionEnd:'2025-03-01',extraAp:0,refuseSecond:false},{name:'permission-does-not-cover-second',permissionEnd:'2024-11-15',extraAp:0,refuseSecond:false},{name:'one-ap-cross-quarter-plan',permissionEnd:'2025-03-01',extraAp:1,refuseSecond:false},{name:'zero-ap-quarter-tail',permissionEnd:'2025-03-01',extraAp:2,refuseSecond:false},{name:'original-second-preview-refused',permissionEnd:'2025-03-01',extraAp:0,refuseSecond:true}]){
  const reference=build(initialModel(options));reference.api.serviceQuarter('2024-12-31')
  const checkpoint=reference.getCapture();assert.ok(checkpoint.model);assert.equal(checkpoint.model.run.revision,623)
  const restored=build(structuredClone(checkpoint.model));original623Remainder(restored.control(),pin);restored.api.restoreOriginal623Remainder()
  assert.deepEqual(restored.commands,reference.commands.slice(checkpoint.cutCommands),options.name+' command tail')
  assert.deepEqual(restored.aux,reference.aux.slice(checkpoint.cutAux),options.name+' auxiliary tail')
  assert.deepEqual(restored.model,reference.model,options.name+' final control state')
  assert.equal(restored.commands[0].commandId,'normal-capital-v2:624');assert.equal(restored.commands[0].kind,'AdvanceTime');assert.deepEqual(restored.commands[0].payload,{date:'2024-10-20'})
  assert.equal(restored.commands.filter(c=>c.kind==='StartRelayServicePeriod').length,reference.commands.filter(c=>c.kind==='StartRelayServicePeriod').length-1)
  assert.equal(restored.model.run.timeline.cursor.date,'2024-12-31')
  traceResults.push({name:options.name,commandsCompared:restored.commands.length,wholeCommandTailEqual:true,wholeControlFixtureEqual:true,remainingStartCount:restored.commands.filter(c=>c.kind==='StartRelayServicePeriod').length})
}
const validModel=build(initialModel({name:'guard',permissionEnd:'2025-03-01',extraAp:0,refuseSecond:false}));validModel.api.serviceQuarter('2024-12-31');const valid=build(structuredClone(validModel.getCapture().model)).control()
const invalid=[]
for(const [name,change] of [['revision',c=>c.revision=622],['quarter',c=>c.quarter='2024-Q3'],['origin',c=>c.origin='fixture'],['period-count',c=>c.periodCount=0],['active-target',c=>c.activePeriodIds=[]],['different-period',c=>c.period.id='another'],['ap',c=>c.budget.available=3],['support-target',c=>c.period.supportJob.completeAt='2024-11-07'],['customer-order',c=>c.period.customerIds=[...c.period.customerIds].reverse()],['pause',c=>c.pauseReason='CONTENT_DECISION_PENDING']]){const c=structuredClone(valid);change(c);assert.throws(()=>original623Remainder(c,pin));invalid.push(name)}

const declaration=newFile.statements.filter(ts.isVariableStatement).flatMap(s=>s.declarationList.declarations).find(d=>d.name.getText(newFile)==='evaluateCommand')
assert.ok(declaration)
const evalJs=ts.transpileModule('const evaluateCommand='+declaration.initializer.getText(newFile),{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.None}}).outputText
const wrappedResults=[]
for(const name of ['correct-first','wrong-first','different-golden','later-delegates']){
  const golden={fixture:'whole-state-guard'},writes=[];let calls=0
  const env={kernelEvaluateCommand:()=>{calls++;return{status:'proposed',nextRun:golden}},canonicalJson,hash,pin,prepared:{goldenActualUnwritten624CanonicalSha256:name==='different-golden'?'0'.repeat(64):hash(canonicalJson(golden))},AuthorSelectionError,writeJson:(...args)=>writes.push(args)}
  const fn=Function(...Object.keys(env),evalJs+';return evaluateCommand;')(...Object.values(env)),command=structuredClone(pin.nextOriginalCommand)
  if(name==='wrong-first'){command.kind='WorkQuarter';assert.throws(()=>fn({revision:623},command,{},'player'));assert.equal(calls,0)}
  else if(name==='different-golden'){assert.throws(()=>fn({revision:623},command,{},'player'));assert.equal(calls,1);assert.equal(writes.length,0)}
  else{assert.equal(fn({revision:name==='later-delegates'?624:623},command,{},'player').status,'proposed');assert.equal(calls,1);assert.equal(writes.length,name==='later-delegates'?0:1)}
  wrappedResults.push({name,passed:true})
}
const sourceProof={at:new Date().toISOString(),originalFunctions:identities.length,allOriginal24FunctionsByteEqual:true,checked:identities,originalWhileAndQuarterTailByteEqual:true,original2025BlockByteEqual:true,preflightBeforeLiveJournalInitialization:true,originalNamespacePreserved:true,fixtureOnlyNotNormalProof:true,compatibility:0}
fs.writeFileSync(root+'/strategy-equivalence.json',JSON.stringify(sourceProof,null,2)+'\n',{flag:'wx'})
const result={at:new Date().toISOString(),passed:true,traceCases:traceResults,invalidControlsRejected:invalid,firstKernelGateCases:wrappedResults,originalFunctionsByteEqual:24,originalWhileAnd2025ByteEqual:true,newLiveGameCommands:0,fixtureOnlyNotNormalProof:true,compatibility:0}
fs.writeFileSync(root+'/control-tests-result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log({traceCases:traceResults.length,invalidControlsRejected:invalid.length,firstKernelGateCases:wrappedResults.length,originalFunctions:24,actualExecutionStarted:false,compatibility:0})
