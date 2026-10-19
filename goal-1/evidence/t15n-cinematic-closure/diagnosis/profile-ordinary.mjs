/** Diagnosis only: exact existing ordinary-agent scenario and assertions; not browser acceptance. */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {evidenceDirectory} from '../../../../scripts/evidence-output.ts';
import {normalStoryPrepared} from '../../../../src/testing/normal-story-scenario.ts';
import {addDays} from '../../../../src/core/calendar.ts';
import {hashValue} from '../../../../src/core/hash.ts';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),out=evidenceDirectory(root,'ordinary-path.json'),sha=x=>createHash('sha256').update(x).digest('hex');
if(readdirSync(out).some(n=>!n.endsWith('.cpuprofile')))throw Error('FRESH_ORDINARY_PROFILE_DIRECTORY_REQUIRED');
function files(dir){return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name):/\.(ts|tsx|css)$/.test(e.name)?[dir+'/'+e.name]:[]);}
const paths=[...files('src'),'package.json','package-lock.json','vitest.config.ts','goal-1/evidence/t15n-cinematic-closure/diagnosis/profile-ordinary.mjs'];
const sourceHashes=Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(root,p)))])),stages=[],started=performance.now(),cpuStarted=process.cpuUsage();
function stage(name){const row={name,elapsedMs:performance.now()-started,cpu:process.cpuUsage(cpuStarted)};stages.push(row);console.log('[T15N-ORDINARY-DIAG] '+JSON.stringify(row));}
const p=normalStoryPrepared('technical_employee','t14-normal-risk-6'),h=p.h,d=h.run.story.deployments[0];stage('normal-prehistory-and-preparation');
writeFileSync(join(out,'ordinary-prepared.json'),p.beforeExpansion,{flag:'wx'});
h.send('SetHengxingAuthority',{deploymentId:d.id,businessId:d.businessId,level:'cross_flow',scopes:['relay_support','external_service_commitments'],cashLimitFen:100000,expiresAt:'2025-09-30',externalDelegation:true,consent:true});stage('explicit-authority');
h.at(addDays(h.run.timeline.cursor.date,7),{work:false});stage('ordinary-signal');
const c=h.run.story.incidents.find(c=>c.kind==='agent');if(!c)throw Error('EXPECTED_ACTUAL_AGENT_INCIDENT');
h.send('StopHengxingAuthority',{deploymentId:d.id});const rng=hashValue(h.run.random.streams.crisis);stage('stop-without-assuming-revocation');
h.send('StartRiskTask',{incidentId:c.id,kind:'investigate',accountId:p.b.accountId,resourceId:'player-production'});h.at(h.run.story.jobs.at(-1).completeAt,{work:false});stage('paid-independent-investigation');
h.send('ConfirmRiskAssessment',{incidentId:c.id});
const finalCase=h.run.story.incidents.find(v=>v.id===c.id);if(finalCase.stage!=='normal'||finalCase.verdict!=='ordinary'||h.run.story.attempts.length!==0||h.run.story.externalDelegations[0].revocationVerifiedAt!==null||hashValue(h.run.random.streams.crisis)!==rng)throw Error('ORIGINAL_ORDINARY_ASSERTIONS_FAILED');
stage('all-original-semantic-assertions');const originalPathMs=stages.at(-1).elapsedMs,final=h.codec.export(h.run);writeFileSync(join(out,'ordinary-final.json'),final,{flag:'wx'});stage('extra-final-diagnostic-export');
for(const [file,hash] of Object.entries(sourceHashes))if(sha(readFileSync(join(root,file)))!==hash)throw Error('DIAGNOSIS_SOURCE_CHANGED:'+file);
writeFileSync(join(out,'ordinary-path.json'),JSON.stringify({scope:'Node diagnosis only. Original exact test is the acceptance loop; CPU sampling overhead and CLI execution are not equivalent to Vitest or browser performance.',node:process.version,execArgv:process.execArgv,sampled:process.execArgv.some(x=>x.startsWith('--cpu-prof')),seed:h.run.seed,backgroundId:h.run.backgroundId,versions:h.run.versions,sourceHashes,stages,originalPathMs,originalLimitMs:120000,belowOriginalWallLimit:originalPathMs<=120000,semanticAssertionsPassed:true,commands:h.commands,prepared:{file:'ordinary-prepared.json',sha256:sha(p.beforeExpansion)},final:{file:'ordinary-final.json',sha256:sha(final)}},null,2)+'\n',{flag:'wx'});
console.log('[T15N-ORDINARY-DIAG] '+JSON.stringify({originalPathMs,belowOriginalWallLimit:originalPathMs<=120000,semanticAssertionsPassed:true}));
