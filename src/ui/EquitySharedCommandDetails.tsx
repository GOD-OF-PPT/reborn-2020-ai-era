import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {GamePanelProps} from './game-types.ts'
import {equityBusinessContinuity,EQUITY_SHARED_COMMANDS,equitySharedCommandBusinessId} from './equity-business-continuity.ts'
import {EquityBusinessContinuity} from './EquityBusinessContinuity.tsx'
import {moneyText} from './game-text.ts'

type Props={command:CommandEnvelope;preview:CommandPreview;view:GamePanelProps['view'];features:GamePanelProps['features']}
export function EquitySharedCommandDetails({command,preview,view,features}:Props){
 if(!EQUITY_SHARED_COMMANDS.has(command.kind))return null
 const body=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:{},task=typeof body.jobId==='string'?view.operations?.jobs.filter(j=>j.id===body.jobId):undefined,job=task?.length===1?task[0]:undefined
 const businessId=equitySharedCommandBusinessId(command,{view,features})
 if(businessId===null)return null
 const value=equityBusinessContinuity({view,features},businessId)
 if(command.runId!==view.runId||command.expectedRevision!==view.revision||!value)return <section className="warning-box"><h3>先核对本次原主体</h3><p>原确认与主体、账户或任务来源尚未唯一核定。没有替换为另一份准备或隐藏原义务，请返回核对。</p></section>
 const b=value.business
 const plainZero=command.kind!=='FundBusiness'&&preview.upfrontCostFen===0&&preview.releasedFen===0&&(preview.accruedServiceFeeFen??0)===0&&!preview.actionAllocations?.length&&typeof body.startAt!=='string'
 const baseFacts=<><p className="command-introduction">{command.kind==='FundBusiness'?'个人账户 → 企业账户 · '+b.accountId.slice(-6):b.accountId==='personal'?'个人账户 · 原准备分账':'企业账户 · '+b.accountId.slice(-6)} · {view.date} · 本次使用{preview.actionPoints}点{plainZero?' · 本次新增安排费用¥0':''}。</p>{plainZero?null:<dl className="command-facts"><div><dt>{command.kind==='FundBusiness'?'本次自有资本转账':'本次新增安排费用'}</dt><dd>{moneyText(command.kind==='FundBusiness'&&typeof body.amountFen==='number'?body.amountFen:preview.upfrontCostFen)}</dd></div>{preview.releasedFen>0?<div><dt>原占款释放</dt><dd>{moneyText(preview.releasedFen)}</dd></div>:null}{(preview.accruedServiceFeeFen??0)>0?<div><dt>本主体原已用未出账服务费结算</dt><dd>{moneyText(preview.accruedServiceFeeFen)} · 非新增服务承诺</dd></div>:null}{preview.actionAllocations?<div><dt>原跨日期注意力</dt><dd><ul>{preview.actionAllocations.map((a,index)=><li key={a.date+String(index)}>{a.date} · {a.label}{a.actionPoints}点</li>)}</ul></dd></div>:null}{typeof body.startAt==='string'?<div><dt>本次显选开工日</dt><dd>{body.startAt}</dd></div>:null}</dl>}</>
 if(command.kind==='FundBusiness')return <section className="equity-decision-facts">{baseFacts}<h3>另留一笔自己的钱，原责任继续</h3><p>个人账户 → 本份企业账户，所选自有资本{moneyText(typeof body.amountFen==='number'?body.amountFen:null)}；转账不产生业务收入，也不支付投资本金。原客户保护、工资维护与已承诺支出继续保留。</p></section>
 if(command.kind==='InterruptJob'||command.kind==='RescheduleJob')return job?<section className="equity-decision-facts">{baseFacts}<h3>{command.kind==='InterruptJob'?'只停止这一次原任务':'核对这份原任务能否改期'}</h3><p>原窗口{job.startAt}—{job.completeAt}，{job.status==='planned'?'尚未开工':job.status==='running'?'已经开工':'原任务已经结束'}。本次新增费用{moneyText(preview.upfrontCostFen)}；已耗费用与行动不退，未开工原预留按对应任务和季度解除。</p><p>关系、调查、谈判、会议与买方任务沿原固定日程，不能通过改填日期获得原规则没有允许的改期。中断不等于取消合同、取得股份、退款或收齐原款；其他原工作和生活继续。</p></section>:null
 return <section className="equity-decision-facts">{baseFacts}<h3>{command.kind==='WindDownBusiness'?'真的停下这一份主体，保留已经承担的事':'合上分账，原人生记录仍在'}</h3>
  {command.kind==='WindDownBusiness'?<p>这一步停止整份主体的安排，包含原任务和本主体员工所影响的其他工作；不会只收起眼前这一张纸。新增安排费用{moneyText(preview.upfrontCostFen)}，原工资维护仍会按实际结算，可能留下真实待付。</p>:<p>{b.company?`原规则允许关闭后，本企业剩余现金${moneyText(value.finance?.cashFen)}转回个人账户；这是自有资本转回，不是收入。`:'个人准备分账关闭不会转移或新增个人现金。'}原持股、未收款、合同或待付未满足关闭条件时，仍沿原拒绝；不要求为了回生活而清空持股。</p>}
  <EquityBusinessContinuity value={value}/>
 </section>
}
