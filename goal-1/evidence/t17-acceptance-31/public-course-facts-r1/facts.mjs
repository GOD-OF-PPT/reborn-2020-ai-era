import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createCampaignCodec} from '../../../../src/application/campaign.ts';
import {projectRun} from '../../../../src/core/commands.ts';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const output=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(output,'../../../..');
const hash=b=>createHash('sha256').update(b).digest('hex'),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const put=(n,v)=>{guard(output);fs.writeFileSync(path.join(output,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'})};
const before=JSON.parse(fs.readFileSync(path.join(output,'input-before.json'),'utf8'));
const codec=createCampaignCodec(),project=codec.registry.runtime?.project;
if(typeof project!=='function')throw Error('OFFICIAL_REGISTRY_RUNTIME_PROJECT_REQUIRED');
const groups=new Map(),rows=[],errors=[];
for(const record of before.records){
 const bytes=fs.readFileSync(path.join(repo,record.identity.path));
 if(bytes.length!==record.identity.bytes||hash(bytes)!==record.identity.sha256)throw Error('RAW_CHANGED_BEFORE_PROJECTION:'+record.identity.path);
 const envelope=JSON.parse(bytes.toString('utf8'));
 if(record.publicHeader.runId!==envelope.runId||record.publicHeader.revision!==envelope.revision)throw Error('REGISTERED_HEADER_CHANGED');
 let group=groups.get(record.identity.sha256);
 if(!group){
  try{
   const run=codec.import(bytes.toString('utf8'));
   // No command, preview, Controller, fixture, seed generation or replay. One pair of public projections per distinct raw SHA.
   const view=projectRun(run),features=project.call(codec.registry.runtime,run),course=features.course;
   const jobs=view.operations?.jobs??[];
   const publicCourse=course===null?null:{
    businesses:course.businesses.map(b=>({id:b.id,accountId:b.accountId,definitionId:b.definitionId,status:b.status,funds:b.funds,metrics:b.metrics})),
    availableCases:course.cases,
    outlines:course.outlines,
    licenses:course.licenses,
    courses:course.courses.map(c=>({id:c.id,businessId:c.businessId,name:c.name,productId:c.productId,topicId:c.topicId,edition:c.edition,status:c.status,paused:c.paused,cases:c.cases,createdAt:c.createdAt,sampleJobId:c.sampleJobId,sampleAttempts:c.sampleAttempts.map(id=>({id,job:jobs.find(j=>j.id===id)??null})),currentSampleJob:c.job,versions:c.versions,qualificationReasons:c.qualificationReasons,unresolvedUpdates:c.unresolvedUpdates,graduateCount:c.graduateCount})),
    audienceCount:course.audiences.length,audiences:course.audiences,
    cohortCount:course.cohorts.length,
    cohorts:course.cohorts.map(c=>({id:c.id,courseId:c.courseId,status:c.status,students:c.students,priceFen:c.priceFen,feeFen:c.feeFen})),
    projectedStudentCount:course.cohorts.reduce((n,c)=>n+c.students.length,0),
    refunds:course.refunds,updates:course.updates
   };
   const creation=run.receipts.find(r=>r.kind==='CreateRun');
   const creationPayload=creation?JSON.parse(creation.payloadSignature):null;
   const creationIdentity=creation?hash(JSON.stringify({runId:run.runId,versions:run.versions,receipt:creation})):null;
   const fact={runId:view.runId,revision:view.revision,origin:view.origin,backgroundId:view.backgroundId,date:view.date,phase:view.phase,budget:view.budget,accounts:view.accounts,course:publicCourse};
   group={sha256:record.identity.sha256,run,envelope,fact,creationIdentity,creationReceipt:creation,creationPayload,publicFeatureSha256:hash(JSON.stringify(features)),publicRunSha256:hash(JSON.stringify(view)),receiptKinds:Object.fromEntries([...new Set(run.receipts.map(r=>r.kind))].sort().map(k=>[k,run.receipts.filter(r=>r.kind===k).length]))};
   groups.set(record.identity.sha256,group);
  }catch(error){errors.push({path:record.identity.path,error:String(error)});continue}
 }
 rows.push({path:record.identity.path,identity:record.identity,manifest:record.manifest,line:record.line,origin:record.origin,source:record.source,role:record.role,header:record.publicHeader,creationIdentity:group.creationIdentity,creationReceipt:group.creationReceipt,creationPayload:group.creationPayload,publicFeatureSha256:group.publicFeatureSha256,publicRunSha256:group.publicRunSha256,receiptKinds:group.receiptKinds,facts:group.fact});
}
const get=label=>{const row=rows.find(r=>path.basename(r.path)===label);if(!row)throw Error('REQUESTED_INPUT_MISSING:'+label);return {row,group:groups.get(row.identity.sha256)}};
const main=get('normal86-sample-actually-ready.json'),r6=get('r6-normal86-after-next-today-life.json'),backup=get('actual-previous-backup85.json');
const checkReady=({row,group})=>{
 const f=group.fact,c=f.course,one=c?.courses.length===1?c.courses[0]:null,b=one?c.businesses.find(b=>b.id===one.businessId):null;
 const checks={normal:f.origin==='normal',revision:f.revision===86,date:f.date==='2023-01-15',oneCourse:c?.courses.length===1,ready:one?.status==='ready',twoOriginalCases:one?.cases.length===2,caseReferencesPublic:one?.cases.every(ref=>c.availableCases.some(c=>c.id===ref.id&&c.kind===ref.kind))??false,outlineActuallyComplete:c?.outlines.length===1&&c.outlines[0].businessId===one?.businessId&&c.outlines[0].job?.status==='completed',licenseActuallyComplete:c?.licenses.length===1&&c.licenses[0].businessId===one?.businessId&&c.licenses[0].job?.status==='completed',twoSampleAttempts:one?.sampleAttempts.length===2,oldSampleInterrupted:one?.sampleAttempts[0]?.job?.status==='interrupted',newSampleCompleted:one?.sampleAttempts[1]?.job?.status==='completed',currentSampleSame:one?.sampleJobId===one?.sampleAttempts[1]?.id&&one?.currentSampleJob?.status==='completed',incomeZero:b?.metrics.incomeFen===0,audienceZero:c?.audienceCount===0,cohortZero:c?.cohortCount===0,projectedStudentsZero:c?.projectedStudentCount===0,prepaidLiabilityZero:b?.funds.prepaidLiabilityFen===0,businessCash551936:b?.funds.cashFen===551936,personalCash7045000:f.accounts.find(a=>a.accountId==='personal')?.cashFen===7045000,availableAP2:f.budget.available===2,totalAP4:f.budget.total===4};
 return {path:row.path,checks,allObservedExpected:Object.values(checks).every(Boolean)};
};
const lastA=main.group.run.receipts.at(-1),lastB=r6.group.run.receipts.at(-1),prefixA=main.group.run.receipts.slice(0,-1),prefixB=r6.group.run.receipts.slice(0,-1);
const diff=[];
function differences(a,b,p=''){
 if(same(a,b))return;
 if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
  const keys=[...new Set([...Object.keys(a),...Object.keys(b)])].sort();
  for(const k of keys)differences(a[k],b[k],p+'/'+k.replaceAll('~','~0').replaceAll('/','~1'));
 }else diff.push({path:p,beforeType:a===null?'null':typeof a,afterType:b===null?'null':typeof b,beforeSha256:hash(JSON.stringify(a)??'undefined'),afterSha256:hash(JSON.stringify(b)??'undefined')});
}
differences(main.group.envelope,r6.group.envelope);
const withoutChecksum=v=>{const {checksum,...body}=v;return body};
const normalizedB=JSON.parse(JSON.stringify(withoutChecksum(r6.group.envelope)).split(lastB.commandId).join(lastA.commandId));
const normalizedA=withoutChecksum(main.group.envelope);
const branch={main:{sha256:main.row.identity.sha256,lastReceipt:lastA},r6:{sha256:r6.row.identity.sha256,lastReceipt:lastB},differentRaw:main.row.identity.sha256!==r6.row.identity.sha256,original85PrefixSame:same(prefixA,prefixB),mainPrefixEqualsActual85:same(prefixA,backup.group.run.receipts),r6PrefixEqualsActual85:same(prefixB,backup.group.run.receipts),lastBothAdvanceTime:lastA.kind==='AdvanceTime'&&lastB.kind==='AdvanceTime',sameLastCommandPayloadSignature:lastA.payloadSignature===lastB.payloadSignature,sameLastCommandPayloadHash:lastA.payloadHash===lastB.payloadHash,sameRevisionAndDate:lastA.revisionBefore===85&&lastB.revisionBefore===85&&lastA.revisionAfter===86&&lastB.revisionAfter===86&&lastA.date===lastB.date,lastCommandIdDifferent:lastA.commandId!==lastB.commandId,selectedPublicFactsIdentical:same(main.group.fact,r6.group.fact),fullPublicFeaturesIdentical:main.group.publicFeatureSha256===r6.group.publicFeatureSha256,onlyLastCommandIdentityAndDerivedStringsDifferAfterChecksumRemoval:same(normalizedA,normalizedB),structuralDifferenceCount:diff.length,structuralDifferences:diff};
const equals=(a,b)=>get(a).row.identity.sha256===get(b).row.identity.sha256&&fs.readFileSync(path.join(repo,get(a).row.path)).equals(fs.readFileSync(path.join(repo,get(b).row.path)));
const byteRelations={candidateEqualsOriginalRetry:equals('candidate-74-outline-not-published.json','retry-saved-74.json'),candidateEqualsFreshPhysical74:equals('candidate-74-outline-not-published.json','physical-new-74.json'),retryEqualsFreshPhysical74:equals('retry-saved-74.json','physical-new-74.json'),oldSavedEqualsFreshPhysical73:equals('old-saved-73-after-abort.json','physical-old-73.json'),funded73EqualsOldSaved73:equals('normal-course-73-funded.json','old-saved-73-after-abort.json'),freshPhysical73Differs74:!equals('physical-old-73.json','physical-new-74.json'),r6ReentryExactlySame:equals('r6-normal86-after-next-today-life.json','r6-normal86-reentered.json'),mainPreferencesExactlySame:equals('normal86-sample-actually-ready.json','r6-original-main86-after-preferences.json')};
const normalIdentity={sameCreationIdentity:rows.every(r=>r.creationIdentity===main.row.creationIdentity),allPublicOriginNormal:rows.every(r=>r.facts.origin==='normal'),allCreatePayloadNormal:rows.every(r=>r.creationPayload?.payload?.origin==='normal'),creationIdentity:main.row.creationIdentity,runIds:[...new Set(rows.map(r=>r.facts.runId))],meaning:'Original registered receipts identify the same normal CreateRun. This read-only fact pass does not replay or independently establish browser capture provenance.'};
const readyChecks=[checkReady(main),checkReady(r6)];
const branchChecks=Object.entries(branch).filter(([k,v])=>typeof v==='boolean').map(([k,v])=>({key:k,passed:v}));
const allFactChecks=errors.length===0&&rows.length===before.records.length&&normalIdentity.sameCreationIdentity&&normalIdentity.allPublicOriginNormal&&normalIdentity.allCreatePayloadNormal&&readyChecks.every(c=>c.allObservedExpected)&&branchChecks.every(c=>c.passed)&&Object.values(byteRelations).every(Boolean);
const result={at:new Date().toISOString(),method:'Original createCampaignCodec.import plus official codec.registry.runtime.project and projectRun; one invocation, one pair per unique raw SHA, no commands/create/preview/replay.',manifestRows:before.records.length,publicRows:rows.length,uniqueRawProjectionPairs:groups.size,allFactChecks,errors,normalIdentity,readyChecks,branch,byteRelations,rows,limits:{nativeNotExecuted:true,fullCreateNotExecuted:true,noNewFixture:true,noGameCommands:true,noBrowserOrHiddenStateUsedForGuidance:true,noTestsOrCompatibility:true,cohortEnrollmentZero:'Projected public student total only, with zero public cohorts. Private enrollment/payment tables were not read to create UI guidance.',prepaidZero:'Public business funds.prepaidLiabilityFen; not a future-income guarantee.',candidateRole:'Candidate is codec-valid planned state, not a saved outcome. Equal bytes alone do not prove persistence; original manifests and independent Native evidence retain ownership.',old73andCandidate74:'Final ready86 expectations are not applied to prior states; their actual public facts remain separate.',creationReplay:'Not applicable in this pass; parent official Create audit owns complete replay.',humanPlaytest:'Not performed; no comprehension/fun claim.'}};
put('public-facts.json',result);
console.log(JSON.stringify({allFactChecks,rows:rows.length,uniqueRawProjectionPairs:groups.size,normalIdentity,readyChecks,branchChecks,byteRelations,errors}));
process.exitCode=allFactChecks?0:1;
