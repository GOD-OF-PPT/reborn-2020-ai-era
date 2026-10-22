import {readFileSync,writeFileSync} from 'node:fs'
import {assertBrowserEvidenceWritable} from '../../../scripts/browser_evidence_guard.mjs'
import {unpackArchive,check,equal,sha} from '../../../scripts/relay-shape-evidence.ts'
const task='goal-1/evidence/t17-acceptance-18',root=process.cwd()+'/'+task
assertBrowserEvidenceWritable(root)
const ids=['RLY-C001','RLY-C022','RLY-C043','RLY-C032','RLY-C224'],rows=[]
let totalMembers=0,totalOriginalBytes=0
for(const id of ids){
 const folder='cases/'+id,first=JSON.parse(readFileSync(task+'/matrix-r9002/'+folder+'/case-index.json','utf8')),second=JSON.parse(readFileSync(task+'/matrix-r9003/'+folder+'/case-index.json','utf8'))
 equal(first.record,second.record,'FRESH_PILOT_COMPLETE_RECORD_CHANGED_'+id)
 const unpack=(run,index)=>{const map=new Map();for(const a of index.archives)for(const [n,r]of unpackArchive(task+'/'+run+'/'+folder+'/'+a.file,a)){check(!map.has(n),'DUPLICATE_PILOT_MEMBER');map.set(n,r)}return map}
 const a=unpack('matrix-r9002',first),b=unpack('matrix-r9003',second)
 equal([...a.keys()],[...b.keys()],'FRESH_PILOT_MEMBER_ORDER_CHANGED_'+id)
 let bytes=0
 for(const [name,raw]of a){check(b.get(name)===raw,'FRESH_PILOT_ORIGINAL_BYTES_CHANGED_'+id+'/'+name);bytes+=Buffer.byteLength(raw)}
 const proof1=JSON.parse(readFileSync(task+'/matrix-r9002/'+folder+'/pilot-suffix-audit.json','utf8')),proof2=JSON.parse(readFileSync(task+'/matrix-r9003/'+folder+'/pilot-suffix-audit.json','utf8'))
 check(proof1.classification===proof2.classification&&proof1.positive===proof2.positive,'FRESH_PILOT_CLASSIFICATION_CHANGED')
 rows.push({caseId:id,classification:proof2.classification,allOriginalBytesEqual:true,members:a.size,originalBytes:bytes,recordSha256:sha(JSON.stringify(second.record)),attempts:second.record.attempts.length})
 totalMembers+=a.size;totalOriginalBytes+=bytes
}
const result={scope:'Fresh same5 suffix pilots after exception preservation and explicit Stop provenance fixes; compare every complete original member, no new6Create/formal288.',passed:true,rows,totalMembers,totalOriginalBytes,formalCoreBranchesAccepted:0,compatibilityDevelopmentTests:0}
assertBrowserEvidenceWritable(root)
writeFileSync(root+'/pilot-full-member-equivalence-r3.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(result))
