import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {read,guard,sha,directory} from '../io.mjs'
const output=path.dirname(fileURLToPath(import.meta.url)),source=read(directory+'/readback.mjs')
guard(output)
let body=source.bytes.toString('utf8')
body=body.replaceAll("'../../../../src/","'../../../../../src/")
const before="import {read,put,directory,same} from './io.mjs'"
if(!body.includes(before))throw Error('EXACT_READBACK_IMPORT_REQUIRED')
body=body.replace(before,"import fs from 'node:fs'\nimport path from 'node:path'\nimport {fileURLToPath} from 'node:url'\nimport {operatingId} from '../../../../../src/core/operations-calendar.ts'\nimport {read,directory,same,guard} from '../io.mjs'\nconst ownOutput=path.dirname(fileURLToPath(import.meta.url))\nconst put=(name,value)=>{guard(ownOutput);fs.writeFileSync(path.join(ownOutput,name),JSON.stringify(value,null,2)+'\\n',{flag:'wx'})}")
const wrong="q1Employment[0].actionId===workReceipts[0].commandId"
if(body.split(wrong).length!==2)throw Error('EXACT_SINGLE_WRONG_ID_COMPARISON_REQUIRED')
body=body.replace(wrong,"q1Employment[0].actionId===operatingId(workReceipts[0].commandId,'WorkQuarter')&&q1Employment[0].id===operatingId(workReceipts[0].commandId,'WorkQuarter')")
guard(output);fs.writeFileSync(path.join(output,'readback.mjs'),body,{flag:'wx'})
guard(output);fs.writeFileSync(path.join(output,'preparation.json'),JSON.stringify({at:new Date().toISOString(),source:source.identity,newHelper:{bytes:Buffer.byteLength(body),sha256:sha(body)},semanticChanges:['Use frozen original operatingId(commandId, WorkQuarter) for employment action identity','Also assert employment.id equals that same original identity'],infrastructureChanges:['Import paths gain one parent segment','Guarded wx outputs use fresh r2 subdirectory'],allOtherAssertionsPreserved:true,fullCreateWillNotRerun:true},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({prepared:true,oldSource:source.identity,newBytes:Buffer.byteLength(body),newSha256:sha(body)}))
