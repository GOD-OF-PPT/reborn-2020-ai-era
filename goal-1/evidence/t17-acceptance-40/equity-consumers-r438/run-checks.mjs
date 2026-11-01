import fs from 'node:fs'
import path from 'node:path'
import cp from 'node:child_process'
import {json,hash,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/equity-consumers-r438',revision=process.argv[2],label=process.argv[3],node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node'
if(!/^\d+$/.test(revision??'')||!/^[-a-z0-9]+$/.test(label??'')||fs.existsSync(root+'/stopped.json'))throw Error('EXPLICIT_ACTIVE_SOURCE_AND_LABEL_REQUIRED')
const source=json(root+'/snapshot'+revision+'.json'),files=json(root+'/selected-files.json').files
const exact=()=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256)
if(!exact()||files.length!==50||new Set(files).size!==50)throw Error('EXACT_CURRENT_SOURCE_AND_ALL50_REQUIRED')
for(const name of files){const content=fs.readFileSync(path.join(source.target,name),'utf8');if(/innerWidth|innerHeight|setViewport|resizeTo|\bresize\(|getBoundingClientRect|200%|\bzoom\b|viewport/i.test(content))throw Error('PAUSED_COMPATIBILITY_SCOPE_REVIEW_REQUIRED:'+name)}
const preservation=json('goal-1/evidence/t17-acceptance-40/capital-current-audit-r437/preservation.json')
for(const row of preservation.fullSeals)verifySeal(row.root)
verifySeal('goal-1/evidence/t17-acceptance-40/scene-reading-r433');verifySeal('goal-1/evidence/t17-acceptance-40/capital-current-audit-r437')
const args=['node_modules/vitest/vitest.mjs','run','--maxWorkers=1','--no-file-parallelism','--testTimeout=60000','--hookTimeout=180000','--config','vitest.config.ts',...files,'--reporter=json','--outputFile='+path.resolve(root+'/'+label+'.vitest.json')]
const stdout=fs.openSync(root+'/'+label+'.stdout.log','wx'),stderr=fs.openSync(root+'/'+label+'.stderr.log','wx'),started=Date.now()
const child=cp.spawn(node,args,{cwd:source.target,env:{...process.env,PATH:path.dirname(node)+':'+process.env.PATH},stdio:['ignore',stdout,stderr]})
fs.writeFileSync(root+'/'+label+'.launch.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,args,cwd:source.target,files,fullFiles:true,sourceRows:source.files.length,sourceExact:true,original54FullSealsExact:true,compatibility:0},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({phase:'launched',pid:child.pid,files:files.length,source:Number(revision)}))
const result=await new Promise(resolve=>{child.on('error',error=>resolve({exitCode:null,error:String(error)}));child.on('close',(exitCode,signal)=>resolve({exitCode,signal}))})
fs.closeSync(stdout);fs.closeSync(stderr)
const report={at:new Date().toISOString(),...result,wallMs:Date.now()-started,args,cwd:source.target,sourceRows:source.files.length,sourceExact:exact(),files:files.length,fullFiles:true,p3OverlayCopied:false,functionalTimeoutOnly:true,compatibility:0,wholeU6Complete:false}
fs.writeFileSync(root+'/'+label+'.result.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report))
if(result.exitCode!==0||!report.sourceExact)process.exitCode=1
