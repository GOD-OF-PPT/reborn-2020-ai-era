import type {EquityBusinessContinuity as Continuity} from './equity-business-continuity.ts'
import {moneyText} from './game-text.ts'

export function EquityBusinessContinuity({value}:{value:Continuity|null}){
 if(!value)return <p className="reason">原主体、任务或人员来源尚未唯一核定；请翻原册核对，没有将未知按零或换成另一份安排。</p>
 const {business:b,finance:f,costs,own,elsewhere,workers,agreements,exits}=value
 return <section className="equity-continuity" aria-label="这份主体停止与保留的实际范围">
  <p>{b.lifecycle==='closed'?'这份原分账已经关闭。':b.lifecycle==='winding_down'?'这份原主体已经进入收尾，不再开始新的关系与邀请。':`真正进入收尾会停止本主体${own.filter(j=>j.status==='planned').length}项未开工、${own.filter(j=>j.status==='running').length}项进行中的原任务，并结束${workers.length}位本主体员工的在岗安排。`}{elsewhere.length?` 本主体员工还用于其他分账的${elsewhere.length}项原任务；这些任务也会按原规则中断。`:null}</p>
  <p>权益任务原已付{moneyText(costs.paidFen)}、尚未开工资金预留{moneyText(costs.reservedFen)}；已付费用和已用行动不退，未开工的预留按原任务与原季度释放。{costs.reason??''}工资维护和客户原约分别结算。</p>
  <p>本账户现金{moneyText(f?.cashFen)}、客户未履约保护{moneyText(f?.prepaidLiabilityFen)}、待收{moneyText(f?.receivableFen)}、待付{moneyText(f?.payableFen)}。{f?`本账户已用未出账${moneyText(f.accruedCostFen)}是原成本，不是本次新增预算，也不是停止时必付总额。`:'本账户资金来源仍待核对，不以零代替。'}</p>
  {agreements.length||exits.length?<p>本主体{agreements.length}份原持股协议、{exits.length}份原询价与转让记录各自保留。停止不卖股、不自动收款或清除锁定；仍有持股或未收原款时，关闭继续按原规则拒绝。可以先保留，回自己的生活。</p>:null}
  <details><summary>核对所有会受影响的原任务与人员</summary>{value.affected.length?value.affected.map((j,index)=><p key={j.id}>原任务{index+1} · {j.businessId===b.id?'本主体':'另一分账'} · {j.startAt}—{j.completeAt} · {j.status==='planned'?'尚未开工，停止后取消原安排':'已经开工，停止后中断，已耗不退'}。</p>):<p>当前公开原记录没有仍在等待或进行的受影响任务。</p>}{workers.map((w,index)=><p key={w.id}>本主体原员工{index+1} · {w.from}起在岗 · 月薪基准{moneyText(w.monthlyWageFen)}，实际原工资仍按日期结算。</p>)}<p>完整原任务、合同、每笔资金与其他主体的原记录继续保留，不在此处执行或自动取消合同。</p></details>
 </section>
}
