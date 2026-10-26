import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawnSync} from 'node:child_process'
import {repo,directory,bindings,read,same,guard} from '../io.mjs'
const output=path.dirname(fileURLToPath(import.meta.url)),relative=path.relative(repo,output),put=(name,value)=>{guard(output);fs.writeFileSync(path.join(output,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
guard(output);if(fs.existsSync(path.join(output,'command.json')))throw Error('ONE_CORRECTION_EXECUTION_ONLY')
const contract=JSON.parse(read(directory+'/frozen-contract.json').bytes),before=bindings(),owned=['input.md','plan.md','tasks.md','prepare.mjs','readback.mjs','run-once.mjs','preparation.json'].map(name=>read(relative+'/'+name).identity)
for(const key of ['sources','p3','references','dependencies','input','snapshots'])if(!same(before[key],key==='sources'?contract.officialSources:contract[key]))throw Error('FROZEN_ORIGINAL_CHANGED:'+key)
put('source-before.json',{original:before,owned})
const args=['proxy','node','--experimental-strip-types',relative+'/readback.mjs'],started=Date.now()
put('command.json',{at:new Date().toISOString(),cwd:repo,command:['rtk',...args],source:read(relative+'/readback.mjs').identity,scope:'Second public readback execution only; correct original operations ID mapping. The one successful original fullCreate replay is inherited, never rerun.'})
guard(output);const execution=spawnSync('rtk',args,{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024});put('stdout.log',execution.stdout??'');put('stderr.log',execution.stderr??'')
const after=bindings(),ownedAfter=owned.map(row=>read(row.path).identity),freeze=Object.fromEntries(Object.keys(before).map(key=>[key,same(before[key],after[key])]))
freeze.ownHelpers=same(owned,ownedAfter);put('source-after.json',{original:after,owned:ownedAfter,freeze})
const terminal={at:new Date().toISOString(),exitCode:execution.status,signal:execution.signal,error:execution.error?.message??null,wallMs:Date.now()-started};put('terminal.json',terminal)
const file=path.join(output,'readback-result.json'),report=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null,passed=terminal.exitCode===0&&terminal.signal===null&&terminal.error===null&&Object.values(freeze).every(Boolean)&&report?.passed===true
const result={at:terminal.at,passed,terminal,freeze,officialSourceCount:before.sources.length,p3:before.p3.length,dependencyFiles:before.dependencies.length,readback:report?{checkCount:report.checkCount,passedChecks:report.passedChecks,failedChecks:report.failedChecks,snapshots:report.snapshots}:null,inheritedReplay:{source:read(directory+'/report/normal-browser-export-audit.json').identity,notReexecuted:true},originalRed:{source:read(directory+'/result.json').identity,preserved:true},limit:'This is the second read-only projection run after an audit-helper identity assertion defect; no new replay, browser action, product change or earned outcome.'}
put('result.json',result);console.log(JSON.stringify(result));if(!passed)process.exitCode=1
