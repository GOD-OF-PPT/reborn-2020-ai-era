import {BaseSequencer} from 'vitest/node'
import {readFileSync,writeFileSync} from 'node:fs'
import {join,relative} from 'node:path'
import {createHash} from 'node:crypto'

export default class CinematicSequencer extends BaseSequencer{
 async sort(files){
  const root=this.ctx.config.root,folder=join(root,'goal-1/evidence/d03-cinematic'),freeze=JSON.parse(readFileSync(join(folder,'candidate1-source-freeze.json'),'utf8')).sha256
  const name=spec=>relative(root,spec.moduleId).split('\\').join('/'),expected=Object.keys(freeze).filter(p=>/^src\/.*\.test\.(ts|tsx)$/.test(p)).sort(),actual=files.map(name).sort()
  if(expected.length!==79||JSON.stringify(actual)!==JSON.stringify(expected))throw Error('ALL_ORIGINAL78_PLUS_CINEMATIC_REGRESSION_REQUIRED')
  if(files.some(spec=>spec.project.config.isolate!==true||spec.project.config.pool!=='forks'))throw Error('ORIGINAL_FORK_ISOLATION_REQUIRED')
  const ranked=await super.sort(files),priority=['src/application/story-agency.test.ts','src/application/story-routine.test.ts'],ordered=[...priority.map(p=>ranked.find(s=>name(s)===p)),...ranked.filter(s=>!priority.includes(name(s)))]
  if(ordered.some(s=>!s)||new Set(ordered).size!==files.length)throw Error('NO_OMITTED_OR_DUPLICATED_TESTS')
  const rows=ordered.map((spec,index)=>{const file=name(spec),sha256=createHash('sha256').update(readFileSync(spec.moduleId)).digest('hex');if(sha256!==freeze[file])throw Error('TEST_SOURCE_CHANGED:'+file);return {position:index+1,file,sha256,isolate:spec.project.config.isolate,pool:spec.project.config.pool}})
  writeFileSync(join(folder,'cumulative/actual-file-order.json'),JSON.stringify({scope:'All495 original assertions plus1 cinematic rendering regression, original deadlines/config and per-file fork isolation; same pair-first ordering as the prior successful controlled run. Does not prove default-order timing stability.',maxWorkers:this.ctx.config.maxWorkers,originalConfigSha256:createHash('sha256').update(readFileSync(join(root,'vitest.config.ts'))).digest('hex'),files:rows},null,2)+'\n',{flag:'wx'})
  console.log('Cinematic full isolated file order:',JSON.stringify(rows.map(r=>r.file)))
  return ordered
 }
}
