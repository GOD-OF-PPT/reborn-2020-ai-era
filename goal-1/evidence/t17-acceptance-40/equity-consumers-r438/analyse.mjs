import fs from 'node:fs'
import path from 'node:path'
import {json} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/equity-consumers-r438',revision=process.argv[2],label=process.argv[3]
if(!/^\d+$/.test(revision??'')||!/^[-a-z0-9]+$/.test(label??'')||fs.existsSync(root+'/stopped.json'))throw Error('EXPLICIT_ACTIVE_REPORT_REQUIRED')
const source=json(root+'/snapshot'+revision+'.json'),report=json(root+'/'+label+'.vitest.json'),selected=json(root+'/selected-files.json').files,prior=json(root+'/prior405-cases.json').cases
const fileOf=name=>{const n=name.indexOf('src/ui/');if(n<0)throw Error('UNEXPECTED_TEST_FILE:'+name);return name.slice(n)}
const rows=report.testResults.map(row=>({file:fileOf(row.name),sourceSha256:source.files.find(f=>f.path===fileOf(row.name))?.sha256,status:row.status,message:row.message,cases:row.assertionResults.map((c,i)=>({index:i+1,fullName:c.fullName,status:c.status,duration:c.duration,failureMessages:c.failureMessages}))}))
if(JSON.stringify(rows.map(r=>r.file).sort())!==JSON.stringify([...selected].sort())||rows.some(r=>!r.sourceSha256))throw Error('ALL50_EXACT_FILES_MUST_HAVE_RESULTS')
const actual=new Map(),base=new Map(),key=(f,n)=>JSON.stringify([f,n])
for(const row of rows)for(const c of row.cases){const k=key(row.file,c.fullName);actual.set(k,(actual.get(k)??0)+1)}
for(const row of prior){const k=key(row.file,row.fullName);base.set(k,(base.get(k)??0)+1)}
const missing=[...base].flatMap(([k,n])=>(actual.get(k)??0)<n?[{identity:JSON.parse(k),priorCount:n,currentCount:actual.get(k)??0}]:[])
const allCases=rows.flatMap(r=>r.cases.map(c=>({file:r.file,...c}))),failed=allCases.filter(c=>c.status==='failed'),notExecuted=allCases.filter(c=>!['passed','failed'].includes(c.status))
const result={at:new Date().toISOString(),source:Number(revision),files:rows.length,caseCount:allCases.length,passed:allCases.filter(c=>c.status==='passed').length,failed:failed.length,notExecuted:notExecuted.length,prior405Cases:prior.length,priorCaseMultisetRetained:missing.length===0,missingPriorIdentities:missing,failedCases:failed,nonExecutedCases:notExecuted,rows,originalReportSuccess:report.success,boundedFunctionalOnly:true,compatibility:0,wholeU6Complete:false}
fs.writeFileSync(root+'/'+label+'.cases.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log({source:result.source,files:result.files,cases:result.caseCount,passed:result.passed,failed:result.failed,notExecuted:result.notExecuted,prior282Retained:result.priorCaseMultisetRetained,missing:missing.length})
if(missing.length||failed.length||notExecuted.length)console.log(JSON.stringify({missing,failed:failed.map(c=>({file:c.file,name:c.fullName,error:c.failureMessages.join('\n').slice(0,1200)})),notExecuted},null,2))
