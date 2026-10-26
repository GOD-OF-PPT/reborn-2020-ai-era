import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'

const root=path.dirname(fileURLToPath(import.meta.url)),intent=JSON.parse(fs.readFileSync(path.join(root,'intent.json'),'utf8')),sha=bytes=>createHash('sha256').update(bytes).digest('hex'),rows=[]
for(const row of intent.paths){
 const before=fs.readFileSync(row.preimage,'utf8'),after=fs.readFileSync(row.path,'utf8')
 if(sha(before)!==row.sha256)throw Error('PREIMAGE_CHANGED')
 let expected=before.replace("import {RelayThreadAction} from './RelayThreadAction.tsx'","import {RelayThreadAction} from './RelayThreadAction.tsx'\nimport {RoomTableau} from './RoomTableau.tsx'")
  .replace('const actionWrappers=new Set<unknown>([OpeningAttemptAction,DayThreadAction,VideoThreadAction,CourseThreadAction,RelayThreadAction])','const actionWrappers=new Set<unknown>([OpeningAttemptAction,DayThreadAction,VideoThreadAction,CourseThreadAction,RelayThreadAction,RoomTableau])')
 if(row.path.endsWith('video-day-continuity.test.tsx'))expected=expected.replace(" // Preserve the real wrapper's active/inactive contract and shared action;\n // do not invent a primary node just to make the quarter lookup succeed.",' // Preserve the real action contract. The pure tableau exposes its supplied\n // named slots through its actual render; no synthetic primary is inserted.')
 else expected=expected.replace(' // Run each real pure action wrapper: inactive wrappers yield children(null),\n // while an active choice keeps its original binding and protection checks.',' // Real action wrappers retain their active/inactive contract. Rendering the\n // pure tableau reveals its named slots without replacing any choice handler.')
 if(after!==expected)throw Error('OUT_OF_SCOPE_TEST_EDIT:'+row.path)
 const important=source=>source.split('\n').filter(line=>/\bexpect\(|^it\b|beforeEach\(|},[0-9]+\)/.test(line))
 if(JSON.stringify(important(before))!==JSON.stringify(important(after)))throw Error('ASSERTION_OR_GATE_CHANGED')
 rows.push({before:row,after:{path:row.path,bytes:Buffer.byteLength(after),sha256:sha(after),mode:fs.lstatSync(row.path).mode&0o777},onlyActualPureTableauExpansion:true,allOriginalCasesAssertionsAndTimeoutsUnchanged:true})
}
for(const log of intent.originalRed){const bytes=fs.readFileSync(log.path);if(bytes.length!==log.bytes||sha(bytes)!==log.sha256)throw Error('ORIGINAL_RED_CHANGED')}
const result={at:new Date().toISOString(),status:'test-driver changes frozen for Root verification',paths:rows,originalFailures:{stdout:intent.originalRed[0],stderr:intent.originalRed[1],identities:['video-day-continuity: work quarter main undefined','video-day-continuity: video quarter main undefined','OpeningMoment.focus-book: bookmark handler not reached']},scope:'Only the two assigned existing test drivers changed: actual RoomTableau rendering exposes named slots. No scene/case/assertion or time/financial/save gate removed.',execution:{tests:false,build:false,Native:false,Git:false,productChanges:false},preparationNote:'An earlier inline metadata command was rejected by shell quoting before execution; no source or artifact changed by that command.',limit:'Static exact-text comparison is authoring verification only. It does not claim the3 red cases or97 UI batch pass.'}
guard(root);fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
guard(root);fs.writeFileSync(path.join(root,'tasks.md'),'# 同一U0-R内部测试驱动修复实际记录\n\n- [x] R4 stdout/stderr原红与两份源前像已登记，原日志保持。\n- [x] 两测试仅引入并实际展开纯RoomTableau，读取原slots元素；所有原case/expect/时限逐字保持。\n- [x] 精确静态差异核定完成并停止写入，未跑tests/build/Native/Git。\n\n[杠精审查] 作者范围核定通过，实际原红复验交Root，不冒测试已过。\n')
console.log(JSON.stringify({frozen:true,files:rows.map(row=>row.after),originalAssertionsPreserved:true,testsExecuted:false}))
