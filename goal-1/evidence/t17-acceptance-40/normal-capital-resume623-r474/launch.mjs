import fs from 'node:fs'
import path from 'node:path'
import cp from 'node:child_process'
import {createHash} from 'node:crypto'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-resume623-r474',out=root+'/execution-r1',node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node',hash=value=>createHash('sha256').update(value).digest('hex'),read=name=>JSON.parse(fs.readFileSync(root+'/'+name,'utf8'))
if(fs.existsSync(root+'/stopped.json') || fs.existsSync(out+'/stopped.json') || fs.existsSync(out+'/commands.jsonl') || fs.existsSync(out+'/head.current.json')) throw Error('FRESH_SINGLE_ACTUAL_PRODUCER_REQUIRED')
const pin=read('launch-pin.json'),preflight=read('preflight-result.json'),terminal=read('preflight-process-terminal.json'),tests=read('control-tests-result.json'),strategy=read('strategy-equivalence.json')
if(terminal.exitCode!==0 || !preflight.preview.allowed || !preflight.source416Exact || !preflight.source473Exact || !tests.passed || tests.traceCases.length!==5 || tests.invalidControlsRejected.length!==10 || tests.firstKernelGateCases.length!==4 || !strategy.allOriginal24FunctionsByteEqual || !strategy.originalWhileAndQuarterTailByteEqual || !strategy.original2025BlockByteEqual) throw Error('ALL_PRELAUNCH_GATES_REQUIRED')
for(const row of pin.files) if(hash(fs.readFileSync(row.path))!==row.sha256) throw Error('PINNED_INPUT_OR_AUTHOR_CODE_CHANGED:'+row.path)
for(const name of ['source416.json','source473.json']){const source=read(name);for(const row of source.files)if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256)throw Error('FROZEN_GAME_SOURCE_CHANGED')}
if(hash(fs.readFileSync(root+'/run623.ts'))!==terminal.driverSha256 || hash(fs.readFileSync(root+'/saved623.json'))!==preflight.inputSha256) throw Error('SAME_REAL_PREFLIGHT_DRIVER_AND_INPUT_REQUIRED')
fs.writeFileSync(root+'/execution-launch.lock',JSON.stringify({at:new Date().toISOString(),launcherPid:process.pid})+'\n',{flag:'wx'})
const stdout=fs.openSync(root+'/execution.stdout.log','wx'),stderr=fs.openSync(root+'/execution.stderr.log','wx'),started=Date.now()
const child=cp.spawn(node,['--experimental-strip-types',root+'/run623.ts'],{env:{...process.env,PATH:path.dirname(node)+':'+process.env.PATH},stdio:['ignore',stdout,stderr]})
const launch={at:new Date().toISOString(),launcherPid:process.pid,childPid:child.pid,driverSha256:terminal.driverSha256,launchPinSha256:hash(fs.readFileSync(root+'/launch-pin.json')),initialRevision:623,inputSha256:preflight.inputSha256,firstOriginalCommand:preflight.control.pending,kernel:416,codec:473,sourceLocked:true,wholeNormal2025Complete:false,newNative:0,newIndexedDbWrites:0,compatibility:0}
fs.writeFileSync(root+'/execution-launch.json',JSON.stringify(launch,null,2)+'\n',{flag:'wx'})
console.log({phase:'single-original623-continuation-launched',childPid:child.pid,initialRevision:623,firstCommandId:preflight.control.pending.commandId,driverSha256:terminal.driverSha256})
const result=await new Promise(resolve=>{child.on('error',error=>resolve({exitCode:null,error:String(error)}));child.on('close',(exitCode,signal)=>resolve({exitCode,signal}))})
fs.closeSync(stdout);fs.closeSync(stderr)
const report={at:new Date().toISOString(),...result,wallMs:Date.now()-started,childResultExists:fs.existsSync(out+'/result.json'),childStoppedExists:fs.existsSync(out+'/stopped.json'),wholeU6Complete:false,compatibility:0}
fs.writeFileSync(root+'/execution-launch-result.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(report)
if(result.exitCode!==0)process.exitCode=1
