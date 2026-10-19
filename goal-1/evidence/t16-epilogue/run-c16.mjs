import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync} from 'node:fs';
import {resolve,relative,join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../..'),argument=process.argv[2];
if(process.argv.length!==3||!/^goal-1\/evidence\/t16-c16-[a-z0-9-]+$/.test(argument??''))throw Error('USE_FRESH_C16_OUTPUT_DIRECTORY');
const out=resolve(root,argument),build='.delivery/'+basename(out);if(existsSync(out)||existsSync(resolve(root,build)))throw Error('FRESH_C16_DIRECTORY_REQUIRED');mkdirSync(out);
const sha=data=>createHash('sha256').update(data).digest('hex'),write=(file,data)=>writeFileSync(join(out,file),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
const candidates=execFileSync('rtk',['proxy','git','ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root}).toString('utf8').split('\0').filter(Boolean);
const rootFiles=new Set(['AGENTS.md','README.md','package.json','package-lock.json','index.html','vite.config.ts','vitest.config.ts','.gitignore','goal-1/input.md']);
const sourceFiles=candidates.filter(p=>/^(src|scripts|docs|assets|planning)\//.test(p)||/^tsconfig.*\.json$/.test(p)||rootFiles.has(p));
for(const file of [...sourceFiles])if(/\.test\.tsx?$/.test(file))for(const match of readFileSync(join(root,file),'utf8').matchAll(/from\s+['"]([^'"]+\?raw)['"]/g))sourceFiles.push(relative(root,resolve(dirname(join(root,file)),match[1].replace(/\?raw$/,''))));
sourceFiles.push(relative(root,fileURLToPath(import.meta.url)));
const sources=Object.fromEntries([...new Set(sourceFiles)].sort().map(p=>[p,sha(readFileSync(join(root,p)))]));
function sourceCheck(){for(const [p,hash]of Object.entries(sources))if(sha(readFileSync(join(root,p)))!==hash)throw Error('FROZEN_SOURCE_CHANGED:'+p)}
const identity={head:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),branch:execFileSync('rtk',['proxy','git','branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),node:process.version,startedAt:new Date().toISOString(),sourceFiles:Object.keys(sources).length,testFiles:sourceFiles.filter(p=>/\.test\.tsx?$/.test(p)).length};
write('source-final.json',{identity,sources,scope:'Current code/config/content/assets/design/tool and actual raw test-fixture bytes. Goal progress/evidence output files are separate; no final whole-goal claim.'});
const replayNames=['story','kernel','save','world','operations','first-order','market','playable','video','course','relay','deepseek','route-diversity'];
const commands=[
 ['typecheck',['npm','run','typecheck']],['build',['npm','run','build','--','--outDir',build]],
 ['all-unit',['npm','run','test:unit','--','--maxWorkers=1']],
 ['tool-tests',['npm','run','test:docs']],['content',['npm','run','validate:content']],
 ['docs',['python3','-B','scripts/check_docs.py','--text-only']],['plan',['python3','-B','scripts/check_plan.py']],['competitive',['python3','-B','scripts/check_competitive_design.py']],
 ['life',['node','--experimental-strip-types','scripts/collect_life_evidence.ts','--output-dir',argument+'/life']],
 ...replayNames.map(name=>['replay-'+name,['npm','run','evidence:'+name,'--','--output-dir',argument+'/replay/'+name]])
];
write('registered-steps.json',{identity,commands:commands.map(([step,args])=>({step,command:['rtk','proxy',...args]})),policy:'Same original22 cumulative command contracts; original assertions/timeouts and per-file isolation retained. No concurrent timed test/collector jobs; browser UI inspection may continue without editing frozen sources. New fixed42 evidence is separately source-matched, not counted as a rerun.'});
const results=[];let sourceStable=true;
for(const [step,args]of commands){
 sourceCheck();const output=join(out,step+'-output.txt'),fd=openSync(output,'wx'),start=performance.now();console.log(JSON.stringify({stage:'start',step,command:['rtk','proxy',...args]}));
 const code=await new Promise((done,reject)=>{const child=spawn('rtk',['proxy',...args],{cwd:root,stdio:['ignore',fd,fd]});child.once('error',reject);child.once('exit',(code,signal)=>done({code,signal}))}).finally(()=>closeSync(fd));
 const row={step,command:['rtk','proxy',...args],exitCode:code.code,signal:code.signal,seconds:Number(((performance.now()-start)/1000).toFixed(3)),output:relative(root,output)};results.push(row);console.log(JSON.stringify({stage:'finished',...row}));
 try{sourceCheck()}catch(error){sourceStable=false;write('source-drift.json',{step,error:String(error)});break}
 write('progress-'+String(results.length).padStart(2,'0')+'.json',{sourceUnchanged:sourceStable,allExecutedPassed:results.every(r=>r.exitCode===0),results});
}
let matrixResult=null;
try{
 const folder=join(root,'goal-1/evidence/t16-epilogue/matrix-full-r2'),matrix=JSON.parse(readFileSync(join(folder,'t16-journey-evidence.json'),'utf8'));
 if(matrix.total!==42||matrix.results.length!==42)throw Error('FIXED_MATRIX_COUNT_MISMATCH');
 for(const [p,hash]of Object.entries(matrix.sourceHashes))if(sha(readFileSync(join(root,p)))!==hash)throw Error('MATRIX_DEPENDENCY_CHANGED:'+p);
 const keys=new Set();let stopped=0;
 for(const row of matrix.results){
  const key=[row.backgroundId,row.seed,row.strategy].join(':');if(keys.has(key)||row.fatal||row.phase!=='finished'||!row.fullCreateReplayByteEqual)throw Error('MATRIX_OUTCOME_INVALID:'+key);keys.add(key);if(row.strategyFailure)stopped++;
  const raw=readFileSync(join(folder,row.name+'-final.json'),'utf8'),state=JSON.parse(raw).state;if(sha(raw)!==row.sha256||state.origin!=='normal'||state.journey.quarters.length!==24||state.journey.quarters.some(q=>q.closedAt===null))throw Error('MATRIX_RAW_INVALID:'+key);
 }
 matrixResult={passed:true,samples:42,stoppedOrRefused:stopped,sourceDependenciesUnchanged:true,artifact:'goal-1/evidence/t16-epilogue/matrix-full-r2/t16-journey-evidence.json',boundary:'This verifies the actual earlier complete42 execution and its unchanged dependencies; it is not a new42 run.'};
}catch(error){matrixResult={passed:false,error:String(error)}}
write('matrix-readback.json',matrixResult);sourceCheck();
const report={identity,sourceUnchanged:sourceStable,steps:results,allExecutedPassed:results.length===22&&results.every(r=>r.exitCode===0)&&sourceStable,matrixResult,wholeGoalComplete:false,scope:'C16 current cumulative code/tool/content/doc and original replay contracts; final browser/asset preservation/limited review remain separately reported. M01, human study, original PNG and T17/T18 are not completed here.'};
write('run-results.json',report);console.log(JSON.stringify({stage:'complete',steps:results.length,allExecutedPassed:report.allExecutedPassed,matrixPassed:matrixResult.passed,wholeGoalComplete:false}));if(!report.allExecutedPassed||!matrixResult.passed)process.exitCode=1;
