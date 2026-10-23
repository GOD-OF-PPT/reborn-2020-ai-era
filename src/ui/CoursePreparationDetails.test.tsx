import {beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignCodec,campaignCourse} from '../application/campaign.ts'
import {projectRun,previewCommand,evaluateCommand} from '../core/commands.ts'
import {projectCourse} from '../core/course-projection.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {RunCodec} from '../persistence/codec.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {createCourseFixture} from '../testing/course-fixture.ts'
import {CoursePreparationDetails} from './CoursePreparationDetails.tsx'
import {CourseCommandDetails} from './CourseCommandDetails.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import savedNormal from '../../goal-1/evidence/t17-acceptance-10/chrome-physical-r1/r74-physical-after-candidate-retry.json?raw'

function viewOf(run:GameRun,codec:RunCodec):PlayingView{return {...projectRun(run),features:codec.registry.runtime?.project?.(run)??{},saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
function command(run:GameRun,kind:string,payload:unknown):CommandEnvelope{return {runId:run.runId,actorId:'player',commandId:'inspect-course-preparation-'+run.revision+'-'+kind,expectedRevision:run.revision,kind,payload}}
const codec=createCampaignCodec(),normal=codec.import(savedNormal),normalView=viewOf(normal,codec),normalCourse=projectCourse(normal,campaignCourse)!
const accountName=(id:string)=>id==='personal'?'个人账户':'企业账户 · AI卖课'
const receipt=normal.receipts.find(row=>row.kind==='DefineCourse')!,definition=JSON.parse(receipt.payloadSignature).payload as Record<string,unknown>,define=command(normal,'DefineCourse',definition)
function render(c:CommandEnvelope,course=normalCourse,view=normalView){return renderToStaticMarkup(<CoursePreparationDetails command={c} course={course} view={view} workers={view.operations?.workers??[]} accountName={accountName}/>)}

it('puts the actual normally earned definition payload and paid handwork case into the original captured confirmation seam',()=>{
 const before=codec.export(normal),snapshot=JSON.stringify(normalView),preview=previewCommand(normal,define,codec.registry,'player')
 expect(normal.origin).toBe('normal');expect(preview.allowed).toBe(true)
 const html=renderToStaticMarkup(<CommandDetails command={define} confirm={preview} features={normalView.features as unknown as PlayFeatures} view={normalView} accountName={accountName} clock={null}/>)
 for(const text of ['这次留下的课程方案',String(definition.name),'垂直实操班','图像工具实作','面向AI学习者','基础课程','企业账户 · AI卖课','已付手工小单经验','匿名化说明','不制作样课、不招生、不收学费'])expect(html).toContain(text)
 expect(html).not.toContain('已取得课程使用范围');expect(codec.export(normal)).toBe(before);expect(JSON.stringify(normalView)).toBe(snapshot)
 expect(render({...define,kind:'OpenCourseStudio',payload:{capitalFen:500000}})).toBe('')
})

let fixture:ReturnType<typeof createCourseFixture>,outlineFrame:{command:CommandEnvelope;view:PlayingView;course:NonNullable<ReturnType<typeof projectCourse>>},activationFrame:typeof outlineFrame,licenseFrame:typeof outlineFrame,pendingFrame:typeof outlineFrame,sampleFrame:typeof outlineFrame
beforeAll(()=>{
 // Isolated real-command frames: they prove display identity/terms, not normal campaign financing.
 const h=createCourseFixture();fixture=h
 h.send('StartFirstOrder',{});h.send('AdvanceTime',{date:'2020-01-19'});h.send('SubmitDelivery',{contractId:h.run.operations!.contracts[0]!.id});h.send('AdvanceTime',{date:'2020-01-20'})
 h.send('OpenVideoChannel',{name:'授权案例的实际来源',segment:'ai_learners'});const channel=h.run.video!.channels[0]!
 h.send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:'2020-01-20'});h.send('AdvanceTime',{date:'2020-01-27'})
 const audience=h.run.video!.cohorts[0]!
 h.send('AcceptVideoCommission',{channelId:channel.id,cohortId:audience.id,clientId:audience.qualifiedMembers[0]!,modeId:'manual',materialId:'licensed',resources:['player-production'],startAt:'2020-01-27'})
 const paid=h.run.video!.contracts[0]!
 h.send('AdvanceTime',{date:'2020-02-10'});h.send('ReviewVideoOutput',{workId:paid.workId,disclosure:'manual'});h.send('SubmitVideoCommission',{contractId:paid.id});h.send('AdvanceTime',{date:'2020-02-19'})
 h.send('AdvanceTime',{date:'2022-08-22'});h.send('ApplyVideoProgram',{channelId:channel.id,program:'image_rights',resources:['player-production'],startAt:'2022-08-22'});h.send('AdvanceTime',{date:'2022-08-29'});h.send('DecideVideoProgram',{applicationId:h.run.video!.applications[0]!.id})
 h.send('AdvanceTime',{date:'2022-11-30'});h.send('DiscoverBusiness',{definitionId:'course-studio'});const b=h.run.operations!.businesses.find(b=>b.route==='ai_course')!;h.send('PrepareBusiness',{businessId:b.id})
 const capture=(kind:string,payload:unknown)=>({command:command(h.run,kind,payload),view:viewOf(h.run,h.codec),course:projectCourse(h.run,h.course)!})
 const outline={businessId:b.id,resources:['player-production'],startAt:'2022-11-30'}
 outlineFrame=capture('StartCourseOutline',outline);expect(h.preview('StartCourseOutline',outline).allowed).toBe(true)
 h.send('StartCourseOutline',outline);h.send('AdvanceTime',{date:'2022-12-07'})
 activationFrame=capture('ActivateBusiness',{businessId:b.id});expect(h.preview('ActivateBusiness',{businessId:b.id}).allowed).toBe(true);h.send('ActivateBusiness',{businessId:b.id})
 h.send('DefineCourse',{businessId:b.id,name:'授权案例的图像入门课',productId:'intro_recorded',topicId:'image_workflows',edition:'foundation',segment:'local_merchants',cases:[{kind:'video',id:paid.id}],consent:true})
 const c=h.run.course!.courses[0]!,license={businessId:b.id,caseKind:'video',caseId:paid.id,resources:['player-production'],startAt:'2022-12-08'}
 licenseFrame=capture('LicenseCourseMaterials',license);expect(h.preview('LicenseCourseMaterials',license).allowed).toBe(true);h.send('LicenseCourseMaterials',license)
 const sample={courseId:c.id,resources:['player-production'],startAt:'2022-12-16'}
 pendingFrame=capture('BuildCourseSample',sample);expect(h.preview('BuildCourseSample',sample).allowed).toBe(false)
 h.send('AdvanceTime',{date:'2022-12-15'});sampleFrame=capture('BuildCourseSample',sample);expect(h.preview('BuildCourseSample',sample).allowed).toBe(true)
},20000)
function frameHtml(frame:typeof outlineFrame){return render(frame.command,frame.course,frame.view)}
it('keeps the actual outline, activation, license and selected sample dates separate from completion or payment',()=>{
 const before=fixture.codec.export(fixture.run)
 for(const text of ['这次安排的教学大纲','执笔资源：由我自己来写','2022-11-30','2022-12-07','7日','预计日期不等于实际完成'])expect(frameHtml(outlineFrame)).toContain(text)
 expect(frameHtml(activationFrame)).toContain('按实际在营日期承担每月¥0维护') // This fixture has no maintenance; production keeps its own public amount.
 const videoBusiness=activationFrame.view.operations!.businesses.find(b=>b.route==='ai_video')!
 expect(render({...activationFrame.command,payload:{businessId:videoBusiness.id}},activationFrame.course,activationFrame.view)).toBe('')
 for(const text of ['这次安排的课程素材使用范围','已验收付款的视频案例','还须另行安排并实际完成','2022-12-08','2022-12-15'])expect(frameHtml(licenseFrame)).toContain(text)
 expect(frameHtml(pendingFrame)).toContain('课程许可正在办理，尚未实际完成')
 const sample=frameHtml(sampleFrame)
 for(const text of ['授权案例的图像入门课','入门录播','图像工具实作','由我自己制作样课','2022-12-16','2022-12-30','14日','课程使用范围已实际完成','工具资格须覆盖每一天制作'])expect(sample).toContain(text)
 expect(sample).not.toMatch(/已付¥|已实际支付|样课已经完成|本次已取得学费收入/)
 const licenseHtml=frameHtml(licenseFrame)
 expect(licenseHtml).toContain('本次素材案例 · 已验收付款的视频案例');expect(licenseHtml).not.toMatch(/案例[12] ·/)
 const selected=[...sampleFrame.course.cases].reverse().map(ref=>({kind:ref.kind,id:ref.id}))
 expect(selected.map(ref=>ref.kind)).toEqual(['video','first_order'])
 const body={businessId:sampleFrame.course.courses[0]!.businessId,name:'反序选择的课程',productId:'intro_recorded',topicId:'image_workflows',edition:'foundation',segment:'local_merchants',cases:selected,consent:true}
 const reversed=command(fixture.run,'DefineCourse',body),selectionBefore=JSON.stringify(body)
 expect(fixture.preview('DefineCourse',body).allowed).toBe(true)
 const reverseHtml=render(reversed,sampleFrame.course,sampleFrame.view)
 for(const text of ['案例1 · 已验收付款的视频案例','案例2 · 已付手工小单经验'])expect(reverseHtml).toContain(text)
 expect(reverseHtml.indexOf('案例1 ·')).toBeLessThan(reverseHtml.indexOf('案例2 ·'))
 const subset=render({...reversed,payload:{...body,cases:[selected[0]]}},sampleFrame.course,sampleFrame.view)
 expect(subset).toContain('案例1 · 已验收付款的视频案例');expect(subset).not.toContain('案例2 ·')
 const result=evaluateCommand(fixture.run,reversed,fixture.registry,'player')
 if(result.status!=='proposed')throw Error('REVERSED_COURSE_DEFINITION_REJECTED')
 const next=result.nextRun,nextCourse=projectCourse(next,fixture.course)!,lesson=nextCourse.courses.at(-1)!,nextView=viewOf(next,fixture.codec)
 expect(lesson.cases).toEqual(selected)
 const sampleCommand=command(next,'BuildCourseSample',{courseId:lesson.id,resources:['player-production'],startAt:'2022-12-16'})
 expect(previewCommand(next,sampleCommand,fixture.registry,'player').allowed).toBe(true)
 const reversedSample=render(sampleCommand,nextCourse,nextView)
 for(const text of ['案例1 · 已验收付款的视频案例','案例2 · 已付手工小单经验'])expect(reversedSample).toContain(text)
 expect(JSON.stringify(body)).toBe(selectionBefore)
 expect(fixture.codec.export(fixture.run)).toBe(before)
})
it('requires the entire missing, stale or mismatched confirmation to be checked again instead of taking a first object or player resource',()=>{
 const body=define.payload as Record<string,unknown>,before=codec.export(normal)
 const invalid=[{...define,payload:{...body,cases:[...(body.cases as unknown[]),{kind:'video',id:'missing-case'}]}},{...define,payload:{...body,businessId:'missing-studio'}},{...define,payload:{...body,productId:'missing-product'}},{...define,payload:{...body,consent:false}},{...define,expectedRevision:define.expectedRevision-1}]
 for(const c of invalid){const html=render(c);expect(html).toContain('返回重新选择');expect(html).not.toContain('这次留下的课程方案')}
 const original=sampleFrame.command.payload as Record<string,unknown>
 for(const patch of [{courseId:'missing-course'},{resources:['missing-resource']},{resources:['player-production','missing-resource']},{startAt:'2020-01-01'},{startAt:'2022-02-30'}]){
  const html=render({...sampleFrame.command,payload:{...original,...patch}},sampleFrame.course,sampleFrame.view)
  expect(html).toContain('返回重新选择');expect(html).not.toContain('由我自己制作样课')
 }
 expect(render(define,normalCourse,{...normalView,readOnly:true})).toContain('返回重新选择');expect(render(define,normalCourse,{...normalView,hasCandidate:true})).toContain('返回重新选择')
 expect(codec.export(normal)).toBe(before)
})
it('retains the existing stage and refund confirmations while the new preparation seam remains display-only',()=>{
 const co=normalCourse.cohorts[0]!,saved=codec.export(normal)
 const stage=command(normal,'StartCourseStage',{cohortId:co.id,index:0,resources:['player-production'],startAt:co.startAt})
 const teaching=renderToStaticMarkup(<CourseCommandDetails command={stage} course={normalCourse} view={normalView}/>)
 expect(teaching).toContain('第1段教学');expect(teaching).toContain(co.stages[0]!.dueAt);expect(teaching).toContain('原支持、退款责任')
 const refund=command(normal,'RefundCourseLearners',{cohortId:co.id,personIds:[co.students[0]!.personId],reason:'按原交付处理'})
 const preview=previewCommand(normal,refund,codec.registry,'player'),html=renderToStaticMarkup(<CourseCommandDetails command={refund} course={normalCourse} view={normalView} confirm={preview} accountName={accountName}/>)
 expect(preview.allowed).toBe(true);expect(html).toContain('退还学费¥');expect(html).toContain('不等于学员已经到账')
 const proposal=evaluateCommand(normal,define,codec.registry,'player')
 expect(proposal.status).toBe('proposed');expect(codec.export(normal)).toBe(saved)
})
