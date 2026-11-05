import type {SeasonTurnReading} from './season-turn.ts'
import './season-turn.css'

/** All facts come from the original current-quarter reading. */
export function SeasonTurnSummary({value:v}:{value:SeasonTurnReading}) {
 return <section className={'season-turn-summary'+(v.carry?' season-turn-with-carry':'')} aria-label="季末交接摘要">
  <p className="season-turn-date">{v.quarter} · {v.today}收好这一页</p>
  <p className="season-turn-result">{v.situation}</p>
  {v.carry?<section className="season-carry" aria-label="带到下一季的原安排"><p className="season-carry-heading">带到下一季 <span>尚未完成 · 原投入保留</span></p><div className="season-carry-papers" style={{gridTemplateColumns:'repeat('+v.carry.length+',minmax(0,1fr))'}}>{v.carry.map(item=><article key={item.id}><header><h4>{item.label}</h4><span>{item.stage}</span></header><p className="season-carry-origin">始于{item.quarter} · {item.from}</p>{item.lines.map((line,index)=><p key={index}>{line}</p>)}<p className="season-carry-date"><span>原预计反馈</span><time dateTime={item.through}>{item.through}</time></p></article>)}</div></section>:v.pending.map(item=><div className="season-turn-pending" key={item.id}><strong>仍在继续 · {item.title}</strong><p>{item.line}</p>{item.dueAt&&!item.line.includes(item.dueAt)?<p>原日期 · {item.dueAt}</p>:null}</div>)}
  {v.retained>0?<p className="season-turn-retained">另有{v.retained}份原记录继续保留，不要求为了翻页先清空。</p>:null}
  <h3>{v.question}</h3>
  <p className="season-turn-next">新安排仍由你决定；旧约与费用照原日历继续。</p>
 </section>
}
