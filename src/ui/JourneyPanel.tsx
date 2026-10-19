import {useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import city from '../../assets/ui-redesign/cinematic/ending-city-v1.jpg'

export function JourneyPanel({p,onYear,onChoose}:{p:GamePanelProps;onYear:(year:number)=>void;onChoose:()=>void}){
 const journey=p.features.journey,[selection,setSelection]=useState<number|null>(null),[failed,setFailed]=useState(false)
 if(!journey)return <p>这份独立存档没有正常篇章进程，不能作为完整人生的通关依据。</p>
 const latest=journey.chapters.at(-1)!.year,year=selection!==null&&selection<=latest?selection:latest,chapters=journey.chapters.filter(c=>c.year===year)
 return <div className="journey-book"><section className="journey-frontispiece" aria-label="已经走过的人生章节">{!p.textOnly&&!failed?<img src={city} alt="" aria-hidden="true" width={1672} height={941} onError={()=>setFailed(true)}/>:null}<div><p className="eyebrow">长日重启 / 你的六年</p><h3>{year}</h3><p>{journey.yearThemes[year-2020]}</p><small>已实际走过{journey.closedQuarters}季 · 当前{p.view.date}。翻看不会替你走完下一季。</small></div></section>{journey.yearThemes.length>1?<nav className="journey-years" aria-label="选择已经开始的年度">{journey.yearThemes.map((theme,index)=><button type="button" key={index} aria-label={'翻看'+(2020+index)+'年篇章'} aria-pressed={year===2020+index} onClick={()=>setSelection(2020+index)}><span>{2020+index}</span>{theme}</button>)}</nav>:null}<section className="journey-quarter-list" aria-label={year+'年实际开启的季度'}>{chapters.map(q=><article key={q.id}><p className="eyebrow">{q.id} / {q.closedAt?'已经走过':'仍在经历'}</p><h3>{q.title}</h3><p>{q.line}</p><small>{q.openedAt}开始{q.closedAt?' · '+q.closedAt+'实际结束':' · 本季仍由你安排'}</small><details><summary>核对这段日子的实际来源</summary><p>开启：{q.openSourceId}</p>{q.closeSourceId?<p>结束：{q.closeSourceId}</p>:<p>还没有本季结束记录，不把阅读当作完成。</p>}</details></article>)}</section><div className="button-row"><button type="button" onClick={()=>onYear(year)}>回看{year}年的实际胶片</button><button type="button" className="primary" onClick={onChoose}>回到眼前，作一个选择 →</button></div></div>
}
