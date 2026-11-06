import {useState,type Ref} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {routeArt} from './scene-art.ts'
import {Dialog} from './Dialog.tsx'
import {RouteMark} from './RouteMark.tsx'
import {moneyText,reasonText} from './game-text.ts'
import './route-atlas.css'
import './route-preparation.css'
import {routeCurrentChoice,routeChoiceTarget} from './route-current-choice.ts'

export type RouteId=GamePanelProps['features']['workbench']['routes'][number]['id']
const routesCopy:Record<RouteId,{chapter:string;line:string}>={
 a_share:{chapter:'把判断，留给时间',line:'给未来一个仓位，也给生活留一点余地。'},
 ai_video:{chapter:'让日常，成为作品',line:'从手工剪辑开始，让一个想法遇见真实需求。'},
 ai_course:{chapter:'把做过的事，认真教会',line:'先留下案例，再承诺一堂能够交付的课。'},
 api_relay:{chapter:'守住每一次连接',line:'一条小小的线路，连着成本、服务和信任。'},
 deepseek_opportunity:{chapter:'参与时代的一次改变',line:'从技术合作出发，再看清自己拥有的权利。'},
}
const routeJourney:Record<RouteId,{bookmark:string;entry:string;steps:readonly string[]}>={
 a_share:{bookmark:'一次判断',entry:'看看行情与委托',steps:['看看公开资料','写下买卖条件','等成交，再等交收']},
 ai_video:{bookmark:'一份作品',entry:'看看作品与需求',steps:['挑一份作品或需求','制作、交付或发布','看真实反馈与回款']},
 ai_course:{bookmark:'一堂课',entry:'看看课程与学员',steps:['备好案例与样课','招生，兑现每堂课','答疑支持，逐步结算']},
 api_relay:{bookmark:'一条连接',entry:'看看客户与服务',steps:['看供应，谈客户','安排服务与支持','看用量，核账收款']},
 deepseek_opportunity:{bookmark:'一次合作',entry:'看看合作与原协议',steps:['挑一份合作需求','按约交付与支持','核对结算与旧约']},
}
export function OpportunityAtlas(p:GamePanelProps&{onRoute:(id:RouteId)=>void;headingRef?:Ref<HTMLHeadingElement>;onToday?:()=>void}){
 const scope=p.view.runId
 const [storedInspection,setInspecting]=useState<{scope:string;id:RouteId}|null>(null),inspecting=storedInspection?.scope===scope?storedInspection.id:null
 const [failed,setFailed]=useState<readonly RouteId[]>([]),[storedSelection,setSelection]=useState({scope,id:'a_share' as RouteId}),selection=storedSelection.scope===scope?storedSelection.id:'a_share'
 const closing=p.view.phase!=='playing'
 const routes=p.features.workbench.routes,detail=routes.find(r=>r.id===inspecting),selected=routes.find(r=>r.id===selection)??routes[0]!,index=routes.indexOf(selected)
 const current=routeCurrentChoice(selected),entryKnown=routeChoiceTarget(p,selected.id)!==null
 const turn=(offset:number)=>setSelection({scope,id:routes[(index+offset+routes.length)%routes.length]!.id})
 return <section className="route-choice-scene" aria-label="选择一条人生路线"><header className="scene-title"><p className="scene-overline">{closing?'尾声 / 原来的经营':p.features.workbench.quarter+' / 手里的可能'}</p><h1 ref={p.headingRef} tabIndex={-1}>{closing?'回到走过的路，处理原来的事。':'先把哪一个念头，带进生活？'}</h1><p>{closing?'原合同、应收和资产都保留；这一次不再接受新的时代机会。':'先看手里的条件，再走近一件具体的事。'}</p></header>
 <div className="route-film" aria-label="五条路线电影抉择" data-atlas="journeys">
  <div className="route-film-picture" aria-hidden="true" data-route={selected.id}>{!p.textOnly&&!failed.includes(selected.id)?<img key={selected.id} src={routeArt[selected.id]} width={1672} height={941} alt="" decoding="async" onError={()=>setFailed(ids=>ids.includes(selected.id)?ids:[...ids,selected.id])}/>:<RouteMark kind={selected.id}/>}</div>
  <div className="route-film-body" aria-live="polite" aria-atomic="true">
   <section className="route-film-thought"><p className="scene-overline">{closing?'走过的路':current.caption} / 0{index+1} · {selected.name}</p><h2>{closing?'回看'+selected.name:routesCopy[selected.id].chapter}</h2><p>{closing?'原合同、款项与资产，仍在各自的记录里。':current.continuation??routesCopy[selected.id].line}</p><small>{selected.id==='deepseek_opportunity'?'技术合作与明确架空股权分别核条件、另立协议':selected.id==='a_share'?'虚构个股模拟 · 判断不保证收益':'先看真实前提，再决定投入'}</small><div className="route-film-actions"><button type="button" className="primary" disabled={!entryKnown} aria-label={(closing?'翻看原记录':routeJourney[selected.id].entry)+' · '+selected.name} onClick={()=>p.onRoute(selected.id)}>{closing?'翻看原记录':routeJourney[selected.id].entry} <span aria-hidden="true">↗</span></button><button type="button" aria-label={'查看'+selected.name+'的准备条件'} onClick={()=>{setInspecting({scope,id:selected.id})}}>{closing?'核对原条件':'完整条件与玩法'} ↗</button></div>{!entryKnown?<p className="route-current-barrier" role="status">这条路的账户尚不可核，先翻完整条件。</p>:null}</section>
   {!closing?<aside className="route-current-paper" aria-label={selected.name+'的当前条件'} data-state={current.known?current.established?'existing':current.fundsShort?'funds':'starting':'unknown'}><p className="route-current-caption">先看手里的条件</p>{current.known?<><dl><div><dt>{current.capitalLabel}</dt><dd>{moneyText(selected.requirements.minimumCashFen)}</dd></div><div><dt>{selected.accountId==='personal'?'个人可花':'这项经营的企业可花'}</dt><dd>{moneyText(selected.requirements.availableCashFen)}</dd></div></dl><p className="route-current-material">{current.material}</p>{current.fundsShort?<p className="route-current-barrier">尚未达到起步资金门槛</p>:null}{current.barriers.length?<p className="route-current-barrier">{current.barriers.join(' ')}</p>:null}<p className="route-current-note">{current.note}</p></>:<p>当前条件尚不可核，先翻完整条件。</p>}{selected.id==='ai_video'?<p className="route-current-manual">手工剪辑可另看小单；AI工具仍核年代与资格。</p>:null}</aside>:null}
  </div>
  <nav className="route-film-selections" aria-label="翻看五条人生路线"><button type="button" className="route-film-arrow" aria-label="上一条人生路线" onClick={()=>turn(-1)}>←</button>{routes.map((route,i)=><button type="button" key={route.id} aria-label={'聚焦'+route.name} aria-pressed={route.id===selected.id} onClick={()=>setSelection({scope,id:route.id})}><span aria-hidden="true">0{i+1}</span>{routeJourney[route.id].bookmark}</button>)}<button type="button" className="route-film-arrow" aria-label="下一条人生路线" onClick={()=>turn(1)}>→</button></nav>
 </div>
 <footer className="scene-quiet-note route-choice-return"><span>{closing?'只翻阅已有经营，继续原来的事。':<>本季{p.view.budget.available}点可用{p.view.budget.reserved?' · '+p.view.budget.reserved+'点已预留':''}；新的投入仍由你决定。</>}</span>{p.onToday?<button type="button" onClick={p.onToday}>{closing?'回到人生回顾 ↗':'先回到今天，看看生活 ↗'}</button>:null}</footer>
 {detail?<Dialog title={detail.name+' · 完整条件与玩法'} onClose={()=>setInspecting(null)} className="scene-preparation route-preparation-dialog"><section className="route-full-journey" aria-label={detail.name+'的玩法过程'}><h3>{detail.id==='deepseek_opportunity'?'技术合作怎样走':'这条路怎样走'}</h3><ol>{routeJourney[detail.id].steps.map(step=><li key={step}>{step}</li>)}</ol>{detail.id==='ai_video'?<p>2020年可以从手工剪辑开始。</p>:null}</section><p className="scene-dialog-intro">{routesCopy[detail.id].line}</p><p>{detail.preparation}</p><dl><div><dt>当前自有资金门槛</dt><dd>{moneyText(detail.requirements.minimumCashFen)}</dd></div><div><dt>{detail.accountId==='personal'?'个人':'这项经营的企业'}可花</dt><dd>{moneyText(detail.requirements.availableCashFen)}</dd></div><div><dt>准备材料</dt><dd>{detail.requirements.preparationReady?'已具备或本段无需':'尚待完成'}</dd></div></dl><p>{detail.feedback}</p>{detail.requirements.reasons.map((r,i)=><p className="reason" key={r.id+i}>{reasonText(r.reason)}</p>)}{detail.id==='ai_video'&&detail.futureTool.length?<p>未来工具仍需年代与资格：{detail.futureTool.map(reasonText).join('；')}。2020手工小单不受此影响。</p>:null}{detail.id==='deepseek_opportunity'?<p className="warning-box">生态服务与直接股权分开。现实公开申购未提供；架空融资仍须资格与对方意愿，技术不会自动变成股权。</p>:null}<div className="dialog-actions button-row"><button type="button" onClick={()=>setInspecting(null)}>再想一想</button><button type="button" className="primary" disabled={routeChoiceTarget(p,detail.id)===null} onClick={()=>{setInspecting(null);p.onRoute(detail.id)}}>走进{detail.name}</button></div></Dialog>:null}
 </section>
}
