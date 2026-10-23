import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {spawn} from 'node:child_process'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const cwd=process.cwd(),root=path.resolve('goal-1/evidence/t17-acceptance-22/build-r5'),out=path.resolve('.delivery/t17-s2-r5')
const prior=JSON.parse(fs.readFileSync('goal-1/evidence/t17-acceptance-22/build-r4/source-after.json','utf8'))
const hash=data=>crypto.createHash('sha256').update(data).digest('hex')
const write=(name,data)=>{assertBrowserEvidenceWritable(root);fs.writeFileSync(path.join(root,name),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n')}
const regularFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('SOURCE_OR_OUTPUT_SYMLINK:'+file);return entry.isDirectory()?regularFiles(file):entry.isFile()?[file]:[]})
const sourceSet=()=>[...regularFiles('src').map(file=>file.split(path.sep).join('/')),...prior.files.filter(file=>!file.path.startsWith('src/')).map(file=>file.path)].sort()
const index=files=>files.map(file=>{const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink())throw Error('REGULAR_SOURCE_REQUIRED:'+file);return {path:file,bytes:stat.size,mode:stat.mode&0o777,sha256:hash(fs.readFileSync(file))}})
const snapshot=()=>({at:new Date().toISOString(),files:index(sourceSet())})
const difference=(before,after)=>{const rows=new Map(before.files.map(file=>[file.path,file])),next=new Map(after.files.map(file=>[file.path,file]));return [...new Set([...rows.keys(),...next.keys()])].sort().flatMap(file=>{const old=rows.get(file),current=next.get(file);return !old||!current||old.sha256!==current.sha256||old.bytes!==current.bytes||(old.mode!==undefined&&current.mode!==old.mode)?[{path:file,before:old??null,after:current??null}]:[]})}
for(let current=path.dirname(out);;current=path.dirname(current)){const stat=fs.lstatSync(current);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('OUTPUT_ANCESTOR_REQUIRED:'+current);if(current===path.parse(current).root)break}
if(fs.existsSync(out))throw Error('FRESH_OUTPUT_REQUIRED:'+out)
assertBrowserEvidenceWritable(root)
const before=snapshot(),changes=difference(prior,before),phases=[]
write('source-before.json',before);write('changes-from-r4.json',changes)
const expected=['src/ui/opening-play.css']
if(changes.length!==1||!changes.every(change=>expected.includes(change.path)))throw Error('UNEXPECTED_R4_SOURCE_DELTA')
write('input.md','# R5 pocket/object separation production build\n\nRoot authorized CSS-only full foreground object grid and independent bottom navigation band after the real R4 pocket click opened the wrong dialog. Reuse the R4 source collection and strict/type/build commands, output to fresh .delivery/t17-s2-r5. No service or Git operation.\n')
const run=async(id,command)=>{
 write(id+'-command.json',command)
 const started=Date.now();write(id+'-console.txt','')
 console.log(id+' started')
 const result=await new Promise(resolve=>{
  const child=spawn(command[0],command.slice(1),{cwd,stdio:['ignore','pipe','pipe'],shell:false})
  const append=data=>{assertBrowserEvidenceWritable(root);fs.appendFileSync(path.join(root,id+'-console.txt'),data)}
  child.stdout.on('data',append);child.stderr.on('data',append)
  child.once('error',error=>resolve({exitCode:null,signal:null,error:String(error)}))
  child.once('close',(exitCode,signal)=>resolve({exitCode,signal,error:null}))
 })
 const after=snapshot(),sourceDrift=difference(before,after)
 const phase={id,...result,elapsedMs:Date.now()-started,sourceDrift}
 phases.push(phase);write(id+'-result.json',phase);write('source-after-'+id+'.json',after)
 console.log(id+' finished '+JSON.stringify({exitCode:phase.exitCode,elapsedMs:phase.elapsedMs,sourceDrift:sourceDrift.length}))
 if(result.exitCode!==0||sourceDrift.length)throw Error(id.toUpperCase()+'_FAILED_OR_SOURCE_DRIFT')
}
try{
 await run('typecheck',['rtk','proxy','node','node_modules/typescript/bin/tsc','-b','--force'])
 await run('build',['rtk','proxy','npm','run','build','--','--outDir','.delivery/t17-s2-r5'])
 const after=snapshot(),sourceDrift=difference(before,after)
 const resources=index(regularFiles('.delivery/t17-s2-r5').sort()),html=fs.readFileSync(path.join(out,'index.html'),'utf8')
 const entryPaths=new Set(['.delivery/t17-s2-r5/index.html',...[...html.matchAll(/(?:src|href)=["']\/?([^"']+)["']/g)].map(match=>'.delivery/t17-s2-r5/'+match[1])])
 const handoff={output:out,sourceCount:after.files.length,sourceIdentitySha256:hash(JSON.stringify(after.files)),resourceCount:resources.length,resourceIndexSha256:hash(JSON.stringify(resources)),entryFiles:resources.filter(file=>entryPaths.has(file.path)),changedFromR4:changes.map(change=>change.after),typecheckExitCode:0,buildExitCode:0,sourceDrift,servicesTouched:false,gitUsed:false,testsRerun:false}
 write('source-after.json',after);write('resources.json',{output:out,files:resources});write('handoff.json',handoff)
 const result={complete:true,phases,sourceCount:after.files.length,sourceDrift,sourceSet:{added:after.files.filter(file=>!before.files.some(old=>old.path===file.path)).map(file=>file.path),removed:before.files.filter(file=>!after.files.some(next=>next.path===file.path)).map(file=>file.path)},output:out,resourceCount:resources.length,servicesTouched:false,gitUsed:false,testsRerun:false}
 write('result.json',result)
 write('handoff.md','# R5 production resources\n\nStrict tsc -b --force and npm run build exited 0. '+after.files.length+' source files remained unchanged throughout both phases; only the authorized opening-play.css layout differs from R4. Resources: '+out+' ('+resources.length+' files). Full commands, console output, phase results, source indexes and resource hashes are retained here.\n\nNo service start/stop, Git operation or extra test run. Build success is not browser, player, performance or compatibility acceptance. Root owns the live resource switch and real pocket/object/calendar mouse retest and raw check.\n')
 console.log(JSON.stringify(result))
}catch(error){write('result.json',{complete:false,phases,error:String(error),sourceAfter:snapshot(),servicesTouched:false,gitUsed:false});console.error(String(error));process.exitCode=1}
