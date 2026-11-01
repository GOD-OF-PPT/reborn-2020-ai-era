import fs from 'node:fs'
import {isDeepStrictEqual} from 'node:util'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/capital-current-audit-r437',capture=json(root+'/capture.json')
if(fs.existsSync(root+'/stopped.json')||fs.existsSync(root+'/journal-provenance.json'))throw Error('FRESH_SOURCE_CHECK_REQUIRED')
const full=fs.readFileSync(capture.journalSource)
let end=0
for(let i=0;i<capture.journalRows;i++){const next=full.indexOf(10,end);if(next<0)throw Error('COMPLETE_ORIGINAL_JOURNAL_LINES_REQUIRED');end=next+1}
const prefix=full.subarray(0,end),rows=prefix.toString('utf8').trimEnd().split('\n').map(line=>JSON.parse(line))
if(!isDeepStrictEqual(rows,json(root+'/audit-journal.json'))||rows.at(-1)?.revision!==capture.inputRevision||rows.at(-1)?.sha256!==capture.sha256||hash(fs.readFileSync(root+'/audit-input.json'))!==capture.sha256)throw Error('ORIGINAL_JOURNAL_PREFIX_DIFFERS_FROM_AUDITED_ARRAY')
fs.writeFileSync(root+'/audit-journal-original.jsonl',prefix,{flag:'wx'})
const result={at:new Date().toISOString(),source:capture.journalSource,originalPrefixRows:rows.length,originalPrefixBytes:prefix.length,originalPrefixSha256:hash(prefix),rawBytesPreserved:true,decodedRowsExactlyEqualPreviouslyAuditedArray:true,lastRevision:capture.inputRevision,lastHeadSha256:capture.sha256,newGameCommands:0,compatibility:0}
fs.writeFileSync(root+'/journal-provenance.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(result)
