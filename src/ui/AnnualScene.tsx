import type {LifeProjection} from '../core/life-projection.ts'
import {RoomBackdrop} from './RoomBackdrop.tsx'
import {annualRoomImproved} from './annual-scene.ts'

export function AnnualScene({life,year,textOnly}:{life:LifeProjection;year:LifeProjection['years'][number];textOnly:boolean}){
 const improved=annualRoomImproved(life.jobs,year.through)
 return <section className="annual-scene" aria-label={year.year+'年已经发生的生活片段'}><div className="annual-room">{!textOnly?<RoomBackdrop improved={improved}/>:null}<div className="annual-room-caption"><span className="annual-year">{year.year}</span><p>{improved?'截至这段回顾，桌椅与照明已经改善。':'那时的住处，仍是原来的模样。'}</p><small>{year.from}—{year.through} · {year.isCompleteYear?'这一年已走过':'故事还在继续'}</small></div></div><ol className="annual-film">{[...year.important].reverse().map(f=><li key={f.id}><time>{f.date}</time><p>{f.text}</p></li>)}{!year.important.length?<li><p>这一页还很短。保持原来的生活，也是选择。</p></li>:null}</ol></section>
}
