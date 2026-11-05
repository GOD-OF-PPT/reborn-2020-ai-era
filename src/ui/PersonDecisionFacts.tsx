import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import type {LifeReference} from '../core/life-schema.ts'
import {addDays} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

export interface PersonDecision{
 readonly kind:'activity'|'accept'|'fulfill';readonly personId:string;readonly name:string;readonly title:string
 readonly startAt:string;readonly completeAt:string;readonly costFen:number;readonly points:number;readonly days:number
 readonly deadline:string|null;readonly promiseId:string|null;readonly reference:LifeReference|null;readonly resourcesShort:boolean
}
const money=(value:number)=>Number.isSafeInteger(value)&&value>=0
const referenceName={paid_case:'已付履约案例',video_work:'实际原创制作',course_delivery:'完整课程履约',linzhou_participation:'林舟实际参与记录'}
/** Read captured public facts only. A null summary keeps the original full review;
 * the original preview and command still own every eligibility decision. */
export function capturePersonDecision(command:CommandEnvelope,preview:CommandPreview,view:PlayingView,features:PlayFeatures):PersonDecision|null{
 if(!['StartLifeWork','AcceptLifePromise','FulfillLifePromise'].includes(command.kind)||!preview.allowed||command.runId!==view.runId||command.expectedRevision!==view.revision||view.phase!=='playing'||view.readOnly||view.hasCandidate||view.busy||view.saveStatus!=='saved')return null
 if(preview.releasedFen!==0||preview.actionAllocations||preview.actionDate!==undefined&&preview.actionDate!==view.date||preview.receivedPrepaymentFen!==undefined||preview.protectedIncreaseFen!==undefined||preview.accruedServiceFeeFen!==undefined||preview.privateSale||preview.knownAdjustments)return null
 const p=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:null,life=features.life,accounts=view.accounts.filter(a=>a.accountId==='personal')
 if(!p||life.asOf!==view.date||accounts.length!==1||!money(life.personalAvailableFen)||accounts[0]!.availableFen!==life.personalAvailableFen||!money(view.budget.available))return null
 try{
  if(addDays(view.date,0)!==view.date)return null
  const promises=command.kind==='StartLifeWork'?[]:life.promises.filter(o=>o.id===p.promiseId)
  if(command.kind!=='StartLifeWork'&&promises.length!==1)return null
  const promise=promises[0]??null,people=life.people.filter(person=>person.id===(promise?.personId??p.personId))
  if(people.length!==1)return null
  const person=people[0]!
  if(!person.known||!person.name.trim())return null
  let kind:PersonDecision['kind'],costFen:number,points:number,days:number,title:string,reference:LifeReference|null=null
  if(promise){
   const own=person.promises.filter(o=>o.id===promise.id)
   if(own.length!==1||JSON.stringify(own[0])!==JSON.stringify(promise)||!person.promiseTerms.title.trim()||promise.offeredAt>view.date||addDays(promise.offeredAt,0)!==promise.offeredAt||addDays(promise.deadline,0)!==promise.deadline||addDays(promise.expiresAt,0)!==promise.expiresAt)return null
   if(command.kind==='AcceptLifePromise'){
    if(p.consent!==true||promise.status!=='offered'||promise.acceptedAt!==null||promise.resolvedAt!==null||view.date>promise.expiresAt)return null
    kind='accept'
   }else{
    if(promise.status!=='accepted'||promise.acceptedAt===null||promise.acceptedAt>view.date||promise.resolvedAt!==null)return null
    kind='fulfill'
   }
   costFen=promise.costFen;points=promise.actionPoints;days=promise.days;title=person.promiseTerms.title
  }else{
   if(command.kind!=='StartLifeWork'||person.work.kind!==p.kind)return null
   const term=life.work[person.work.kind]
   if(!term||person.work.costFen!==term.costFen||person.work.points!==term.points||person.work.days!==term.days||person.work.title!==term.title)return null
   if(person.id==='tang-ying'){if(p.reference!==null)return null}else{
    const ref=p.reference!==null&&typeof p.reference==='object'&&!Array.isArray(p.reference)?p.reference as Record<string,unknown>:null
    if(!ref||typeof ref.kind!=='string'||!Object.hasOwn(referenceName,ref.kind)||typeof ref.id!=='string'||typeof ref.date!=='string'||ref.date>view.date||addDays(ref.date,0)!==ref.date)return null
    const matches=person.references.filter(row=>row.kind===ref.kind&&row.id===ref.id&&row.date===ref.date)
    if(matches.length!==1)return null
    reference={...matches[0]!}
   }
   kind='activity';costFen=term.costFen;points=term.points;days=term.days;title=term.title
  }
  if(!title.trim()||!money(costFen)||!money(points)||!Number.isSafeInteger(days)||days<=0||preview.upfrontCostFen!==(kind==='accept'?0:costFen)||preview.actionPoints!==(kind==='accept'?0:points))return null
  return {kind,personId:person.id,name:person.name,title,startAt:view.date,completeAt:addDays(view.date,days),costFen,points,days,deadline:promise?.deadline??null,promiseId:promise?.id??null,reference,resourcesShort:life.personalAvailableFen<costFen||view.budget.available<points}
 }catch{return null}
}
export function PersonDecisionFacts({value}:{value:PersonDecision}){
 const accepting=value.kind==='accept'
 return <section className="life-decision-facts person-decision-facts">
  <p className="command-introduction">个人承担 · {value.name} · {value.title}</p>
  <dl className="command-facts">
   <div><dt>{accepting?'现在支付':'实际支付'}</dt><dd>{moneyText(accepting?0:value.costFen)}</dd></div>
   <div><dt>{accepting?'现在行动':'本季行动'}</dt><dd>{accepting?0:value.points}点</dd></div>
   <div><dt>{accepting?'之后另行安排':'开始相处'}</dt><dd>{accepting?moneyText(value.costFen)+' / '+value.points+'点 / '+value.days+'日':value.startAt}</dd></div>
   <div><dt>{accepting?'约定完成期限':'预计完成'}</dt><dd>{accepting?value.deadline:value.completeAt}</dd></div>
  </dl>
  {value.kind==='fulfill'?<p>原期限 {value.deadline}。{value.deadline&&value.completeAt>value.deadline?'按当前日期安排已无法按期完成；原约定责任仍保留。':'这次安排仍需真正完成。'}</p>:null}
  {value.reference?<p>本次材料：{value.reference.date} · {referenceName[value.reference.kind]}。只复盘原经历，不改变客户或素材权限。</p>:null}
  <p>{accepting?'答应只记下约定，不会自动付费或兑现；之后仍由你另行安排。':'开始不等于完成；中断不退已付成本和行动，对方的原日程仍须尊重。'}</p>
  {accepting&&value.resourcesShort?<p className="error-box" role="note">当前行动或个人资金不足以兑现；接受不会补充资源，到期未完成仍会记下失约。</p>:null}
 </section>
}
