import{readFileSync,writeFileSync,existsSync,statSync}from'node:fs';
import{resolve,dirname,relative,extname}from'node:path';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
import{assertBrowserEvidenceWritable as guard}from'../../../../scripts/browser_evidence_guard.mjs';
const base=process.cwd(),root=resolve(base,'goal-1/evidence/t17-acceptance-33/relay-art-r1');
const owned=['src/ui/OpeningObject.tsx','src/ui/RelayServicePaper.tsx','src/ui/relay-service-paper.css','src/ui/RelayServicePaper.test.tsx'];
const files=new Set([...owned,'package.json','package-lock.json','vitest.config.ts']);
function collect(file){const path=resolve(base,file);if(!existsSync(path)||!['.ts','.tsx','.css'].includes(extname(path)))return;const raw=readFileSync(path,'utf8');for(const match of raw.matchAll(/(?:\bfrom\s*|\bimport\s*)(['"])(\.[^'"]+)\1/g)){const target=resolve(dirname(path),match[2]);if(existsSync(target)&&statSync(target).isFile()){const name=relative(base,target);if(!files.has(name)){files.add(name);collect(name)}}}}
for(const file of owned)collect(file);
const sha=b=>createHash('sha256').update(b).digest('hex');
const snapshot=()=>[...files].sort().filter(existsSync).map(file=>{const b=readFileSync(file);return{file,bytes:b.length,mode:statSync(file).mode&0o777,sha256:sha(b)}});
const write=(name,data)=>{guard(root);writeFileSync(resolve(root,name),data,{flag:'wx'})};
const before=snapshot(),start=new Date().toISOString();write('unit-r1.source-before.json',JSON.stringify(before,null,2)+'\n');
const args=['node_modules/vitest/vitest.mjs','run','--config','vitest.config.ts','src/ui/RelayServicePaper.test.tsx','--maxWorkers=1','--reporter=json','--outputFile='+resolve(root,'unit-r1.vitest.json')];
guard(root);const run=spawnSync(process.execPath,args,{cwd:base,encoding:'utf8',maxBuffer:8*1024*1024});
write('unit-r1.stdout.txt',run.stdout??'');write('unit-r1.stderr.txt',run.stderr??'');const after=snapshot();write('unit-r1.source-after.json',JSON.stringify(after,null,2)+'\n');
const changes=before.filter((item,i)=>JSON.stringify(item)!==JSON.stringify(after[i]));
const terminal={command:[process.execPath,...args],start,end:new Date().toISOString(),exitCode:run.status,signal:run.signal,error:run.error?.message??null,staticClosureFiles:before.length,closureChanges:changes.map(x=>x.file),ownedUnchanged:changes.every(x=>!owned.includes(x.file)),note:'Static relative-import closure and owned files only, not whole-repository source identity. Original default timeout; maxWorkers1. No browser, engine commands or visual acceptance.'};write('unit-r1.terminal.json',JSON.stringify(terminal,null,2)+'\n');console.log(JSON.stringify(terminal));if(run.status!==0)process.exitCode=1;
