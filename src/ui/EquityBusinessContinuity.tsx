import type {EquityBusinessContinuity as Continuity} from './equity-business-continuity.ts'
import {moneyText} from './game-text.ts'

export function EquityBusinessContinuity({value}:{value:Continuity|null}){
 if(!value)return <p className="reason">原主体、任务或人员来源尚未唯一核定；请翻原册核对，没有将未知按零或换成另一份安排。</p>
 const {business:b,finance:f,costs,own,elsewhere,workers,agreements,exits,otherTaskMoney}=value
 const otherAmount=(key:'paidFen'|'reservedFen')=>{
  const known=otherTaskMoney.map(row=>row.money[key]).filter((n):n is number=>n!==null),total=known.reduce((a,n)=>a+n,0),unknown=otherTaskMoney.length-known.length
  if(!Number.isSafeInteger(total))return '金额待核对'
  return unknown?known.length&&total>0?moneyText(total)+'已核，另'+unknown+'项待核':'金额待核对（'+unknown+'项）':moneyText(total)
 }
 const equityMoney=costs.reason!==null||(costs.paidFen??0)>0||(costs.reservedFen??0)>0
 return <section className="equity-continuity" aria-label="这份主体停止与保留的实际范围">
  <p>{b.lifecycle==='closed'?'这份原分账已经关闭。':b.lifecycle==='winding_down'?'这份原主体已经进入收尾，不再开始新的关系与邀请。':`本主体${own.filter(j=>j.status==='planned').length}项未开工安排将取消，${own.filter(j=>j.status==='running').length}项进行中工作将中断；${workers.length}位员工结束在岗。`}{elsewhere.length?` 另会中断其他分账的${elsewhere.length}项原任务。`:null}</p>
  {equityMoney?<p>权益准备原已付{moneyText(costs.paidFen)} · 原预留{moneyText(costs.reservedFen)}。{costs.reason??''}</p>:null}
  {otherTaskMoney.length?<p>受影响安排已付{otherAmount('paidFen')} · 未开工原预留{otherAmount('reservedFen')}，分别沿原账户保留或解除。{otherTaskMoney.some(row=>row.money.reason)?<span className="reason">尚有原钱款来源待核对，未按零说明。</span>:null}</p>:null}
  <p><strong>现在可花{moneyText(f?.availableFen)}</strong> · 本账户现金{moneyText(f?.cashFen)}</p>
  <p><strong>已用未出账{moneyText(f?.accruedCostFen)}</strong>，是旧支出，实际结算另核。</p>
  {!f?<p className="reason">本账户资金来源仍待核对，不以零代替。</p>:f.prepaidLiabilityFen===0&&f.receivableFen===0&&f.payableFen===0?<p>客户保护款、待收与待付当前均为¥0。</p>:<p>客户未履约保护{moneyText(f.prepaidLiabilityFen)} · 待收{moneyText(f.receivableFen)} · 待付{moneyText(f.payableFen)}。</p>}
  <p>已付费用与已用行动不退；原预留按任务和季度解除。工资、维护与客户原约另按原账结算。</p>
  {agreements.length||exits.length?<p>原持股{agreements.length}份、询价与转让{exits.length}份继续保留。停止不卖股、不自动收款或解锁；仍有持股或未收款，关闭仍按原条件拒绝。</p>:null}
  <details><summary>核对所有会受影响的原任务与人员</summary>{value.affected.length?value.affected.map((j,index)=><p key={j.id}>原任务{index+1} · {j.businessId===b.id?'本主体':'另一分账'} · {j.startAt}—{j.completeAt} · {j.status==='planned'?'尚未开工，停止后取消原安排':'已经开工，停止后中断，已耗不退'}。</p>):<p>当前公开原记录没有仍在等待或进行的受影响任务。</p>}{workers.map((w,index)=><p key={w.id}>本主体原员工{index+1} · {w.from}起在岗 · 月薪基准{moneyText(w.monthlyWageFen)}，实际原工资仍按日期结算。</p>)}
   <p>本主体员工参与的跨分账任务也会按原规则中断；另一份业务本身不因此关闭。</p>
   <p>权益任务原已付{moneyText(costs.paidFen)}、尚未开工资金预留{moneyText(costs.reservedFen)}仅是原权益任务范围，不能冒整个账户的历史总成本。{costs.reason??''}</p>
   {otherTaskMoney.map(({job,money})=><p key={job.id}>{job.businessId===b.id?'本主体':'另一分账'}原安排 · {job.startAt}—{job.completeAt} · 已付{moneyText(money.paidFen)}、原预留{moneyText(money.reservedFen)}。{money.reason??''}</p>)}
   <p>本账户已用未出账{moneyText(f?.accruedCostFen)}是原成本，不是本次新增预算，也不是停止时必付总额；实际工资维护和客户约定分别核对。</p>
   <p>完整原任务、合同、每笔资金与其他主体的原记录继续保留，不在此处执行或自动取消合同。</p>
  </details>
 </section>
}
