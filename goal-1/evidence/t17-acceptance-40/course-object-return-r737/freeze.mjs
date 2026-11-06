import fs from 'node:fs';import path from 'node:path';
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
const root='goal-1/evidence/t17-acceptance-40/course-object-return-r737',revision=process.argv[2];
if(!/^\d+$/.test(revision??'')||fs.existsSync(root+'/stopped.json'))throw Error('ACTIVE_EXPLICIT_REVISION_REQUIRED');
const base=json('goal-1/evidence/t17-acceptance-40/route-choice-current-r728/snapshot736.json'),owned=[...json(root+'/baseline.json').owned],target=path.resolve('.delivery/t17-u6-course-object-return-r'+revision);
if(fs.existsSync(target))throw Error('FRESH_FROZEN_DIRECTORY_REQUIRED');
fs.mkdirSync(target);const rows=new Map();
for(const row of base.files){const source=path.join(base.target,row.path),bytes=fs.readFileSync(source);if(hash(bytes)!==row.sha256)throw Error('EXACT_BASE455_REQUIRED');const bridge=json('goal-1/evidence/t17-route-choice-current736-post/format-bridge.json'),delivered=row.path===bridge.path?bytes.subarray(0,bytes.length-1):bytes;if(row.path===bridge.path&&(hash(bytes)!==bridge.beforeSha256||hash(delivered)!==bridge.afterSha256))throw Error('DELIVERED_FORMAT_BRIDGE_REQUIRED');const out=path.join(target,row.path);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,delivered,{flag:'wx'});rows.set(row.path,{...row,bytes:delivered.length,sha256:hash(delivered)})}
for(const name of owned){const bytes=fs.readFileSync(name),out=path.join(target,name);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,bytes);rows.set(name,{path:name,sha256:hash(bytes),bytes:bytes.length})}
fs.symlinkSync(path.resolve('node_modules'),path.join(target,'node_modules'),'dir');
const manifest={at:new Date().toISOString(),revision:Number(revision),base:base.target,target,owned,files:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),baseFormatBridge:'goal-1/evidence/t17-route-choice-current736-post/format-bridge.json',p3OverlayCopied:false,compatibility:0};fs.writeFileSync(root+'/snapshot'+revision+'.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log({target,files:rows.size,owned:owned.length,p3OverlayCopied:false});
