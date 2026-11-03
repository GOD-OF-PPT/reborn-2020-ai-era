import fs from 'node:fs'
import path from 'node:path'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/save-capacity-r471',revision=process.argv[2],owned=json(root+'/owned.json').owned,base=json(json(root+'/owned.json').baseManifest)
if(!/^\d+$/.test(revision??'') || fs.existsSync(root+'/stopped.json')) throw Error('ACTIVE_EXPLICIT_REVISION_REQUIRED')
const target=path.resolve('.delivery/t17-u6-save-capacity-r'+revision)
if(fs.existsSync(target)) throw Error('FRESH_FROZEN_TARGET_REQUIRED')
fs.mkdirSync(target);const rows=new Map()
for(const row of base.files){const bytes=fs.readFileSync(path.join(base.target,row.path));if(hash(bytes)!==row.sha256)throw Error('FROZEN469_CHANGED');const out=path.join(target,row.path);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,bytes,{flag:'wx'});rows.set(row.path,{...row})}
for(const name of owned){const bytes=fs.readFileSync(name),out=path.join(target,name);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,bytes);rows.set(name,{path:name,bytes:bytes.length,sha256:hash(bytes)})}
fs.symlinkSync(path.resolve('node_modules'),path.join(target,'node_modules'),'dir')
const result={at:new Date().toISOString(),revision:Number(revision),base:base.target,target,owned,files:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),p3OverlayCopied:false,compatibility:0}
fs.writeFileSync(root+'/snapshot'+revision+'.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log({revision:Number(revision),files:rows.size,owned:owned.length,p3OverlayCopied:false})
