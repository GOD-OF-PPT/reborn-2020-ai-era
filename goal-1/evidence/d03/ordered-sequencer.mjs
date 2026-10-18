import {BaseSequencer} from 'vitest/node'
import {readFileSync,writeFileSync} from 'node:fs'
import {join,relative} from 'node:path'
import {createHash} from 'node:crypto'

export default class D03OrderedSequencer extends BaseSequencer {
 async sort(files){
  const root=this.ctx.config.root,folder=join(root,'goal-1/evidence/d03'),freeze=JSON.parse(readFileSync(join(folder,'candidate1-source-freeze.json'),'utf8')).sha256
  const name=spec=>relative(root,spec.moduleId).split('\\').join('/'),expected=Object.keys(freeze).filter(p=>/^src\/.*\.test\.(ts|tsx)$/.test(p)).sort(),actual=files.map(name).sort()
  if(expected.length!==78||JSON.stringify(actual)!==JSON.stringify(expected))throw Error('D03_FULL_ORIGINAL_78_FILES_REQUIRED')
  if(files.some(spec=>spec.project.config.isolate!==true||spec.project.config.pool!=='forks'))throw Error('D03_ORIGINAL_PER_FILE_FORK_ISOLATION_REQUIRED')
  const ranked=await super.sort(files),priority=['src/application/story-agency.test.ts','src/application/story-routine.test.ts'],ordered=[...priority.map(p=>ranked.find(s=>name(s)===p)),...ranked.filter(s=>!priority.includes(name(s)))]
  if(ordered.some(s=>!s)||new Set(ordered).size!==files.length)throw Error('D03_SEQUENCE_MUST_NOT_OMIT_OR_DUPLICATE_FILES')
  const rows=ordered.map((spec,index)=>{const file=name(spec),sha256=createHash('sha256').update(readFileSync(spec.moduleId)).digest('hex');if(sha256!==freeze[file])throw Error('D03_TEST_SOURCE_CHANGED:'+file);return {position:index+1,file,sha256,isolate:spec.project.config.isolate,pool:spec.project.config.pool}})
  const result={scope:'full original suite, failed pair first as an execution-context probe; no source/assertion/deadline/isolation relaxation',files:rows,maxWorkers:this.ctx.config.maxWorkers,originalConfigSha256:createHash('sha256').update(readFileSync(join(root,'vitest.config.ts'))).digest('hex')}
  writeFileSync(join(folder,'cumulative-ordered/actual-file-order.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
  console.log('D03 original isolated file order:',JSON.stringify(rows.map(r=>r.file)))
  return ordered
 }
}
