import {readFileSync,writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {createCampaignCodec} from '../../../src/application/campaign.ts'
const dir=join(process.cwd(),'goal-1/evidence/d03'),codec=createCampaignCodec(),sha=v=>createHash('sha256').update(v).digest('hex'),manifest=JSON.parse(readFileSync(join(dir,'input-manifest.json'),'utf8')),rows=[]
for(const input of manifest.inputs){
 const raw=readFileSync(join(dir,input.file),'utf8'),run=codec.import(raw),canonical=codec.export(run)
 if(raw!==canonical&&raw!==canonical+'\n')throw Error('UNEXPLAINED_INPUT_FORMAT_DIFFERENCE:'+input.label)
 const file='canonical-'+input.file;writeFileSync(join(dir,file),canonical,{flag:'wx'})
 rows.push({label:input.label,originalFile:input.file,originalSha256:sha(raw),canonicalFile:file,canonicalSha256:sha(canonical),format:raw===canonical?'already canonical':'exactly one trailing LF from original collector',parsedObjectEqual:JSON.stringify(JSON.parse(raw))===JSON.stringify(JSON.parse(canonical)),strictImportAccepted:true,runId:run.runId,revision:run.revision})
}
const before=readFileSync(join(dir,'input-business2025.json'),'utf8'),actual=readFileSync(join(dir,'final-business95-after-review.json'),'utf8'),expected=readFileSync(join(dir,'canonical-input-business2025.json'),'utf8')
if(before!==actual+'\n'||expected!==actual)throw Error('BUSINESS_STATE_DIFFERENCE_NOT_FORMAT_ONLY')
const report={scope:'input transport-format diagnosis and independent strict canonical expectations; original files/hashes preserved, no gameplay fix or assertion weakening',initialRawByteEquality:false,diagnosis:'only one trailing LF, source collector explicitly appends raw+newline; every other byte and checksum match',collector:'scripts/collect_deepseek_evidence.ts:15',rawInputSha256:sha(before),uiExportSha256:sha(actual),independentCanonicalExpectedSha256:sha(expected),canonicalBusinessExportByteEqual:true,inputs:rows,requiresGameCodeChange:false}
writeFileSync(join(dir,'input-canonicalization-audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({businessMismatch:'one LF only',gameStateUnchanged:true,canonicalExpectedByteEqual:true,inputs:rows.map(r=>({label:r.label,format:r.format}))}))
