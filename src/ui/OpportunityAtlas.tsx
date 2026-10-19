import {useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {RouteMark} from './RouteMark.tsx'
import {moneyText,reasonText} from './game-text.ts'
import desk from '../../assets/ui-redesign/cinematic/opportunities-v1.jpg'

export type RouteId=GamePanelProps['features']['workbench']['routes'][number]['id']
const paths:Record<RouteId,{line:string;dimensions:readonly string[]}>= {
 a_share:{line:'留下生活的余地，再给判断一个仓位。',dimensions:['产业判断','仓位与现金','实际撮合与交收']},
 ai_video:{line:'把一个想法，做成有人需要的作品。',dimensions:['受众与作品','制作与返工','商单或合格平台收入']},
 ai_course:{line:'先有做过的事，再有值得交付的课。',dimensions:['目标与案例','班额与支持','阶段交付与退款']},
 api_relay:{line:'每一次连接背后，都有要兑现的服务。',dimensions:['供应与客户','价格与服务额度','用量账单与更正']},
 deepseek_opportunity:{line:'参与技术的变化，也看清手里的权利。',dimensions:['用途适配与履约','融资资格与条款','稀释、锁定与买方']},
}
function isReady(route:GamePanelProps['features']['workbench']['routes'][number]){
 return route.requirements.reasons.length===0&&route.requirements.preparationReady&&route.requirements.availableCashFen>=route.requirements.minimumCashFen
}

/** Turning a page is display state only. Every purchase remains in its original workspace. */
export function OpportunityAtlas(props:GamePanelProps&{onRoute:(id:RouteId)=>void}){
 const routes=props.features.workbench.routes
 const [selected,setSelected]=useState<RouteId|null>(null),[imageFailed,setImageFailed]=useState(false)
 const route=routes.find(r=>r.id===selected)??routes[0]
 if(!route)return <section className="opportunity-atlas"><h2>机遇册还没有新的条目</h2><p>你仍可以回到住处，安排工作与生活。</p></section>
 const path=paths[route.id],number=String(routes.indexOf(route)+1).padStart(2,'0')
 return <section className="opportunity-atlas" aria-label="五条路线机遇册">
  <div className="opportunity-book">
   <nav className="opportunity-choices" aria-label="翻看五条路线"><header><p className="eyebrow">机遇册 / {props.features.workbench.quarter}</p><h2>下一条路，由你翻开。</h2></header>{routes.map((r,index)=><button type="button" key={r.id} className={'opportunity-choice path-'+r.id} aria-label={'翻看'+r.name} aria-pressed={r.id===route.id} aria-controls="opportunity-page" onClick={()=>setSelected(r.id)}><span className="opportunity-choice-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><RouteMark kind={r.id}/><span><strong>{r.name}</strong><small>{isReady(r)?'基础条件可核对':'看看还要准备什么'}</small></span><span className="opportunity-choice-arrow" aria-hidden="true">↗</span></button>)}</nav>
   <article id="opportunity-page" className={'opportunity-page path-'+route.id} aria-labelledby="opportunity-name" key={route.id}>
    <div className="opportunity-scene">{!props.textOnly&&!imageFailed?<img src={desk} width={1672} height={941} alt="" aria-hidden="true" onError={()=>setImageFailed(true)}/>:null}<div><span className="opportunity-folio">第 {number} 条路</span><p>{path.line}</p></div><RouteMark kind={route.id}/></div>
    <div className="opportunity-page-body"><header className="opportunity-page-heading"><h3 id="opportunity-name">{route.name}</h3><span className="opportunity-readiness">{isReady(route)?'基础条件可核对':'还有准备条件'}</span></header><p className="opportunity-preparation">{route.preparation}</p>
     <ol className="opportunity-milestones">{path.dimensions.map((dimension,index)=><li key={dimension}><span aria-hidden="true">0{index+1}</span>{dimension}</li>)}</ol>
     <dl className="opportunity-money"><div><dt>当前自有资金门槛</dt><dd>{moneyText(route.requirements.minimumCashFen)}</dd></div><div><dt>{route.accountId==='personal'?'个人':'该企业'}主体可花</dt><dd>{moneyText(route.requirements.availableCashFen)}</dd></div></dl>
     <details className="opportunity-boundaries"><summary>翻开准备条件与已知边界</summary><p>准备材料：{route.requirements.preparationReady?'已具备或本段无需':'尚待完成'}</p><p>{route.feedback}</p>{route.requirements.reasons.map((r,i)=><p key={r.id+String(i)} className="reason">{reasonText(r.reason)}</p>)}{route.id==='ai_video'&&route.futureTool.length>0?<p>未来生成式工具：{route.futureTool.map(reasonText).join('；')}。不影响2020手工小单。</p>:null}{route.id==='deepseek_opportunity'?<p className="warning-box">生态服务与直接股权分开。现实公开申购未提供；架空融资也须资格与对方意愿，钱和技术不会自动变成股权。</p>:null}</details>
     <footer className="opportunity-enter"><span>先了解，再决定投入。</span><button type="button" className="primary" onClick={()=>props.onRoute(route.id)}>走进{route.name} <span aria-hidden="true">→</span></button></footer>
    </div>
   </article>
  </div>
  <p className="opportunity-afterword">翻看不花费行动。可以只工作、只投资，也可以逐步经营。本季重点只影响展示顺序，不限制同时参与几项。</p>
 </section>
}
