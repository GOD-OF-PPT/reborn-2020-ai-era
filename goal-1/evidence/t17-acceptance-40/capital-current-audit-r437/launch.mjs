import fs from 'node:fs'
import cp from 'node:child_process'
const root='goal-1/evidence/t17-acceptance-40/capital-current-audit-r437',node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node'
if(fs.existsSync(root+'/launch.json')||fs.existsSync(root+'/stopped.json'))throw Error('FRESH_AUDIT_EXECUTION_REQUIRED')
const stdout=fs.openSync(root+'/stdout.log','wx'),stderr=fs.openSync(root+'/stderr.log','wx'),started=Date.now()
const child=cp.spawn(node,['--experimental-strip-types',root+'/audit-current.mjs'],{stdio:['ignore',stdout,stderr]})
fs.writeFileSync(root+'/launch.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,node,scope:'Read-only original codec/public finance audit; no commands',compatibility:0},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({phase:'launched',pid:child.pid}))
const result=await new Promise(resolve=>{child.on('error',error=>resolve({exitCode:null,error:String(error)}));child.on('close',(exitCode,signal)=>resolve({exitCode,signal}))})
fs.closeSync(stdout);fs.closeSync(stderr)
const terminal={at:new Date().toISOString(),...result,wallMs:Date.now()-started,compatibility:0}
fs.writeFileSync(root+'/terminal.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(terminal));if(result.exitCode!==0)process.exitCode=1
