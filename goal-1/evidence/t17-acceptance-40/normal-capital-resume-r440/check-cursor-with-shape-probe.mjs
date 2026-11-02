import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
import {pathToFileURL} from 'node:url'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-resume-r440',before=fs.readFileSync('goal-1/evidence/t17-acceptance-40/normal-capital-recovery-r432/run.ts','utf8'),after=fs.readFileSync(root+'/run.ts','utf8'),control=json(root+'/control-point.json')
const functions=code=>new Map(ts.createSourceFile('driver.ts',code,ts.ScriptTarget.Latest,true).statements.filter(ts.isFunctionDeclaration).map(node=>[node.name.text,node.getText()]))
const old=functions(before),current=functions(after),names=json('goal-1/evidence/t17-acceptance-40/normal-capital-recovery-r432/strategy-functions.json').unchangedFunctions
for(const name of [...names,'advance'])assert.equal(current.get(name),old.get(name),name)
const loop=fs.readFileSync(root+'/original-service-loop.txt','utf8').trimEnd();assert.ok(current.get('restoreOriginalQuarterRemainder').includes(loop))
const {addDays,quarterOf}=await import(pathToFileURL(process.cwd()+'/.delivery/t17-u6-art-r416/src/core/calendar.ts').href)
const copy=value=>JSON.parse(JSON.stringify(value)),tests=[]
function environment(options={}){
 const state={date:'2023-04-01',revision:417,periods:[],budget:{available:4,reserved:0,spent:0},trace:[],checkpoint:null,checkpointAt:null}
 const record=(kind,data=null)=>state.trace.push(copy([kind,data]))
 const context={fs:{readFileSync:()=>JSON.stringify(control)},run:{revision:417},AuthorSelectionError:class extends Error{},date:()=>state.date,quarterOf,addDays,daysBefore:(date,n)=>addDays(date,-n),business:()=>({id:control.businessId}),budget:()=>state.budget,relay:()=>({periods:state.periods,applications:[{businessId:control.businessId,supplierId:'cedar-direct',read:true,approved:true,expiresAt:options.expiresAt??'2024-01-01'}],customers:[{id:'opaque-original-customer',businessId:control.businessId,closedAt:null}]}),decision:(action,data)=>{if(action!=='resume-original-first-period-tail')record('decision',{action,data})},finishPeriod:()=>{
  const period=state.periods.find(p=>!['closed','stopped'].includes(p.status))
  if(period?.id===control.period.id&&state.checkpoint===null){state.date=control.date;period.status=control.period.status;period.job.status=control.period.job.status;state.budget=copy(control.budget);state.checkpoint=copy({...state,trace:[]});state.checkpointAt=state.trace.length}
  record('finishPeriod',period?.id??null)
  if(period){state.date=period.supportJob.completeAt;period.status='closed';period.job.status='completed';period.supportJob.status='completed';state.budget=period.id===control.period.id?{available:options.availableAfterFirst??2,reserved:0,spent:options.availableAfterFirst===1?3:2}:{available:0,reserved:0,spent:4}}
 },acknowledge:()=>record('acknowledge'),renewSupply:()=>record('renewSupply'),renewCustomers:date=>record('renewCustomers',date),recharge:()=>record('recharge'),preview:(kind,payload)=>{record('preview',{kind,payload});return {allowed:kind!=='StartRelayServicePeriod'||options.allowSecond!==false}},send:(kind,payload)=>{
  record('send',{kind,payload})
  if(kind==='StartRelayServicePeriod'){
   const first=state.periods.length===0,to=addDays(payload.startAt,28),p=first?copy(control.period):{...copy(control.period),id:'opaque-next-period',from:payload.startAt,to,job:{...copy(control.period.job),id:'opaque-next-job',startAt:payload.startAt,completeAt:to,status:'planned'},supportJob:{...copy(control.period.supportJob),id:'opaque-next-support',startAt:to,completeAt:addDays(to,7),status:'planned'}}
   p.status='planned';state.periods.push(p);state.budget={available:0,reserved:2,spent:2}
  }
 },advance:date=>{record('advance',date);state.date=date},distribute:()=>record('distribute'),marketMaintenance:()=>record('marketMaintenance'),snapshotQuarter:label=>record('snapshotQuarter',label)}
 vm.createContext(context)
 return {state,context,record}
}
function install(env,name,code){vm.runInContext(ts.transpile(code,{target:ts.ScriptTarget.ES2022})+'\nthis.execute='+name,env.context)}
for(const [name,options] of [['actual public417 remainder',{}],['original permission does not cover another period',{expiresAt:'2023-06-01'}],['original preview refuses another period',{allowSecond:false}],['one remaining AP carries support beyond this quarter',{availableAfterFirst:1}]]){
 const reference=environment(options);install(reference,'serviceQuarter',old.get('serviceQuarter'));reference.context.execute('2023-06-30');reference.context.snapshotQuarter('2023-Q2');assert.ok(reference.state.checkpoint)
 const resumed=environment(options);Object.assign(resumed.state,copy(reference.state.checkpoint),{trace:[],checkpoint:null,checkpointAt:null});install(resumed,'restoreOriginalQuarterRemainder',current.get('restoreOriginalQuarterRemainder'));try{resumed.context.execute()}catch(error){console.error(JSON.stringify({case:name,observed:{date:resumed.state.date,revision:resumed.context.run.revision,quarter:quarterOf(resumed.state.date),periods:resumed.state.periods},control}));throw error}
 assert.deepEqual(resumed.state.trace,reference.state.trace.slice(reference.state.checkpointAt),name)
 assert.equal(resumed.state.trace.filter(([kind])=>kind==='renewSupply').length,0)
 assert.ok(resumed.state.periods.length<=2)
 tests.push({name,pass:true,scope:'Control-flow equivalence against original function using opaque operation stubs; no kernel/Native/future outcome proof'})
}
for(const [name,mutate] of [['wrong revision',e=>{e.context.run.revision=416}],['duplicate current period',e=>{e.state.periods.push(copy(e.state.periods[0]))}],['wrong support identity',e=>{e.state.periods[0].supportJob.id='wrong'}]]){
 const e=environment();e.state.date=control.date;e.state.periods=[copy(control.period)];e.state.budget=copy(control.budget);mutate(e);install(e,'restoreOriginalQuarterRemainder',current.get('restoreOriginalQuarterRemainder'));assert.throws(()=>e.context.execute(),/ORIGINAL417_CONTROL_POINT_REQUIRED/);assert.deepEqual(e.state.trace,[]);tests.push({name,pass:true})
}
const result={at:new Date().toISOString(),unchangedStrategyFunctions:names,all20Exact:true,advanceExact:true,originalLoopAndTailVerbatim:true,tests,passed:tests.length,driverSha256:hash(after),newGameCommands:0,productChanges:0,compatibility:0}
fs.writeFileSync(root+'/cursor-check.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log({unchangedFunctions:names.length,advanceExact:true,testsPassed:tests.length,productChanges:0})
