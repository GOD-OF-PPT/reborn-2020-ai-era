import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {campaignCourse,createCampaignCodec} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import {projectCourse} from '../core/course-projection.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {CourseCommandDetails} from './CourseCommandDetails.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import originalBefore from '../../goal-1/evidence/t17-acceptance-10/chrome-physical-r1/r74-physical-after-candidate-retry.json?raw'

// A real saved normal snapshot supplies public identities; display variants below are never saved as histories.
const codec=createCampaignCodec(),run=codec.import(originalBefore),saved=codec.export(run)
const course=projectCourse(run,campaignCourse)!,originalView:PlayingView={...projectRun(run),features:codec.registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
const preview={allowed:true,reasonCodes:[],actionPoints:0,upfrontCostFen:0,releasedFen:0}
function context(){
 const snapshot=structuredClone(course),view=structuredClone(originalView),co=snapshot.cohorts[0]!
 const command:CommandEnvelope={runId:view.runId,actorId:'player',commandId:'review-original-refund',expectedRevision:view.revision,kind:'RefundCourseLearners',payload:{cohortId:co.id,personIds:[co.students[0]!.personId],reason:'按原学员与阶段核对退款'}}
 return {course:snapshot,view,command,confirm:{...preview},accountName:(id:string)=>id==='personal'?'个人账户':'企业账户 · AI卖课'}
}
type Context=ReturnType<typeof context>
function render(c:Context){return renderToStaticMarkup(<CourseCommandDetails {...c}/>)}
function selected(c:Context){return c.course.cohorts[0]!.students[0]!}
function choose(c:Context,people:string[]){c.command={...c.command,payload:{cohortId:c.course.cohorts[0]!.id,personIds:people,reason:'按原记录退款'}}}
it.each([
 ['before',[0,0],['尚未交付的原预款¥999','已交付收入冲减¥0']],
 ['half',[49950,0],['尚未交付的原预款¥499.50','已交付收入冲减¥499.50']],
 ['after',[49950,49950],['尚未交付的原预款¥0','已交付收入冲减¥999']],
] as const)('renders the captured %s refund as the original whole obligation, not a zero operation fee',(_phase,delivered,parts)=>{
 const c=context();selected(c).delivered=[...delivered]
 const before=JSON.stringify(c),html=render(c)
 for(const text of ['这次为1位学员退还学费¥999','从真实交付案例开始的图像实作','2023-01-18班','企业账户 · AI卖课',...parts,'不等于学员已经到账','缺款继续保留应付和保护'])expect(html).toContain(text)
 expect(JSON.stringify(c)).toBe(before);expect(codec.export(run)).toBe(saved)
})
it('uses original odd-fen delivered and already refunded fields without charging the same unearned part again',()=>{
 const c=context(),co=c.course.cohorts[0]!,s=selected(c)
 co.priceFen=99901;s.priceFen=99901;s.delivered=[49951,0];s.refundedUnearned=49950;s.refundedFen=49950;s.paidRemainingFen=49951
 const html=render(c)
 for(const text of ['退还学费¥499.51','尚未交付的原预款¥0','已交付收入冲减¥499.51'])expect(html).toContain(text)
 s.refundedDelivered=[1,0];s.refundedFen=49951;s.paidRemainingFen=49950
 expect(render(c)).toContain('退还学费¥499.50')
})
it('uses the same original command for multiple selected people and all remaining learners',()=>{
 const c=context(),co=c.course.cohorts[0]!
 choose(c,co.students.slice(0,2).map(s=>s.personId));expect(render(c)).toContain('这次为2位学员退还学费¥1,998')
 choose(c,co.students.filter(s=>s.paidRemainingFen>0).map(s=>s.personId));expect(render(c)).toContain('这次为20位学员退还学费¥19,980')
 Object.assign(selected(c),{refundedUnearned:99900,refundedFen:99900,paidRemainingFen:0,outcome:'refunded'})
 choose(c,co.students.filter(s=>s.paidRemainingFen>0).map(s=>s.personId));expect(render(c)).toContain('这次为19位学员退还学费¥18,981')
})
it.each(['empty','duplicate','unknown-mixed','enrollment-id','refunded','cohort','course','product','price','business','account','missing-account','duplicate-student','negative','fraction','overflow','inconsistent-paid','inconsistent-refunded','excess-stage-refund','excess-unearned','run','revision','readonly','candidate','denied'] as const)('refuses the entire %s selection or context instead of filtering it into zero or a smaller quote',variant=>{
 const c=context(),co=c.course.cohorts[0]!,s=selected(c),lesson=c.course.courses.find(x=>x.id===co.courseId)!,b=c.course.businesses.find(x=>x.id===lesson.businessId)!
 if(variant==='empty')choose(c,[])
 if(variant==='duplicate')choose(c,[s.personId,s.personId])
 if(variant==='unknown-mixed')choose(c,[s.personId,'unknown-person'])
 if(variant==='enrollment-id')choose(c,[s.id])
 if(variant==='refunded')Object.assign(s,{refundedUnearned:99900,refundedFen:99900,paidRemainingFen:0})
 if(variant==='cohort')s.cohortId='different-cohort'
 if(variant==='course')s.courseId='different-course'
 if(variant==='product')s.productKey='course:video_workflows:foundation'
 if(variant==='price')s.priceFen++
 if(variant==='business')lesson.businessId='unknown-business'
 if(variant==='account')b.accountId='personal'
 if(variant==='missing-account')c.view.accounts=c.view.accounts.filter(a=>a.accountId!==b.accountId)
 if(variant==='duplicate-student')co.students.push({...s,id:'duplicate-enrollment'})
 if(variant==='negative')s.delivered=[-1,0]
 if(variant==='fraction')s.refundedUnearned=0.5
 if(variant==='overflow'){co.priceFen=MONEY_LIMIT+1;s.priceFen=MONEY_LIMIT+1;s.paidRemainingFen=MONEY_LIMIT+1}
 if(variant==='inconsistent-paid')s.paidRemainingFen--
 if(variant==='inconsistent-refunded')s.refundedFen=1
 if(variant==='excess-stage-refund')s.refundedDelivered=[1,0]
 if(variant==='excess-unearned')s.refundedUnearned=99901
 if(variant==='run')c.command={...c.command,runId:'other-run'}
 if(variant==='revision')c.command={...c.command,expectedRevision:c.view.revision-1}
 if(variant==='readonly')c.view.readOnly=true
 if(variant==='candidate')c.view.hasCandidate=true
 if(variant==='denied')c.confirm.allowed=false
 const before=JSON.stringify(c),html=render(c)
 expect(html).toContain('没有取得这次原退款明细，请返回重新选择')
 expect(html).not.toContain('退还学费¥');expect(JSON.stringify(c)).toBe(before)
})
it('rejects an aggregate beyond the original money limit even when each public amount is individually valid',()=>{
 const c=context(),co=c.course.cohorts[0]!
 co.priceFen=MONEY_LIMIT
 for(const s of co.students.slice(0,2)){s.priceFen=MONEY_LIMIT;s.paidRemainingFen=MONEY_LIMIT}
 choose(c,co.students.slice(0,2).map(s=>s.personId))
 expect(render(c)).toContain('没有取得这次原退款明细，请返回重新选择')
})
it('keeps the original obligation readable with a public cash shortfall without inventing a payment result',()=>{
 const c=context(),b=c.course.businesses[0]!
 b.funds={...b.funds,cashFen:0,availableFen:0,protectionShortfallFen:1998000}
 const html=render(c)
 expect(html).toContain('退还学费¥999');expect(html).toContain('缺款继续保留应付和保护')
 expect(html).toContain('不等于学员已经到账')
 expect(html).not.toMatch(/退款已经到账|学员已全部到账|已全部付清|实际支付¥0|新增应付¥0|保护释放¥999/)
})
it('is wired through the actual CommandDetails captured course and business even when the viewed personal account differs',()=>{
 const c=context(),features={...c.view.features,course:c.course} as PlayFeatures,before=codec.export(run)
 const html=renderToStaticMarkup(<CommandDetails command={c.command} confirm={c.confirm} features={features} view={c.view} accountName={c.accountName} clock={null}/>)
 for(const text of ['退还学费¥999','企业账户 · AI卖课','尚未交付的原预款¥999','不等于学员已经到账'])expect(html).toContain(text)
 expect(codec.export(run)).toBe(before)
})
