/** Bounded T15 diagnosis: exact original honest-agent test path, never gameplay acceptance. */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {evidenceDirectory} from './evidence-output.ts'
import {normalStoryPrepared} from '../src/testing/normal-story-scenario.ts'

const root=fileURLToPath(new URL('../',import.meta.url)),out=evidenceDirectory(root,'t15-honest-profile.json')
if(readdirSync(out).length)throw Error('FRESH_HONEST_PROFILE_DIRECTORY_REQUIRED')
const sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex'),paths=['src/core/life-validation.ts','src/core/life-state.ts','src/core/life.ts','src/testing/normal-story-scenario.ts','src/testing/normal-relay-scenario.ts','src/testing/story-harness.ts','src/application/story-risk-modes.test.ts','scripts/profile_life_honest.ts'],sourceHashes=Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(root,p)))])),started=performance.now(),stages:{name:string;milliseconds:number}[]=[]
function stage(name:string){const row={name,milliseconds:performance.now()-started};stages.push(row);console.log(JSON.stringify(row))}
const p=normalStoryPrepared('content_employee','t14-normal-risk-0'),h=p.h,d=h.run.story!.deployments[0]!
stage('normal-prehistory-and-prepared')
const prepared=h.codec.export(h.run);writeFileSync(join(out,'t15-honest-prepared.json'),prepared,{flag:'wx'})
h.send('SetHengxingAuthority',{deploymentId:d.id,businessId:d.businessId,level:'cross_flow',scopes:['relay_support','external_service_commitments'],cashLimitFen:100000,expiresAt:'2025-09-30',externalDelegation:true,consent:true})
stage('original-explicit-delegation')
h.at('2025-09-30',{work:false});stage('original-honest-quarter-end')
if(h.run.story!.incidents.filter(c=>c.kind==='agent').length!==0||h.run.story!.network[0]!.organisations.length!==3||h.run.story!.attempts.length!==0)throw Error('ORIGINAL_HONEST_ASSERTION_FAILED')
const final=h.codec.export(h.run);writeFileSync(join(out,'t15-honest-final.json'),final,{flag:'wx'});stage('final-strict-export')
const changed=paths.filter(p=>sha(readFileSync(join(root,p)))!==sourceHashes[p]);if(changed.length)throw Error('PROFILE_SOURCE_CHANGED:'+changed.join(','))
writeFileSync(join(out,'t15-honest-profile.json'),JSON.stringify({scope:'Node timing/profiling only; not browser, benchmark guarantee or overall game acceptance',seed:h.run.seed,background:h.run.backgroundId,sourceHashes,stages,elapsedMs:performance.now()-started,originalSemanticAssertionsPassed:true,originalTestLimitMs:120000,commands:h.commands,prepared:{file:'t15-honest-prepared.json',sha256:sha(prepared)},final:{file:'t15-honest-final.json',sha256:sha(final)}},null,2)+'\n',{flag:'wx'})
