import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {join,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {evidenceDirectory} from './evidence-output.ts'
import {createCampaignRun,createCampaignCodec,campaignVideo,campaignMarket,campaignStory} from '../src/application/campaign.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import type {GameRun} from '../src/core/run-types.ts'
import {hashValue} from '../src/core/hash.ts'
import {StoryHarness} from '../src/testing/story-harness.ts'
import {replayNormalCourse} from '../src/testing/normal-course-scenario.ts'
import {replayNormalRelay} from '../src/testing/normal-relay-scenario.ts'
import {replayNormalDeepseek} from '../src/testing/normal-deepseek-scenario.ts'
import {addDays} from '../src/core/calendar.ts'
import {quarterLimit} from '../src/core/operations-calendar.ts'
import {actionBudget} from '../src/core/economy.ts'
import {projectVideo} from '../src/core/video-projection.ts'
import {projectMarket} from '../src/core/market-projection.ts'
import {projectStory} from '../src/core/story-projection.ts'
import {accountFunds,metricsFor} from '../src/core/ledger.ts'
import {nextTailDate,reviewFingerprint,fullSnapshot} from '../src/core/epilogue.ts'
import {recoveryAssets} from '../src/core/ending-ledger.ts'

const root=resolve(fileURLToPath(new URL('../',import.meta.url))),out=evidenceDirectory(root,'t16-journey-evidence.json'),codec=createCampaignCodec(),sha=(x:string|Uint8Array)=>createHash('sha256').update(x).digest('hex')
function paths(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?paths(dir+'/'+d.name):/\.tsx?$/.test(d.name)&&!d.name.includes('.test.')?[dir+'/'+d.name]:[])}
const sources=[...paths('src/core'),...paths('src/content'),...paths('src/application'),...paths('src/persistence'),...paths('src/testing'),'scripts/collect_journey_evidence.ts','goal-1/evidence/t16-epilogue/matrix-policy.md'],frozen=Object.fromEntries(sources.map(p=>[p,sha(readFileSync(join(root,p)))]))
const seeds=['t16-campaign-0','t16-campaign-1','t16-campaign-2'],backgrounds=['technical_employee','content_employee'],strategies=['pure-work','work-investment','video-course','relay-ecosystem','qualified-equity','risk-prepared','risk-unprepared'] as const
const pilot=process.env.T16_MATRIX_SAMPLE??null
type Strategy=typeof strategies[number]
type RelayPrefix={run:GameRun;raw:string;failure:string|null}
const relayPrefixes=new Map<string,RelayPrefix>()
const write=(name:string,value:unknown)=>writeFileSync(join(out,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})
write('registered-samples.json',{seeds,backgrounds,strategies,total:42,pilot,policy:'goal-1/evidence/t16-epilogue/matrix-policy.md',sources:frozen})
function relayPrefix(backgroundId:string,seed:string):RelayPrefix{
 const creation=createCampaignRun({runId:`normal-relay-${backgroundId}-${hashValue(seed).slice(0,8)}`,actorId:'player',commandId:'create',backgroundId,seed})
 const key=hashValue({create:creation.receipts[0],profile:creation.playerProfile,versions:creation.versions})
 const old=relayPrefixes.get(key);if(old){if(codec.export(old.run)!==old.raw)throw Error('MUTATED_EARNED_RELAY_PREFIX');return old}
 let last:GameRun|undefined,failure:string|null=null
 try{last=replayNormalRelay(backgroundId,{seed,onCommitted:run=>{last=run}}).run}catch(error){failure=String(error)}
 if(!last)throw Error('NORMAL_RELAY_HAS_NO_VALIDATED_PROGRESS')
 const result={run:last,raw:codec.export(last),failure};relayPrefixes.set(key,result);return result
}
const assignment=(h:StoryHarness)=>({resources:['player-production'],startAt:h.run.timeline.cursor.date})
function room(h:StoryHarness,points:number){if(actionBudget(h.run.economy,h.run.timeline.cursor.date).available<points)h.at(quarterLimit(h.run.timeline.cursor.date),{work:false});if(actionBudget(h.run.economy,h.run.timeline.cursor.date).available<points)throw Error('FIXED_STRATEGY_HAS_NO_ACTUAL_ACTION_ROOM')}
function paidVideo(h:StoryHarness){
 h.at('2023-07-01',{work:false});h.send('OpenVideoChannel',{name:'街角店铺的真实作品',segment:'local_merchants'});const channel=h.run.video!.channels.at(-1)!
 h.send('StartVideoMarketing',{channelId:channel.id,...assignment(h)});h.at(addDays(h.run.timeline.cursor.date,7),{work:false})
 const lead=projectVideo(h.run,campaignVideo)!.channels.find(c=>c.id===channel.id)!.leads[0];if(!lead)throw Error('NO_ACTUAL_QUALIFIED_VIDEO_CLIENT')
 h.send('AcceptVideoCommission',{channelId:channel.id,cohortId:lead.cohortId,clientId:lead.personId,modeId:'manual',materialId:'original',...assignment(h)});const contractId=h.run.video!.contracts.at(-1)!.id,workId=h.run.video!.contracts.at(-1)!.workId
 const job=h.run.operations!.jobs.find(j=>j.id===h.run.video!.works.find(w=>w.id===workId)!.jobId)!;h.at(job.completeAt,{work:false})
 if(projectVideo(h.run,campaignVideo)!.works.find(w=>w.id===workId)!.defectKnown){room(h,1);h.send('ReworkVideo',{workId,...assignment(h)});h.at(addDays(h.run.timeline.cursor.date,7),{work:false})}
 for(let n=0;n<8;n++){
  const c=projectVideo(h.run,campaignVideo)!.contracts.find(c=>c.id===contractId)!,w=projectVideo(h.run,campaignVideo)!.works.find(w=>w.id===workId)!
  if(c.status==='settled')return
  if(c.status==='cancelled')throw Error('ACTUAL_VIDEO_COMMISSION_CANCELLED')
  if(c.status==='delivered'){h.at(c.paymentAt!,{work:false});continue}
  if(c.status==='revision'){
   if(c.revisions>=c.includedRevisions&&!c.negotiated){room(h,1);h.send('NegotiateVideoCommission',{contractId,proposal:'price',...assignment(h)});h.at(addDays(h.run.timeline.cursor.date,3),{work:false});continue}
   room(h,1);h.send('ReworkVideo',{workId,...assignment(h)});h.at(addDays(h.run.timeline.cursor.date,7),{work:false})
  }
  if(w.reviewedVersion!==h.run.video!.works.find(w=>w.id===workId)!.version)h.send('ReviewVideoOutput',{workId,disclosure:'manual'})
  h.send('SubmitVideoCommission',{contractId});h.at(addDays(h.run.timeline.cursor.date,2),{work:false})
 }
 throw Error('FIXED_VIDEO_STRATEGY_ATTEMPTS_EXHAUSTED')
}
function ecosystem(h:StoryHarness,backgroundId:string){
 h.at('2025-04-02',{work:false});h.send('OpenEcosystemService',{capitalFen:3000000});const b=h.run.operations!.businesses.find(b=>b.definitionId==='ecosystem-service')!,productId=backgroundId==='technical_employee'?'deployment':'training'
 h.send('StartEcosystemPreparation',{businessId:b.id,preparation:'materials',...assignment(h)});h.at(addDays(h.run.timeline.cursor.date,7),{work:false})
 if(backgroundId==='content_employee'){h.send('StartEcosystemPreparation',{businessId:b.id,preparation:'basics',...assignment(h)});h.at(addDays(h.run.timeline.cursor.date,7),{work:false})}
 h.send('StartEcosystemAdaptation',{businessId:b.id,modelId:'r1',productId,acceptSimulationTerms:true,...assignment(h)});h.at(addDays(h.run.timeline.cursor.date,7),{work:false});h.send('ActivateBusiness',{businessId:b.id})
 h.at('2025-06-20',{work:false});h.send('StartEcoOutreach',{businessId:b.id,modelId:'r1',productId,mode:'paid',sourceCohortIds:[],...assignment(h)});h.at('2025-07-02',{work:false})
 const lead=h.run.deepseek!.leads.find(l=>l.businessId===b.id&&l.status==='open'&&l.maxPriceFen>0);if(!lead)throw Error('NO_ACTUAL_WILLING_ECOSYSTEM_CLIENT')
 const full=productId==='deployment'?1200000:600000;h.send('AcceptEcoContract',{leadId:lead.id,scope:lead.maxPriceFen>=full?'standard':'pilot',resources:['player-production'],startAt:addDays(h.run.timeline.cursor.date,1)});const contractId=h.run.deepseek!.contracts.at(-1)!.id
 const c=()=>h.run.deepseek!.contracts.find(c=>c.id===contractId)!
 h.at(h.run.operations!.jobs.find(j=>j.id===c().productionJobId)!.completeAt,{work:false});h.send('SubmitEcoDelivery',{contractId});h.at(h.run.operations!.jobs.find(j=>j.id===c().supportJobId)!.completeAt,{work:false})
 if(c().status==='rejected'){room(h,2);h.send('StartEcoRemediation',{contractId,resources:['player-production'],startAt:addDays(h.run.timeline.cursor.date,1)});h.at(h.run.operations!.jobs.find(j=>j.id===c().remediationJobId)!.completeAt,{work:false});h.send('SubmitEcoDelivery',{contractId});h.at(h.run.operations!.jobs.find(j=>j.id===c().supportJobId)!.completeAt,{work:false})}
 if(c().status!=='completed')throw Error('ACTUAL_ECOSYSTEM_SERVICE_NOT_COMPLETED')
 for(const d of h.run.deepseek!.deliveries.filter(d=>d.contractId===contractId&&d.creditFen>0)){h.at(d.dueAt>h.run.timeline.cursor.date?d.dueAt:h.run.timeline.cursor.date,{work:false});h.send('CollectEcoReceivable',{deliveryId:d.id,amountFen:d.creditFen})}
}
function risk(h:StoryHarness,prepared:boolean){
 h.at('2025-04-01',{work:false});const b=h.run.operations!.businesses.find(b=>b.definitionId==='relay-station')!
 h.send('StartHengxingDeployment',{businessId:b.id,resourceId:'player-production',expiresAt:'2025-09-30',initialCashLimitFen:500000,consent:true});h.at('2025-04-08',{work:false});const d=h.run.story!.deployments.at(-1)!
 if(prepared){h.send('StartAgentPreparation',{deploymentId:d.id,kind:'records',resourceId:'player-production'});h.at('2025-04-15',{work:false});h.send('StartAgentPreparation',{deploymentId:d.id,kind:'drill',resourceId:'player-production'});h.at('2025-04-18',{work:false})}else h.at('2025-04-18',{work:false})
 h.at('2025-07-02',{work:false})
 for(const c of h.run.relay!.customers.filter(c=>c.businessId===b.id))h.send('RenewRelayCustomer',{customerId:c.id,termEnd:'2025-09-30',mode:c.mode,creditLimitFen:c.creditLimitFen})
 h.send('StartRelayServicePeriod',{businessId:b.id,customerIds:h.run.relay!.customers.filter(c=>c.businessId===b.id).map(c=>c.id),supplierIds:['cedar-direct'],maxUnits:300000,maxSupplierCostFen:1200000,supportMode:'assisted',deploymentId:d.id,resources:['player-production'],startAt:'2025-08-03'});h.at('2025-09-05',{work:false})
 h.send('SetHengxingAuthority',{deploymentId:d.id,businessId:b.id,level:'cross_flow',scopes:['relay_support','external_service_commitments'],cashLimitFen:100000,expiresAt:'2025-09-30',externalDelegation:true,consent:true});h.at('2025-09-13',{work:false});h.send('StopHengxingAuthority',{deploymentId:d.id})
}
function finish(h:StoryHarness){
 h.at('2025-12-31');if(h.run.journey!.quarters.filter(q=>q.closedAt!==null).length!==24)throw Error('24_REAL_QUARTERS_REQUIRED')
 h.send('EnterEpilogue',{consent:true,reviewHash:reviewFingerprint(h.run)})
 const beforeLedger=hashValue(h.run.economy.ledger),beforeRandom=hashValue(h.run.random),estimates=recoveryAssets(h.run.economy.ledger).map(a=>({...a,estimatedFen:Math.floor(a.basisFen/2)})).map(({assetId,kind,basisFen,estimatedFen})=>({assetId,kind,basisFen,estimatedFen}))
 h.send('FinishJourney',{consent:true,reviewHash:reviewFingerprint(h.run),estimates})
 if(hashValue(h.run.economy.ledger)!==beforeLedger||hashValue(h.run.random)!==beforeRandom)throw Error('ARCHIVE_CHANGED_MONEY_OR_RANDOM')
 if(!fullSnapshot(h.run.timeline.cursor))throw Error('ENDING_INCOMPLETE_CLOCK')
 return nextTailDate({...h.run,date:h.run.timeline.cursor.date,cursor:h.run.timeline.cursor,pending:h.run.timeline.pending})
}
function verifyReplay(h:StoryHarness,raw:string){
 let replay=createCampaignRun({runId:h.run.runId,actorId:h.run.actorId,commandId:h.run.receipts[0]!.commandId,backgroundId:h.run.backgroundId,seed:h.run.seed,playerProfile:h.run.playerProfile})
 for(const c of h.commands){const r=evaluateCommand(replay,c,codec.registry,replay.actorId);if(r.status!=='proposed')throw Error('FULL_CREATE_REPLAY_REJECTED:'+JSON.stringify(r));replay=r.nextRun}
 if(codec.export(replay)!==raw)throw Error('FULL_CREATE_REPLAY_BYTE_MISMATCH')
}
const results:unknown[]=[]
for(const backgroundId of backgrounds)for(const seed of seeds)for(const strategy of strategies){
 const identity={backgroundId,seed,strategy},name=strategy+'-'+backgroundId+'-'+seed.slice(-1)
 if(pilot&&pilot!==name)continue
 console.log(JSON.stringify({stage:'start',...identity}))
 let h=new StoryHarness({priorRun:createCampaignRun({runId:'t16-'+name,actorId:'player',commandId:'create',backgroundId,seed})}),last=h.run,strategyFailure:string|null=null,fatal:string|null=null
 try{
  if(strategy==='work-investment'){
   h.at('2020-01-02');h.send('ResearchMarket',{definitionId:'market-overview'});h.at('2020-01-03');h.send('ResearchMarket',{definitionId:'market-foundation-course'});h.send('PlaceStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen:11988,quoteId:'initial-2020-01-01',validUntil:'SIM-CP-2020-01-10'});h.at('2020-04-02')
   const m=projectMarket(h.run,campaignMarket.catalog)!,p=m.positions.find(p=>p.symbol==='SIM-AI01'),q=m.stocks.find(q=>q.symbol==='SIM-AI01')!
   if(p&&q.priceFen!==null&&p.settledQuantity-p.reservedQuantity>0){h.send('PlaceStockOrder',{accountId:'personal',symbol:p.symbol,side:'sell',quantity:p.settledQuantity-p.reservedQuantity,limitPriceFen:q.priceFen,quoteId:q.checkpointId,validUntil:m.matchingCalendar.find(c=>c.date>h.run.timeline.cursor.date)!.id});h.at('2020-05-01')}
  }else if(strategy==='video-course'){
   try{last=replayNormalCourse(backgroundId,{seed,onCommitted:run=>{last=run}}).run}catch(error){strategyFailure='Course prerequisite outcome: '+String(error)}h=new StoryHarness({priorRun:last});paidVideo(h)
  }else if(strategy==='qualified-equity'){
   try{last=replayNormalDeepseek(backgroundId,{seed,runId:'t16-'+name,onCommitted:run=>{last=run}}).run}catch(error){h=new StoryHarness({priorRun:last});throw error}h=new StoryHarness({priorRun:last})
  }else if(strategy==='relay-ecosystem'||strategy.startsWith('risk-')){
   const prefix=relayPrefix(backgroundId,seed);h=new StoryHarness({priorRun:prefix.run});if(prefix.failure)throw Error('RELAY_PREREQUISITE_OUTCOME:'+prefix.failure)
   if(strategy==='relay-ecosystem')ecosystem(h,backgroundId);else risk(h,strategy==='risk-prepared')
  }
 }catch(error){strategyFailure=String(error);console.log(JSON.stringify({stage:'actual strategy outcome',...identity,date:h.run.timeline.cursor.date,error:strategyFailure}))}
 try{
  const next=finish(h),raw=codec.export(h.run);verifyReplay(h,raw)
  const record={...identity,runId:h.run.runId,origin:h.run.origin,versions:h.run.versions,sourceHashes:frozen,strategyFailure,phase:h.run.phase,date:h.run.timeline.cursor.date,quarters:h.run.journey!.quarters,commands:h.commands,creation:h.run.receipts[0],personal:accountFunds(h.run.economy.ledger,'personal'),businesses:h.run.operations!.businesses.map(b=>({route:b.route,lifecycle:b.lifecycle,funds:accountFunds(h.run.economy.ledger,b.accountId),metrics:metricsFor(h.run.economy.ledger,b.accountId,b.id)})),salaryPayments:h.run.operations!.payroll.filter(p=>p.kind==='salary').length,videoContracts:projectVideo(h.run,campaignVideo)!.contracts,ecosystemContracts:h.run.deepseek!.contracts.map(c=>({id:c.id,status:c.status,priceFen:c.priceFen})),equity:h.run.deepseek!.agreements.map(a=>({shares:a.shares,costFen:a.costFen,lockUntil:a.lockUntil})),publicRisk:projectStory(h.run,campaignStory).incidents,budget:actionBudget(h.run.economy,h.run.timeline.cursor.date),nextOldDate:next,fullCreateReplayByteEqual:true,rawSha256:sha(raw)}
  write(name+'-final.json',raw);write(name+'-result.json',record);results.push({name,...identity,strategyFailure,fullCreateReplayByteEqual:true,phase:h.run.phase,sha256:sha(raw)})
 }catch(error){fatal=String(error);write(name+'-incomplete.json',codec.export(h.run));write(name+'-fatal.json',{...identity,strategyFailure,fatal,commands:h.commands});results.push({name,...identity,strategyFailure,fatal});console.log(JSON.stringify({stage:'fatal retained',...identity,fatal}))}
 for(const [path,hash]of Object.entries(frozen))if(sha(readFileSync(join(root,path)))!==hash)throw Error('FROZEN_SOURCE_CHANGED:'+path)
 console.log(JSON.stringify({stage:'complete',...identity,revision:h.run.revision,phase:h.run.phase,strategyFailure,fatal}))
}
if(!pilot&&results.length!==42||pilot&&results.length!==1)throw Error('REGISTERED_SAMPLE_COUNT_MISMATCH')
write('t16-journey-evidence.json',{scope:pilot?'single registered pilot; full 42 still required':'42 fixed normal outcomes; browser and C16 separate',sourceHashes:frozen,total:results.length,results});console.log(JSON.stringify({stage:'all selected outcomes retained',pilot,total:results.length}))
