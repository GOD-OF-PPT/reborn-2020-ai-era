import fs from 'node:fs';import path from 'node:path';import cp from 'node:child_process';import crypto from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const root=path.dirname(new URL(import.meta.url).pathname),baseline=JSON.parse(fs.readFileSync(root+'/baseline.json','utf8')),base=JSON.parse(fs.readFileSync(baseline.baseManifest,'utf8')),owned=baseline.owned.map(r=>r.path),target=path.resolve('.delivery/t17-u6-cumulative-r807'),node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node',mode=process.argv[2],iteration=process.argv[3]??'1';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function put(name,value){guard(root);const text=JSON.stringify(value,null,2)+'\n';const bytes=fs.readdirSync(root).reduce((sum,n)=>sum+(fs.statSync(root+'/'+n).isFile()?fs.statSync(root+'/'+n).size:0),0);if(bytes+Buffer.byteLength(text)>baseline.evidenceByteLimit)throw Error('COMPACT_EVIDENCE_LIMIT');fs.writeFileSync(root+'/'+name,text,{flag:'wx'})}
if(!/^\d+$/.test(iteration))throw Error('EXPLICIT_ITERATION_REQUIRED');guard(root);
if(mode==='prepare'){
 if(!fs.existsSync(target))fs.mkdirSync(target,{recursive:true});
 for(const row of base.files){const original=path.join(base.target,row.path),out=path.join(target,row.path);if(hash(fs.readFileSync(original))!==row.sha256)throw Error('BASE_CHANGED:'+row.path);if(owned.includes(row.path))continue;fs.mkdirSync(path.dirname(out),{recursive:true});if(!fs.existsSync(out))fs.linkSync(original,out);if(hash(fs.readFileSync(out))!==row.sha256)throw Error('NON_OWNED_CHANGED:'+row.path)}
 const overlay=owned.map(name=>{const data=fs.readFileSync(name),out=path.join(target,name),tmp=out+'.overlay-'+iteration;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(tmp,data,{flag:'wx'});fs.renameSync(tmp,out);return {path:name,sha256:hash(data),bytes:data.length}});
 if(!fs.existsSync(target+'/node_modules'))fs.symlinkSync(path.resolve('node_modules'),target+'/node_modules','dir');
 const patch=cp.execFileSync('git',['diff','--',...owned]);fs.writeFileSync(root+'/owned-'+iteration+'.patch',patch,{flag:'wx'});
 put('source-'+iteration+'.json',{baseManifest:baseline.baseManifest,baseManifestSha256:hash(fs.readFileSync(baseline.baseManifest)),target,sourceRows:base.files.length,owned:overlay,iteration,sourceId:hash(Buffer.from(JSON.stringify(overlay))),hardLinkedNonOwned:base.files.length-overlay.length,sourceImagesCopied:0});console.log('prepared one workspace;non-owned sources hard linked;owned overlay independent');process.exit(0);
}
const source=json(root+'/source-'+iteration+'.json'),overlay=new Map(source.owned.map(r=>[r.path,r]));
function exact(){for(const row of base.files){const expected=overlay.get(row.path)??row;if(hash(fs.readFileSync(target+'/'+row.path))!==expected.sha256)throw Error('SOURCE_CHANGED:'+row.path)}}
exact();
if(['tests','type','build'].includes(mode)){
 const files=json(root+'/test-files.json');for(const name of files){const text=fs.readFileSync(target+'/'+name,'utf8');if(/IDBFactory|createCampaignCodec|IndexedDbRunStore|exportSaved|\/persistence\/|fake-indexeddb/.test(text))throw Error('PROHIBITED_SUITE_BEFORE_EXECUTION:'+name)}
 const args=mode==='tests'?['node_modules/vitest/vitest.mjs','run','--maxWorkers=1','--no-file-parallelism',...files,'--reporter=dot']:mode==='type'?['node_modules/typescript/bin/tsc','-b','--pretty','false']:['node_modules/vite/bin/vite.js','build','--outDir','dist-u6-review'];
 const started=Date.now(),result=cp.spawnSync(node,args,{cwd:target,env:{...process.env,PATH:path.dirname(node)+':'+process.env.PATH},encoding:'utf8',maxBuffer:16*1024*1024});exact();
 const output=(result.stdout+'\n'+result.stderr).replace(/\x1b\[[0-9;]*m/g,'');let linkedFiles=0,linkedBytes=0;
 if(mode==='build'&&result.status===0){const main=path.resolve('.delivery/t17-u6-main-r416');for(const entry of fs.readdirSync(target+'/dist-u6-review/assets')){const p=target+'/dist-u6-review/assets/'+entry,q=main+'/assets/'+entry;if(fs.statSync(p).isFile()&&fs.existsSync(q)&&hash(fs.readFileSync(p))===hash(fs.readFileSync(q))){linkedFiles++;linkedBytes+=fs.statSync(p).size;fs.unlinkSync(p);fs.linkSync(q,p)}}}
 const report={sourceId:source.sourceId,iteration,mode,exitCode:result.status,signal:result.signal,wallMs:Date.now()-started,sourceExact:true,fullUiFiles:mode==='tests'?files.length:undefined,summary:mode==='tests'?output.split('\n').filter(l=>/^\s*(Test Files|Tests|Duration)/.test(l)):[],failure:result.status!==0?output.slice(-6000):undefined,outputSha256:hash(Buffer.from(output)),dedupedBuildFiles:linkedFiles,dedupedBuildBytes:linkedBytes,screenshots:0,storageAssociatedTests:0,compatibility:0};put(mode+'-'+iteration+'.json',report);console.log(JSON.stringify(report));process.exit(result.status===0?0:1);
}
if(mode==='publish'){
 for(const kind of ['tests','type','build'])if(json(root+'/'+kind+'-'+iteration+'.json').exitCode!==0)throw Error('PASSED_CHECKS_REQUIRED');
 const dist=target+'/dist-u6-review',main=path.resolve('.delivery/t17-u6-main-r416'),old=new Map(fs.readdirSync(main+'/assets').map(name=>[name,hash(fs.readFileSync(main+'/assets/'+name))]));
 for(const name of fs.readdirSync(dist+'/assets')){const p=dist+'/assets/'+name,q=main+'/assets/'+name;if(fs.existsSync(q)){if(hash(fs.readFileSync(p))!==hash(fs.readFileSync(q)))throw Error('ASSET_COLLISION')}else fs.linkSync(p,q)}
 const index=fs.readFileSync(dist+'/index.html'),previous=fs.readFileSync(main+'/index.html'),tmp=main+'/index.cumulative807.tmp';fs.writeFileSync(tmp,index,{flag:'wx'});fs.renameSync(tmp,main+'/index.html');for(const [name,h] of old)if(hash(fs.readFileSync(main+'/assets/'+name))!==h)throw Error('OLD_ASSET_CHANGED');
 const refs=[...new Set([...index.toString().matchAll(/(?:src|href)="(\/assets\/[^"<>]+)"/g)].map(m=>m[1]))],http=[];
 for(const ref of ['/',...refs]){const result=await fetch('http://127.0.0.1:5415'+ref),body=Buffer.from(await result.arrayBuffer()),expected=ref==='/'?index:fs.readFileSync(dist+ref);if(!result.ok||!body.equals(expected))throw Error('HTTP_MISMATCH:'+ref);http.push({path:ref,sha256:hash(body)})}
 put('publication.json',{sourceId:source.sourceId,previousIndexSha256:hash(previous),indexSha256:hash(index),preservedOldAssets:old.size,http,newAssetFilesHardLinked:true,screenshots:0});console.log('published local index;old assets retained;HTTP entries verified');process.exit(0);
}
throw Error('KNOWN_OPERATION_REQUIRED');
