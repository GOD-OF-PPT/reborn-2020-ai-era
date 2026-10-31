import fs from 'node:fs';import path from 'node:path';
import {json,hash,ident} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
const root='goal-1/evidence/t17-acceptance-40/interaction-runtime-r354',revision=process.argv[2],variant=process.argv[3];if(variant!==undefined&&!['original-storage360','trace-course'].includes(variant))throw Error('KNOWN_VARIANT_REQUIRED');
if(!/^\d+$/.test(revision??'')||fs.existsSync(root+'/stopped.json'))throw Error('ACTIVE_EXPLICIT_REVISION_REQUIRED');
const base=json('goal-1/evidence/t17-acceptance-40/save-cumulative-r349/snapshot351.json'),target=path.resolve('.delivery/t17-u6-runtime-r'+revision),owned=json(root+'/owned-source.json').paths;
if(fs.existsSync(target))throw Error('FRESH_TARGET_REQUIRED');fs.mkdirSync(target,{recursive:true});
for(const r of base.files){const p=path.join(base.target,r.path);if(hash(fs.readFileSync(p))!==r.sha256)throw Error('BASE_CHANGED:'+r.path);fs.mkdirSync(path.dirname(path.join(target,r.path)),{recursive:true});fs.copyFileSync(p,path.join(target,r.path));}
const overrides=[];for(const p of owned){const source=variant==='original-storage360'&&p==='src/ui/StoragePanel.tsx'?path.join(json(root+'/snapshot360.json').target,p):p;fs.mkdirSync(path.dirname(path.join(target,p)),{recursive:true});fs.copyFileSync(source,path.join(target,p));if(source!==p)overrides.push({path:p,source,sha256:hash(fs.readFileSync(source))})}
fs.symlinkSync(path.resolve('node_modules'),path.join(target,'node_modules'),'dir');
if(variant==='trace-course'){const p='src/ui/App.course-workspace.test.tsx',source=root+'/probe-course-source.test.tsx';fs.copyFileSync(source,path.join(target,p));overrides.push({path:p,source,sha256:hash(fs.readFileSync(source))})}
const names=[...new Set([...base.files.map(r=>r.path),...owned])].sort(),files=names.map(p=>{const b=fs.readFileSync(path.join(target,p));return {path:p,bytes:b.length,sha256:hash(b)}});
const report={at:new Date().toISOString(),baseSource:base.target,target,owned,files,overrides,p3OverlayCopied:false};
fs.writeFileSync(root+'/snapshot'+revision+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({target,files:files.length,owned:owned.length}));
