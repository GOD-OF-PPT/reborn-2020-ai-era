import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from './evidence-output.ts'
import {normalLifePeople} from '../src/testing/normal-life-scenario.ts'
import {StoryHarness} from '../src/testing/story-harness.ts'
import {createCampaignRun,campaignLife,campaignRuntime} from '../src/application/campaign.ts'
import {projectLife} from '../src/core/life-projection.ts'
import {accountFunds} from '../src/core/ledger.ts'
import {actionBudget} from '../src/core/economy.ts'
import {addDays} from '../src/core/calendar.ts'
import {hashValue} from '../src/core/hash.ts'

const root=fileURLToPath(new URL('../',import.meta.url)),out=evidenceDirectory(root,'t15-life-evidence.json'),sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex')
if(readdirSync(out).length)throw Error('NONEMPTY_LIFE_EVIDENCE_DIRECTORY: choose a fresh directory')
function sources(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(i=>i.isDirectory()?sources(dir+'/'+i.name):/\.(tsx?|css)$/.test(i.name)?[dir+'/'+i.name]:[])}
const paths=[...sources('src'),'scripts/collect_life_evidence.ts','scripts/evidence-output.ts','docs/34-people-life-year-contract.md','package.json','package-lock.json','index.html','vitest.config.ts'],sourceHashes=Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(root,p)))])),cases:unknown[]=[],failures:unknown[]=[]
function check(condition:unknown,message:string):asserts condition{if(!condition)throw Error(message)}
function normal(id:string,backgroundId='technical_employee',seed='t15-fixed-'+id){return new StoryHarness({priorRun:createCampaignRun({runId:'t15-'+id,actorId:'player',commandId:'create',backgroundId,seed})})}
function friend(id:string){const h=normal(id);h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});h.at('2020-01-04',{work:false});return h}
function capture(id:string,h:StoryHarness,states:Record<string,string>,expected:unknown,scope:string){
 const snapshots=Object.fromEntries(Object.entries({initial:h.codec.export(h.initial),...states,final:h.codec.export(h.run)}).map(([stage,raw])=>{check(h.codec.export(h.codec.import(raw))===raw,'NONCANONICAL_LIFE_SNAPSHOT');const file='t15-'+id+'-'+stage+'.json';writeFileSync(join(out,file),raw,{flag:'wx'});return [stage,{file,sha256:sha(raw),revision:h.codec.import(raw).revision}]}))
 cases.push({id,origin:h.run.origin,seed:h.run.seed,versions:h.run.versions,scope,expected,snapshots,commands:h.commands,actual:{date:h.run.timeline.cursor.date,revision:h.run.revision,personal:accountFunds(h.run.economy.ledger,'personal'),budget:actionBudget(h.run.economy,h.run.timeline.cursor.date),salaryPayments:h.run.operations!.payroll.filter(p=>p.kind==='salary'&&p.amountFen>0).length,openingCashOperations:h.run.economy.ledger.receipts.filter(r=>r.kind==='opening_cash').length,life:projectLife(h.run,campaignLife,campaignRuntime.pack)}})
 console.log(JSON.stringify({id,status:'PASS',commands:h.commands.length,date:h.run.timeline.cursor.date}))
}
function attempt(id:string,work:()=>void){try{work()}catch(error){const row={id,status:'FAILED',message:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:null};failures.push(row);console.log(JSON.stringify(row))}}
for(const background of ['technical_employee','content_employee'])attempt('normal-four-people-'+background,()=>{
 const {h,snapshots}=normalLifePeople(background),life=projectLife(h.run,campaignLife,campaignRuntime.pack)
 check(life.people.every(p=>p.relationship.stage==='reliable'),'FOUR_ACTUAL_RELATIONSHIPS_REQUIRED');check(life.jobs.filter(j=>j.status==='completed').length===10,'TEN_ACTUAL_WORKS_REQUIRED');check(life.promises.filter(p=>p.status==='fulfilled').length===4,'FOUR_ACTUAL_PROMISES_REQUIRED');check(life.scene.workspaceCompleted&&life.scene.lastRestCompletedAt!==null,'ACTUAL_SCENE_AND_REST_REQUIRED')
 capture('normal-four-people-'+background,h,snapshots,{fourPeople:'reliable_from_paid_work',fulfilled:4,completedWorks:10,workspaceOnlyAfterActualCompletion:true},'normal2020 opening, intact commands, actual payroll/living/case/independent consent/private costs; Q2/2021 and Q4/2022 explicitly replace employment with personal work. Ends2022, not full24quarter or native prehistory')
})
attempt('fixed-linzhou-refusal',()=>{
 const h=normal('fixed-linzhou-refusal','technical_employee','t14-linzhou-normal-7');h.at('2020-01-29',{prepareManualCase:true});h.at('2021-01-01');h.send('StartLinzhouWork',{kind:'pilot',resourceId:'player-production'});h.at('2021-01-08');h.send('StartLinzhouWork',{kind:'continuity',resourceId:'player-production'});h.at('2021-01-15');h.at('2021-04-01');h.send('StartLinzhouWork',{kind:'participation',resourceId:'player-production'});h.at('2021-04-09')
 check(h.run.story!.linzhou.willingness==='declined','FIXED_REFUSAL_CHANGED');check(h.reject('StartLifeWork',{kind:'linzhou_review',personId:'linzhou',reference:null}).includes('LIFE_ACTUAL_REFERENCE_REQUIRED'),'REFUSAL_BYPASSED');check(!projectLife(h.run,campaignLife,campaignRuntime.pack).people.find(p=>p.id==='linzhou')!.references.length,'REFUSAL_REFERENCE_LEAK')
 capture('fixed-linzhou-refusal',h,{}, {originalWillingness:'declined',lifeWorkRejected:true},'original fixed refusal7 preserved; actual preparation and paid cooperation do not buy another actor consent; no reroll or forced open branch')
})
for(const outcome of ['fulfilled-on-deadline','missed','expired','declined'])attempt('promise-'+outcome,()=>{
 const h=friend('promise-'+outcome),promise=h.run.life!.promises[0]!,states:Record<string,string>={offered:h.codec.export(h.run)}
 if(outcome==='declined')h.send('DeclineLifePromise',{promiseId:promise.id})
 else if(outcome==='expired')h.at(addDays(promise.expiresAt,1),{work:false})
 else{h.send('AcceptLifePromise',{promiseId:promise.id,consent:true});states.accepted=h.codec.export(h.run);if(outcome==='fulfilled-on-deadline'){h.at('2020-02-15',{work:false});h.send('FulfillLifePromise',{promiseId:promise.id});states.working=h.codec.export(h.run)}h.at(promise.deadline,{work:false})}
 const expected=outcome==='fulfilled-on-deadline'?'fulfilled':outcome;check(h.run.life!.promises[0]!.status===expected,'PROMISE_OUTCOME_MISMATCH')
 capture('promise-'+outcome,h,states,{status:expected,deadline:promise.deadline,acceptanceNotFreeFulfillment:true},'normal personal work, explicit or unaccepted default response; deadline-day actual completion precedes missed judgment; no new wages/cash edits/free work')
})
attempt('npc-own-calendar',()=>{
 const h=normal('npc-own-calendar');h.at('2020-06-20',{work:false});h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});h.at('2020-06-23',{work:false});const offered=h.codec.export(h.run);h.at('2020-07-01',{work:false})
 check(h.run.life!.promises[0]!.status==='npc_declined','NPC_DID_NOT_CHOOSE_OWN_PLAN');check(h.reject('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}).includes('LIFE_PERSON_UNAVAILABLE'),'NPC_CALENDAR_IGNORED')
 capture('npc-own-calendar',h,{offered},{status:'npc_declined',playerMissed:false},'NPC withdraws only an unaccepted invitation at own announced calendar; no player trust penalty or refund of actual past shared work')
})
attempt('interrupted-retry-scene',()=>{
 const h=normal('interrupted-retry-scene'),rng=hashValue(h.run.random);h.send('SetLifePriority',{year:2020,priority:'workspace'});check(!projectLife(h.run,campaignLife,campaignRuntime.pack).scene.workspaceCompleted,'PRIORITY_CHANGED_SCENE');h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});const running=h.codec.export(h.run);h.send('InterruptLifeWork',{jobId:h.run.life!.jobs[0]!.id});const interrupted=h.codec.export(h.run);h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});h.at('2020-01-08',{work:false})
 check(h.run.life!.jobs[0]!.status==='interrupted'&&h.run.life!.jobs[1]!.status==='completed','INTERRUPTED_HISTORY_REPLACED');check(accountFunds(h.run.economy.ledger,'personal').cashFen===2000000,'RETRY_COST_WAS_REFUNDED');check(actionBudget(h.run.economy,'2020-01-08').spent===2,'RETRY_AP_WAS_REFUNDED');check(hashValue(h.run.random)===rng,'LIFE_CHANGED_RANDOM')
 capture('interrupted-retry-scene',h,{running,interrupted},{cashFen:2000000,spentAP:2,oneCompletedWorkspace:true,randomUnchanged:true},'two actual3000yuan payments and twoAP, first interrupted without result; setting goal/start/interruption cannot show improved room; UI reads do not create work')
})
attempt('zero-available-and-ap-stop',()=>{
 const h=normal('zero-available-and-ap-stop');h.send('WorkQuarter',{});h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});h.send('ResearchMarket',{definitionId:'market-overview'})
 for(const limitPriceFen of [11988,10988])h.send('PlanStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen,quoteId:'initial-2020-01-01',validUntil:'SIM-CP-2020-01-10'})
 check(accountFunds(h.run.economy.ledger,'personal').availableFen===0&&actionBudget(h.run.economy,'2020-01-01').available===0,'ZERO_RESOURCES_NOT_ACTUAL');const zero=h.codec.export(h.run),cash=accountFunds(h.run.economy.ledger,'personal').cashFen;h.send('InterruptLifeWork',{jobId:h.run.life!.jobs[0]!.id});h.send('SetLifePriority',{year:2020,priority:'unchanged'});h.at('2020-01-08',{work:false})
 check(h.run.life!.jobs[0]!.status==='interrupted'&&accountFunds(h.run.economy.ledger,'personal').cashFen===cash,'ZERO_STOP_CREATED_MONEY_OR_COMPLETION')
 capture('zero-available-and-ap-stop',h,{zero},{zeroCashAvailable:true,zeroAP:true,finiteStopAndAdvance:true,costRetained:true},'normal work/research/workspace and two real planned stock reservations exhaust available cash/AP; raw cash is held, not zero bank cash. Free stop releases only future capacity, no free environment or AP refund')
})
const changes=paths.filter(p=>sha(readFileSync(join(root,p)))!==sourceHashes[p]);check(changes.length===0,'SOURCE_CHANGED_DURING_LIFE_COLLECTION:'+changes.join(','))
writeFileSync(join(out,'t15-life-evidence.json'),JSON.stringify({taskId:'T15',evidenceType:'normal_engine_replay_not_native_or_human',baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),reproduceCommand:'rtk proxy node --experimental-strip-types scripts/collect_life_evidence.ts --output-dir <fresh-directory>',sourceHashes,cases,failures,notCovered:['native_browser_acceptance','native200percent_zoom','native_close_dialog','full24quarter_campaign_epilogue','original_three_png','human_playtest','overall_balance']},null,2)+'\n',{flag:'wx'})
if(failures.length)process.exitCode=1
console.log(JSON.stringify({cases:cases.length,failures:failures.length,result:failures.length?'FAILED':'PASS'}))
