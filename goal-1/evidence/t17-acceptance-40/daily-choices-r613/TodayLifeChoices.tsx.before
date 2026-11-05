import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'
import {addDays} from '../core/calendar.ts'

/** A comparison of current public personal terms; the original buttons own
 * eligibility and confirmation. Choosing a card does not complete its work. */
export function TodayLifeChoices({p}:{p:GamePanelProps}){
 return <section className="today-life-choices">
  <p className="today-life-context">今天{p.view.date} · 个人可花{moneyText(p.features.life.personalAvailableFen)} · 本季可用{p.view.budget.available}点</p>
  <div className="today-life-options">{(['rest','workspace'] as const).map((kind,index)=>{
   const terms=p.features.life.work[kind]
   return <article key={kind} className="today-life-option" data-kind={kind}>
    <div className="today-life-heading"><span className="today-life-number" aria-hidden="true">0{index+1}</span><h3>{terms.title}</h3><svg className="today-life-sketch" viewBox="0 0 80 72" fill="none" aria-hidden="true" focusable="false">{kind==='rest'?<><path className="life-sketch-paper" d="m12 18 27-5 29 8-4 39-26-7-28 4z"/><path className="life-sketch-line" d="m39 13-1 40M20 27l12-2m-13 11 12-2m16-8 12 3m-13 6 12 3"/><path className="life-sketch-thread" d="m49 17-5 42 6-4 5 6 3-42"/></>:<><path className="life-sketch-light" d="m38 29-17 27h45L48 29"/><path className="life-sketch-line" d="M15 61h53M47 28l7 27m-5 3h13M48 14l11 7"/><path className="life-sketch-paper" d="m33 16 12-8 13 18-27 6z"/><circle className="life-sketch-pin" cx="51" cy="44" r="3"/></>}</svg></div>
    <p className="today-life-terms"><strong>{moneyText(terms.costFen)}</strong><span>{terms.points}点 · {terms.days}天</span></p>
    <p className="today-life-date">最早 <time dateTime={addDays(p.view.date,terms.days)}>{addDays(p.view.date,terms.days)}</time> 完成</p>
    <p className="today-life-effect">{kind==='rest'?'完成后记下这段休整，不返还行动。':'实际完成后才改善桌椅与照明。'}</p>
    <CommandButton {...p} kind="StartLifeWork" payload={{kind,personId:null,reference:null}} label={kind==='rest'?'核对并留出七天休整':'核对并改善桌椅与照明'} confirm primary>{kind==='rest'?'给自己几天时间':'让住处更舒服些'} <span aria-hidden="true">→</span></CommandButton>
   </article>
  })}</div>
  <p className="today-life-footnote">中断不退已用的钱和行动；下一步再由你确认。</p>
 </section>
}
