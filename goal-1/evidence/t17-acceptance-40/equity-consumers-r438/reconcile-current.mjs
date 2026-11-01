import fs from 'node:fs'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/equity-consumers-r438',changed='src/ui/App.deepseek-entry.test.tsx',first=json(root+'/current50-r1.cases.json'),target=json(root+'/entry-locator-r2.vitest.json'),reuse=json(root+'/source-reuse439.json'),source=json(root+'/snapshot439.json')
if(fs.existsSync(root+'/stopped.json')||first.files!==50||first.caseCount!==336||first.failed!==2||first.notExecuted!==0||!first.priorCaseMultisetRetained||!target.success||target.numFailedTests!==0||target.numTotalTests!==3||JSON.stringify(reuse.changed)!==JSON.stringify([changed]))throw Error('EXACT_FIRST_AND_TARGETED_RESULTS_REQUIRED')
const row=target.testResults.find(row=>row.name.endsWith('/'+changed))
if(!row||target.testResults.length!==1)throw Error('EXACT_ONE_COMPLETE_TARGET_FILE_REQUIRED')
const old=first.rows.find(row=>row.file===changed),newCases=row.assertionResults.map((c,i)=>({index:i+1,fullName:c.fullName,status:c.status,duration:c.duration,failureMessages:c.failureMessages}))
if(JSON.stringify(old.cases.map(c=>c.fullName).sort())!==JSON.stringify(newCases.map(c=>c.fullName).sort()))throw Error('ORIGINAL_TARGET_CASE_IDENTITIES_MUST_REMAIN')
const rows=first.rows.map(r=>r.file===changed?{file:changed,sourceSha256:source.files.find(r=>r.path===changed).sha256,status:row.status,cases:newCases,evidenceSource:439,report:root+'/entry-locator-r2.vitest.json',evidenceKind:'targeted complete file rerun'}:{...r,evidenceSource:436,report:root+'/current50-r1.vitest.json',evidenceKind:'unchanged source reuse'})
if(rows.some(r=>r.status!=='passed'||r.cases.some(c=>c.status!=='passed')))throw Error('EVERY_CURRENT_CASE_REQUIRES_ACTUAL_PASS_EVIDENCE')
const unchangedCases=rows.filter(r=>r.file!==changed).reduce((n,r)=>n+r.cases.length,0)
if(unchangedCases!==333||rows.reduce((n,r)=>n+r.cases.length,0)!==336)throw Error('EXACT_NON_DUPLICATED_CURRENT_CASE_ACCOUNTING_REQUIRED')
for(const r of rows)if(r.sourceSha256!==source.files.find(s=>s.path===r.file)?.sha256)throw Error('REUSED_FILE_NOT_IDENTICAL_TO_CURRENT_SOURCE:'+r.file)
const result={at:new Date().toISOString(),currentSource:439,productSourceUnchangedFrom436:true,files:50,cases:336,reusedFiles:49,reusedCases:333,targetedRerunFiles:1,targetedRerunCases:3,oneWholeGreenBatch:false,originalFirstBatch:{source:436,passed:334,failed:2,notExecuted:0},original405CaseMultisetRetained:true,sourceRows:969,sourceComparisonReport:root+'/source-reuse439.json',priorRedReport:root+'/current50-r1.vitest.json',targetedReport:root+'/entry-locator-r2.vitest.json',rows,compatibility:0,wholeU6Complete:false}
fs.writeFileSync(root+'/current-case-evidence.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log({files:50,cases:336,unchangedSourceReuse:333,targetedNew:3,old282Preserved:true,oneWholeGreenBatch:false,productChanges:0})
