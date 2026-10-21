import type {CommandPreview} from '../core/commands.ts'
import type {CourseProjection} from '../core/course-projection.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {PlayingView} from './game-types.ts'
import {moneyText} from './game-text.ts'

type RefundView=Pick<PlayingView,'runId'|'revision'|'accounts'|'operations'|'readOnly'|'hasCandidate'>
const amount=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=MONEY_LIMIT
function unique<T>(rows:readonly T[],matches:(row:T)=>boolean){
 const found=rows.filter(matches)
 return found.length===1?found[0]:undefined
}

/** Describe the original refund obligation only; cash settlement remains in the original ledger. */
function refundTerms(command:CommandEnvelope,course:CourseProjection,view:RefundView|undefined,confirm:CommandPreview|undefined){
 if(!course||!view||!confirm?.allowed||view.readOnly||view.hasCandidate||command.runId!==view.runId||command.expectedRevision!==view.revision)return null
 if(!command.payload||typeof command.payload!=='object'||Array.isArray(command.payload))return null
 const p=command.payload as {cohortId?:unknown;personIds?:unknown;reason?:unknown}
 if(typeof p.cohortId!=='string'||!Array.isArray(p.personIds)||p.personIds.length===0||!p.personIds.every((id):id is string=>typeof id==='string'&&id.length>0)||new Set(p.personIds).size!==p.personIds.length||typeof p.reason!=='string'||p.reason.trim().length===0)return null
 const cohort=unique(course.cohorts,c=>c.id===p.cohortId)
 if(!cohort)return null
 const lesson=unique(course.courses,c=>c.id===cohort.courseId)
 if(!lesson||lesson.productKey!==`course:${lesson.topicId}:${lesson.edition}`||!unique(course.catalog.products,c=>c.id===lesson.productId)||!unique(course.catalog.topics,c=>c.id===lesson.topicId))return null
 const business=unique(course.businesses,b=>b.id===lesson.businessId),original=unique(view.operations?.businesses??[],b=>b.id===lesson.businessId)
 if(!business||!original||business.route!=='ai_course'||original.route!==business.route||!business.company||original.company!==business.company||original.definitionId!==business.definitionId||original.accountId!==business.accountId||business.accountId==='personal'||!unique(view.accounts,a=>a.accountId===business.accountId))return null
 if(!amount(cohort.priceFen)||cohort.priceFen===0||new Set(cohort.students.map(s=>s.personId)).size!==cohort.students.length||new Set(cohort.students.map(s=>s.id)).size!==cohort.students.length)return null
 const students=new Map(cohort.students.map(s=>[s.personId,s]))
 let unearned=0n,earned=0n,total=0n
 for(const id of p.personIds){
  const s=students.get(id)
  if(!s||s.cohortId!==cohort.id||s.courseId!==lesson.id||s.productKey!==lesson.productKey||s.priceFen!==cohort.priceFen||!amount(s.priceFen)||!amount(s.refundedUnearned)||!amount(s.refundedFen)||!amount(s.paidRemainingFen)||s.paidRemainingFen===0||!Array.isArray(s.delivered)||s.delivered.length!==2||!Array.isArray(s.refundedDelivered)||s.refundedDelivered.length!==2||!s.delivered.every(amount)||!s.refundedDelivered.every(amount))return null
  const delivered=BigInt(s.delivered[0])+BigInt(s.delivered[1]),returned=BigInt(s.refundedDelivered[0])+BigInt(s.refundedDelivered[1]),prepaid=BigInt(s.priceFen)-delivered-BigInt(s.refundedUnearned),income=delivered-returned,refunded=BigInt(s.refundedUnearned)+returned,remaining=BigInt(s.priceFen)-refunded
  if(s.refundedDelivered[0]>s.delivered[0]||s.refundedDelivered[1]>s.delivered[1]||prepaid<0n||income<0n||refunded!==BigInt(s.refundedFen)||remaining!==BigInt(s.paidRemainingFen)||prepaid+income!==remaining)return null
  unearned+=prepaid;earned+=income;total+=remaining
 }
 if(total>BigInt(MONEY_LIMIT)||unearned>BigInt(MONEY_LIMIT)||earned>BigInt(MONEY_LIMIT))return null
 return {lesson,cohort,accountId:business.accountId,count:p.personIds.length,totalFen:Number(total),unearnedFen:Number(unearned),earnedFen:Number(earned)}
}

export function CourseRefundDetails({command,course,view,confirm,accountName}:{command:CommandEnvelope;course:CourseProjection;view?:RefundView|undefined;confirm?:CommandPreview|undefined;accountName?:((id:string)=>string)|undefined}){
 if(command.kind!=='RefundCourseLearners')return null
 const terms=refundTerms(command,course,view,confirm)
 if(!terms||!accountName)return <p className="warning-box">没有取得这次原退款明细，请返回重新选择。</p>
 return <section className="confirmation-context course-refund-terms"><h3>这次为{terms.count}位学员退还学费{moneyText(terms.totalFen)}</h3><p>{terms.lesson.name} · {terms.cohort.startAt}班 · {accountName(terms.accountId)}。</p><p>其中尚未交付的原预款{moneyText(terms.unearnedFen)}；已交付收入冲减{moneyText(terms.earnedFen)}。</p><p>这是本次应退金额，不等于学员已经到账。提交并保存后，按原款与当前现金处理；缺款继续保留应付和保护。</p></section>
}
