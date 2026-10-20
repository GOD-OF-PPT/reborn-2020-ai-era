import {readFileSync,writeFileSync,realpathSync,readdirSync} from 'node:fs'
import {resolve,relative,join,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {evidenceDirectory} from './evidence-output.ts'
import {assertFreshVideoEvidencePath as assertFreshCourseEvidencePath} from './video-shape-output.ts'
import {createCampaignCodec,campaignCourse,campaignVideo,campaignStory} from '../src/application/campaign.ts'
import {projectCourse} from '../src/core/course-projection.ts'
import {projectVideo} from '../src/core/video-projection.ts'
import {projectStory} from '../src/core/story-projection.ts'
import {canonicalJson} from '../src/core/identity.ts'
import {addDays} from '../src/core/calendar.ts'

const root=fileURLToPath(new URL('../',import.meta.url)),inputArgument=process.env.COURSE_PREFIX_INPUT_DIRECTORY
if(!inputArgument)throw Error('EXPLICIT_COURSE_PREFIX_INPUT_REQUIRED')
const input=realpathSync(resolve(root,inputArgument)),name=relative(realpathSync(root),input).split('\\').join('/')
if(!name.startsWith('goal-1/evidence/'))throw Error('PROJECT_COURSE_PREFIX_INPUT_REQUIRED')
assertFreshCourseEvidencePath(root,process.argv.slice(2));const output=evidenceDirectory(root,'course-prefix-readiness.json');if(readdirSync(output).length)throw Error('EMPTY_FRESH_READINESS_OUTPUT_REQUIRED')
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex'),inputHashes:Record<string,string>={}
function readInput(file:string){const path=realpathSync(join(input,file)),r=relative(input,path);if(r.startsWith('..')||isAbsolute(r))throw Error('PREFIX_INPUT_ESCAPE');const raw=readFileSync(path,'utf8');inputHashes[relative(root,path)]=sha(raw);return raw}
type PrefixRow={name:string;backgroundId:string;seed:string;status:string;fullCreateAndMilestoneBytesEqual?:boolean;final?:{file:string;sha256:string;bytes:number};publicCourse?:unknown;publicVideo?:unknown;publicStory?:unknown}
const summary=JSON.parse(readInput('course-prefix-results.json')) as {sourceHashes:Record<string,string>;results:PrefixRow[];fullMatrixBranchesExecuted:number}
for(const [file,hash]of Object.entries(summary.sourceHashes))if(sha(readFileSync(join(root,file)))!==hash)throw Error('PREFIX_SOURCE_CHANGED:'+file)
const codec=createCampaignCodec(),expected=['technical_employee','content_employee'].flatMap(backgroundId=>['t16-campaign-0','t16-campaign-1','t16-campaign-2'].map(seed=>backgroundId+'-'+seed)),seen=new Set<string>(),rows=[]
for(const row of summary.results){
 if(row.name!==row.backgroundId+'-'+row.seed||!expected.includes(row.name)||seen.has(row.name))throw Error('UNEXPECTED_OR_DUPLICATE_PREFIX');seen.add(row.name)
 if(!row.final||!row.fullCreateAndMilestoneBytesEqual){rows.push({name:row.name,ready:false,sourceStatus:row.status,reason:'No independently replayed raw prefix; do not use status counts as readiness.'});continue}
 const raw=readInput(row.final.file);if(sha(raw)!==row.final.sha256||Buffer.byteLength(raw)!==row.final.bytes)throw Error('PREFIX_RECORDED_RAW_BYTES_CHANGED')
 const run=codec.import(raw);if(run.origin!=='normal'||run.backgroundId!==row.backgroundId||run.seed!==row.seed)throw Error('PREFIX_NORMAL_IDENTITY_MISMATCH')
 const course=projectCourse(run,campaignCourse)!,video=projectVideo(run,campaignVideo)!,story=projectStory(run,campaignStory)
 if(canonicalJson(course)!==canonicalJson(row.publicCourse)||canonicalJson(video)!==canonicalJson(row.publicVideo)||canonicalJson(story)!==canonicalJson(row.publicStory))throw Error('RECORDED_PUBLIC_PROJECTIONS_MISMATCH')
 const topics=(['image_workflows','video_workflows'] as const).map(topic=>{
  const foundation=course.courses.find(c=>c.topicId===topic&&c.edition==='foundation'),studies=course.studies.filter(s=>s.predecessorId===foundation?.id&&s.completedAt!==null&&s.job?.status==='completed'),members=studies.reduce((n,s)=>n+s.members.length,0)
  return {topic,foundationId:foundation?.id??null,actualGraduates:foundation?.graduateCount??0,actualCompletedStudies:studies.map(s=>({id:s.id,completedAt:s.completedAt,members:s.members.length})),actualDemandMembers:members,ready:!!foundation&&foundation.graduateCount>0&&studies.some(s=>s.members.length>0)}
 })
 const studio=course.businesses.find(b=>b.lifecycle==='operating'),firstCases=course.cases.filter(c=>c.kind==='first_order'),videoCases=course.cases.filter(c=>c.kind==='video'&&c.licensed),licensed=videoCases.filter(c=>course.licenses.some(l=>l.businessId===studio?.id&&l.caseId===c.id&&l.job?.status==='completed'))
 const deployment=story.deployments.find(d=>d.businessId===studio?.id&&d.lifecycle==='active'&&d.activeFrom!==null&&d.currentGrant?.level==='approval'&&d.currentGrant.scopes.includes('course_support')&&!d.currentGrant.externalDelegation)
 const assisted=deployment?.supportResults.filter(r=>r.mode==='assisted_group'&&r.status==='completed'&&(r.actualCostFen<r.manualCostFen||r.completeAt<addDays(r.startAt,r.manualDays)))??[]
 const paidVideoDates=video.contracts.filter(c=>c.paidCase).map(c=>({id:c.id,paymentAt:c.paymentAt})),materialDates=course.licenses.map(l=>({caseId:l.caseId,startAt:l.job?.startAt,completeAt:l.job?.completeAt,status:l.job?.status}))
 const ready=row.status==='completed'&&topics.every(t=>t.ready)&&firstCases.length>0&&licensed.length>0&&!!deployment?.observedBusinessResult&&assisted.length>0
 rows.push({name:row.name,ready,sourceStatus:row.status,rawSha256:row.final.sha256,strictCurrentCodecAndPublicProjectionEqual:true,topics,firstPaidCases:firstCases.length,licensedPaidVideoCases:licensed.length,paidVideoDates,actualMaterialLicenseJobs:materialDates,actualAssistedSupportResults:assisted,observedBusinessResult:deployment?.observedBusinessResult??false,authorityLevel:deployment?.currentGrant?.level??null,lateVideoFoundation:course.cohorts.some(co=>course.courses.some(c=>c.id===co.courseId&&c.topicId==='video_workflows')&&co.startAt==='2025-01-10'),notes:'Current fixed identity readiness only. Authority remains approval; future qualification, AP, price, support and risk guards still apply to each separate course shape.'})
}
if(seen.size!==expected.length)throw Error('ALL_SIX_FIXED_PREFIX_IDENTITIES_REQUIRED')
for(const [file,hash]of Object.entries({...summary.sourceHashes,...inputHashes}))if(sha(readFileSync(join(root,file)))!==hash)throw Error('READINESS_INPUT_OR_RUNTIME_CHANGED:'+file)
const result={scope:'Independent postconditions for six actually replayed normal prefixes; completed execution is insufficient without actual graduates and nonempty completed new-demand studies. Not 378 course branches or browser/human evidence.',inputDirectory:name,inputHashes,sourceHashes:summary.sourceHashes,verifierSha256:sha(readFileSync(fileURLToPath(import.meta.url))),registered:expected.length,ready:rows.filter(r=>r.ready).length,notReady:rows.filter(r=>!r.ready).length,fullMatrixBranchesExecuted:summary.fullMatrixBranchesExecuted,rows}
writeFileSync(join(output,'course-prefix-readiness.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({registered:result.registered,ready:result.ready,notReady:result.notReady,fullMatrixBranchesExecuted:result.fullMatrixBranchesExecuted}));if(result.notReady)process.exitCode=1
