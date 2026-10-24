import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'
const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../../../..')
const commands={
 docs:['proxy','python3','-B','scripts/check_docs.py','--text-only'],
 plan:['proxy','python3','-B','scripts/check_plan.py'],
 competitive:['proxy','python3','-B','scripts/check_competitive_design.py'],
 content:['proxy','npm','run','validate:content'],
}
const name=process.argv[2],args=commands[name]
if(!args||process.argv.length!==3)throw Error('EXPLICIT_REGISTERED_CHECK_REQUIRED')
assertBrowserEvidenceWritable(root)
const output=path.join(root,name)
if(fs.existsSync(output))throw Error('PRESERVE_ORIGINAL_CHECK_RESULT')
fs.mkdirSync(output)
const write=(file,value)=>{assertBrowserEvidenceWritable(output);fs.writeFileSync(path.join(output,file),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
const refs=JSON.parse(fs.readFileSync(path.join(root,'source-before.json'),'utf8')).refs
const identities=()=>refs.map(ref=>{const b=fs.readFileSync(path.join(repo,ref.path));return{...ref,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),mode:fs.lstatSync(path.join(repo,ref.path)).mode&0o777}})
const before=identities(),start=Date.now()
write('command.json',{at:new Date().toISOString(),cwd:repo,command:['rtk',...args],before})
assertBrowserEvidenceWritable(output)
const terminal=spawnSync('rtk',args,{cwd:repo,encoding:'utf8',maxBuffer:16*1024*1024})
write('stdout.txt',terminal.stdout??'');write('stderr.txt',terminal.stderr??'')
const after=identities(),changes=after.filter((ref,i)=>ref.sha256!==before[i].sha256||ref.bytes!==before[i].bytes||ref.mode!==before[i].mode)
const result={at:new Date().toISOString(),name,exitCode:terminal.status,signal:terminal.signal,error:terminal.error?.message??null,wallMs:Date.now()-start,before,after,sourceUnchanged:changes.length===0,changes}
write('result.json',result)
console.log(JSON.stringify({name,exitCode:result.exitCode,signal:result.signal,error:result.error,wallMs:result.wallMs,sourceUnchanged:result.sourceUnchanged,stdout:terminal.stdout,stderr:terminal.stderr}))
process.exitCode=terminal.status??1
