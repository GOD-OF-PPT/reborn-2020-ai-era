import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import type {LifeReference} from '../core/life-schema.ts'
import {addDays} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

export function LifeCommandDetails({command,confirm,features,view}:{command:CommandEnvelope;confirm:CommandPreview;features:PlayFeatures;view:PlayingView}){
 if(!['StartLifeWork','FulfillLifePromise','InterruptLifeWork','SetLifePriority','AcceptLifePromise','DeclineLifePromise'].includes(command.kind))return null
 const p=command.payload as Record<string,unknown>,life=features.life,promise=life.promises.find(o=>o.id===p.promiseId),person=life.people.find(o=>o.id===(p.personId??promise?.personId)),job=life.jobs.find(j=>j.id===p.jobId)
 const reference=p.reference as LifeReference|null|undefined
 const term=command.kind==='StartLifeWork'?life.work[p.kind as keyof typeof life.work]:promise?{title:person?.promiseTerms.title??'实际兑现约定',costFen:promise.costFen,points:promise.actionPoints,days:promise.days}:null
 return <section className="confirmation-context"><h3>本次生活范围与个人责任</h3><p>由个人账户承担，当前个人可用{moneyText(life.personalAvailableFen)}；页面上选择企业账户不会让企业或客户保护款代付。</p>
 {command.kind==='StartLifeWork'||command.kind==='FulfillLifePromise'?<><p>{term?.title}：{view.date}实际开始，最早{term?addDays(view.date,term.days):'—'}完成；现在真实支付{moneyText(confirm.upfrontCostFen)}并占{confirm.actionPoints}点，共享本人日期产能。</p><p>开始不等于完成。中断不退已付成本或行动；休整不返AP或加收益，桌椅与照明只有实际完成才换场景。</p>{person?<p>共同工作仍尊重{person.name}的目标和公开档期，不把对方当作免费员工。</p>:null}{reference?<p>本次选定的实际依据：{reference.date} · {reference.kind==='paid_case'?'已付履约案例':reference.kind==='video_work'?'实际原创制作':reference.kind==='course_delivery'?'完整课程履约':'林舟实际参与记录'}<code className="identifier">{reference.id}</code>只在游戏中复盘，不改变原客户、合同、收款或商业素材权限。</p>:null}</>:null}
 {command.kind==='AcceptLifePromise'&&promise?<><p>现在接受只记约定：0点、无即时费用，不算完成。</p><div className="warning-box"><strong>之后仍需另行安排</strong><p>{person?.name} · {person?.promiseTerms.title} · 个人{moneyText(promise.costFen)} / {promise.actionPoints}点 / {promise.days}日，最迟{promise.deadline}实际完成。</p>{view.budget.available<1||life.personalAvailableFen<promise.costFen?<p>当前行动或个人可用资金不足；接受不会补充资源或保证能完成。到期未完成会保留失约及已发生成本。</p>:<p>未来费用和工作仍由你单独确认，未响应不自动付款或兑现。</p>}</div></>:null}
 {command.kind==='DeclineLifePromise'?<p>只婉拒尚未接受的邀请，不新增费用；不能借此删掉已经接受的原约定。</p>:null}
 {command.kind==='InterruptLifeWork'&&job?<p>停止{job.startAt}开始的工作；已付{moneyText(job.costFen)}与已耗{job.actionPoints}点保留，只释放未来日期产能。若关联原约定，承诺仍需按期限处理。</p>:null}
 {command.kind==='SetLifePriority'?<p>只保存本年度的生活关注，不冻结资金、不开始工作、不增加收入或行动，不提前摆出新家具。</p>:null}
 </section>
}
