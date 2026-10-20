import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'

const root=process.cwd()
const task='goal-1/evidence/t17-acceptance-08'
const source=task+'/matrix-r1/technical_employee-t16-campaign-0/shape-24'
const output=task+'/diagnosis-r1/framing-same-seam-r2'
const check=(condition,message)=>{if(!condition)throw Error(message)}
const sha=value=>createHash('sha256').update(value).digest('hex')
check(!existsSync(output),'FRESH_OUTPUT_REQUIRED')
mkdirSync(output)
const index=JSON.parse(readFileSync(source+'/case-index.json','utf8'))
const sourceArchive=readFileSync(source+'/case-evidence.xz')
check(sourceArchive.length===index.archive.storedBytes&&sha(sourceArchive)===index.archive.storedSha256,'SOURCE_ARCHIVE_CHANGED')
const helper=(command,args,options={})=>execFileSync('rtk',['proxy','python3','scripts/evidence_xz_bundle.py',command,...args],
 {cwd:root,maxBuffer:300*1024*1024,timeout:120000,...options})
const original=helper('unpack',['--input',resolve(source,'case-evidence.xz')])
check(original.length===54163289&&original.length===index.archive.containerBytes&&sha(original)===index.archive.containerSha256,'REAL_COMPLETE_SOURCE_BODY_REQUIRED')
const descriptor=raw=>JSON.parse(raw).members.map(item=>({name:item.name,bytes:Buffer.byteLength(item.raw),sha256:sha(item.raw)}))
check(JSON.stringify(descriptor(original))===JSON.stringify(index.archive.members),'SOURCE_MEMBER_SET_CHANGED')
const rows=[]
for(let round=1;round<=3;round++){
 const file=resolve(output,'round-'+round+'.xz'),started=Date.now()
 // Match the actual collector: a complete UTF8 string passed to execFileSync.
 const text=original.toString('utf8')
 const proof=JSON.parse(helper('pack',['--output',file,'--container-bytes',String(Buffer.byteLength(text)),
  '--container-sha256',sha(text)],{input:text,encoding:'utf8'}))
 const restored=helper('unpack',['--input',file])
 const stored=readFileSync(file)
 check(restored.equals(original),'COMPLETE_BODY_BYTES_CHANGED')
 check(JSON.stringify(descriptor(restored))===JSON.stringify(index.archive.members),'COMPLETE_MEMBER_BYTES_CHANGED')
 check(proof.containerBytes===original.length&&proof.containerSha256===sha(original),'CONTAINER_DESCRIPTOR_CHANGED')
 check(JSON.stringify(proof.members)===JSON.stringify(index.archive.members),'MEMBER_DESCRIPTOR_CHANGED')
 check(stored.equals(sourceArchive),'DETERMINISTIC_XZ_CHANGED')
 rows.push({round,containerBytes:original.length,containerSha256:sha(original),members:proof.members.length,
  completeBodyBytesEqual:true,completeMemberBytesEqual:true,storedBytes:stored.length,
  storedSha256:sha(stored),sameXzAsLegacy:true,elapsedMs:Date.now()-started})
 writeFileSync(output+'/round-'+round+'.json',JSON.stringify(rows.at(-1),null,2)+'\n',{flag:'wx'})
 console.log(JSON.stringify(rows.at(-1)))
}
writeFileSync(output+'/complete.json',JSON.stringify({source,sourceArchiveSha256:sha(sourceArchive),rows,
 rawStagingFilesCreated:0,gameCommandsExecuted:0,compatibilityDevelopmentAndTests:0},null,2)+'\n',{flag:'wx'})
