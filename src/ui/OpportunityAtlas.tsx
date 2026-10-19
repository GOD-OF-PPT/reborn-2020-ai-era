import {useState,type Ref} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {routeArt} from './scene-art.ts'
import {Dialog} from './Dialog.tsx'
import {RouteMark} from './RouteMark.tsx'
import {moneyText,reasonText} from './game-text.ts'

export type RouteId=GamePanelProps['features']['workbench']['routes'][number]['id']
const routesCopy:Record<RouteId,{chapter:string;line:string}>={
 a_share:{chapter:'把判断，留给时间',line:'给未来一个仓位，也给生活留一点余地。'},
 ai_video:{chapter:'让日常，成为作品',line:'从手工剪辑开始，让一个想法遇见真实需求。'},
 ai_course:{chapter:'把做过的事，认真教会',line:'先留下案例，再承诺一堂能够交付的课。'},
 api_relay:{chapter:'守住每一次连接',line:'一条小小的线路，连着成本、服务和信任。'},
 deepseek_opportunity:{chapter:'参与时代的一次改变',line:'从技术合作出发，再看清自己拥有的权利。'},
}
export function OpportunityAtlas(p:GamePanelProps&{onRoute:(id:RouteId)=>void;headingRef?:Ref<HTMLHeadingElement>}){
 const [inspecting,setInspecting]=useState<RouteId|null>(null),[failed,setFailed]=useState<readonly RouteId[]>([]),[selection,setSelection]=useState<RouteId>('a_share')
 const routes=p.features.workbench.routes,detail=routes.find(r=>r.id===inspecting),selected=routes.find(r=>r.id===selection)??routes[0]!,index=routes.indexOf(selected)
 const ready=selected.requirements.reasons.length===0&&selected.requirements.preparationReady&&selected.requirements.availableCashFen>=selected.requirements.minimumCashFen
 const turn=(offset:number)=>setSelection(routes[(index+offset+routes.length)%routes.length]!.id)
 return <section className="route-choice-scene" aria-label="选择一条人生路线"><header className="scene-title"><p className="scene-overline">{p.features.workbench.quarter} / 时代的门，刚刚打开</p><h1 ref={p.headingRef} tabIndex={-1}>这一次，你想走哪条路？</h1><p>先选一个念头，再决定把时间和本金放在哪里。</p></header>
 <div className="route-film" aria-label="五条路线电影抉择">
  <div className="route-film-picture" aria-hidden="true" data-route={selected.id}>{!p.textOnly&&!failed.includes(selected.id)?<img key={selected.id} src={routeArt[selected.id]} width={1672} height={941} alt="" decoding="async" onError={()=>setFailed(ids=>ids.includes(selected.id)?ids:[...ids,selected.id])}/>:<RouteMark kind={selected.id}/>}</div>
  <section className="route-film-thought" aria-live="polite" aria-atomic="true"><p className="scene-overline">可能的人生 / 0{index+1}</p><h2>{routesCopy[selected.id].chapter}</h2><p>{routesCopy[selected.id].line}</p><small>{selected.id==='deepseek_opportunity'?'明确架空股权 · 融资资格与他方意愿单独核验':selected.id==='a_share'?'虚构个股模拟 · 判断不保证收益':'先看真实前提，再决定投入'}</small><div className="route-film-actions"><button type="button" className="primary" aria-label={'走进'+selected.name} onClick={()=>p.onRoute(selected.id)}>走进这一幕 <span aria-hidden="true">→</span></button><button type="button" aria-label={'查看'+selected.name+'的准备条件'} onClick={()=>setInspecting(selected.id)}>{ready?'出发前，再看一眼条件':'还要准备什么'} ↗</button></div></section>
  <nav className="route-film-selections" aria-label="翻看五条人生路线"><button type="button" className="route-film-arrow" aria-label="上一条人生路线" onClick={()=>turn(-1)}>←</button>{routes.map((route,i)=><button type="button" key={route.id} aria-label={'聚焦'+route.name} aria-pressed={route.id===selected.id} onClick={()=>setSelection(route.id)}><span aria-hidden="true">0{i+1}</span>{route.name}</button>)}<button type="button" className="route-film-arrow" aria-label="下一条人生路线" onClick={()=>turn(1)}>→</button></nav>
 </div>
 <footer className="scene-quiet-note">也可以保留工作，慢慢选择。翻看不耗行动，本季重点不限制你能经营几项。</footer>
 {detail?<Dialog title={detail.name+' · 出发前的准备'} onClose={()=>setInspecting(null)} className="scene-preparation"><p className="scene-dialog-intro">{routesCopy[detail.id].line}</p><p>{detail.preparation}</p><dl><div><dt>当前自有资金门槛</dt><dd>{moneyText(detail.requirements.minimumCashFen)}</dd></div><div><dt>{detail.accountId==='personal'?'个人':'这项经营的企业'}可花</dt><dd>{moneyText(detail.requirements.availableCashFen)}</dd></div><div><dt>准备材料</dt><dd>{detail.requirements.preparationReady?'已具备或本段无需':'尚待完成'}</dd></div></dl><p>{detail.feedback}</p>{detail.requirements.reasons.map((r,i)=><p className="reason" key={r.id+i}>{reasonText(r.reason)}</p>)}{detail.id==='ai_video'&&detail.futureTool.length?<p>未来工具仍需年代与资格：{detail.futureTool.map(reasonText).join('；')}。2020手工小单不受此影响。</p>:null}{detail.id==='deepseek_opportunity'?<p className="warning-box">生态服务与直接股权分开。现实公开申购未提供；架空融资仍须资格与对方意愿，技术不会自动变成股权。</p>:null}<div className="dialog-actions button-row"><button type="button" onClick={()=>setInspecting(null)}>再想一想</button><button type="button" className="primary" onClick={()=>{setInspecting(null);p.onRoute(detail.id)}}>走进{detail.name}</button></div></Dialog>:null}
 </section>
}
