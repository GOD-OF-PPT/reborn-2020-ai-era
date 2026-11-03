import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'
import {addDays} from '../core/calendar.ts'
import './today-market-choices.css'

/** Public choices, not another trade or research controller. Original guarded
 * controls own confirmation; existing research keeps its original identity. */
export function TodayMarketChoices({p,orderAction,researchAction}:{p:GamePanelProps;orderAction:ReactNode;researchAction:ReactNode}){
 const overview=p.features.workbench.researches.find(row=>row.id==='market-overview'),research=overview?.state
 const personal=p.view.accounts.find(row=>row.accountId==='personal')
 const title=research?.status==='running'?'公开资料正在整理':research?.status==='completed'?'这份资料，已整理完成':research?.status==='interrupted'?'这份研究，已经中断':research?'翻回这份公开研究':'先读一份公开资料'
 return <section className="today-market-choices">
  <p className="today-market-context"><span>{p.view.date} · 模拟市场</span><span>{personal?'个人可花'+moneyText(personal.availableFen):'个人可花金额待核对'} · 本季可用{p.view.budget.available}点</span></p>
  <div className="today-market-options">
   <article className="today-market-option" data-kind="research">
    <header><span className="today-market-number" aria-hidden="true">01</span><h3>{title}</h3><svg className="today-market-sketch" viewBox="0 0 80 72" fill="none" aria-hidden="true" focusable="false"><path className="market-sketch-paper" d="m13 14 48 5-4 43-48-5z"/><path className="market-sketch-line" d="m23 27 26 3m-27 7 17 2m-18 7 25 3"/><circle className="market-sketch-lens" cx="51" cy="41" r="13"/><path className="market-sketch-line" d="m60 51 10 12"/></svg></header>
    {!research&&overview?<><p className="today-market-terms"><strong>{moneyText(overview.costFen)}</strong><span>{overview.actionPoints}点 · {overview.days}天</span></p><p className="today-market-date">预计 <time dateTime={addDays(p.view.date,overview.days)}>{addDays(p.view.date,overview.days)}</time> 完成</p><p className="today-market-effect">整理公开线索；不揭示未来价格，也不自动买入。</p><CommandButton {...p} kind="ResearchMarket" payload={{definitionId:overview.id}} label="核对并开始公开研究" confirm primary>先核对研究投入 <span aria-hidden="true">→</span></CommandButton></>:research?<><p className="today-market-status" data-state={research.status}>{research.status==='running'?'整理中':research.status==='completed'?'已完成':research.status==='interrupted'?'已中断':'待核对'}</p><p className="today-market-date">{research.status==='running'?<>始于{research.startAt} · 预计{research.completeAt}完成</>:research.status==='completed'?<>已于{research.completeAt}整理完成</>:research.status==='interrupted'?'已经投入的钱和行动不返还。':'请查看这份研究的原记录。'}</p><p className="today-market-effect">{research.status==='running'?'可以回到原笔记等待结果，也可以先做别的事。':research.status==='completed'?'研究结果保留；是否买卖，仍由你另作决定。':research.status==='interrupted'?'原研究记录保留，不会再次替你开工。':'状态未核清，不将它当作已经完成。'}</p>{researchAction}</>:<><p className="today-market-status">条件待核对</p><p className="today-market-effect">暂未找到这份研究的公开条件，请从原市场记录核对。</p></>}
   </article>
   <article className="today-market-option" data-kind="order">
    <header><span className="today-market-number" aria-hidden="true">02</span><h3>给这次判断划个边界</h3><svg className="today-market-sketch" viewBox="0 0 80 72" fill="none" aria-hidden="true" focusable="false"><path className="market-sketch-paper" d="m14 11 43 3-3 48-43-3z"/><path className="market-sketch-line" d="m23 25 22 2m-23 8 22 2m-23 8 12 1"/><path className="market-sketch-pencil" d="m48 48 16-32 5 3-17 31-8 5z"/></svg></header>
    <p className="today-market-terms"><strong>写一份模拟委托</strong></p>
    <p className="today-market-date">账户、标的、买卖方向，由你显选。</p>
    <p className="today-market-effect">再定股数、限价与期限；提交前核对费用和预留。</p>
    {orderAction}
   </article>
  </div>
  <p className="today-market-footnote">填写不等于成交。已有委托、持仓与交收仍照常。</p>
 </section>
}
