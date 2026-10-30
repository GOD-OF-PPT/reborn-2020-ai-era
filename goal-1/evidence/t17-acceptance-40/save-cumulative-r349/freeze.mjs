import fs from 'node:fs';import path from 'node:path';
import {json,hash,ident} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
const root='goal-1/evidence/t17-acceptance-40/save-cumulative-r349',revision=process.argv[2];
if(!/^\d+$/.test(revision??'')||fs.existsSync(root+'/stopped.json'))throw Error('ACTIVE_EXPLICIT_REVISION_REQUIRED');
const base=json('goal-1/evidence/t17-acceptance-40/save-chain-r348/snapshot347.json'),target=path.resolve('.delivery/t17-u6-review-r'+revision),owned=['src/core/ledger.ts','src/core/ledger-signature-cache.test.ts'];
if(fs.existsSync(target))throw Error('FRESH_TARGET_REQUIRED');fs.mkdirSync(target,{recursive:true});
for(const r of base.files){const p=path.join(base.target,r.path);if(hash(fs.readFileSync(p))!==r.sha256)throw Error('BASE_CHANGED:'+r.path);fs.mkdirSync(path.dirname(path.join(target,r.path)),{recursive:true});fs.copyFileSync(p,path.join(target,r.path));}
for(const p of owned)fs.copyFileSync(p,path.join(target,p));
fs.symlinkSync(path.resolve('node_modules'),path.join(target,'node_modules'),'dir');
const names=[...new Set([...base.files.map(r=>r.path),...owned])].sort(),files=names.map(p=>{const b=fs.readFileSync(path.join(target,p));return {path:p,bytes:b.length,sha256:hash(b)}});
const report={at:new Date().toISOString(),baseSource:base.target,target,owned,files,p3OverlayCopied:false};
fs.writeFileSync(root+'/snapshot'+revision+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({target,files:files.length,owned:owned.length}));
