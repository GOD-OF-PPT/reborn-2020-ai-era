import type {GamePanelProps} from './game-types.ts'
import type {MarketSceneProgress} from './market-scene-progress.ts'
import type {DeepseekSceneProgress} from './deepseek-scene-progress.ts'

export function MarketRecordSwitch({p,progress,onSelect}:{p:GamePanelProps;progress:MarketSceneProgress;onSelect:(id:string)=>void}){
 if(!progress.entityId)return null
 const m=p.features.market,labels=new Map<string,string>()
 for(const [index,o] of m.orders.entries())labels.set(o.id,(o.status==='planned'?'计划':'委托')+(index+1)+' · '+(m.stocks.find(s=>s.symbol===o.symbol)?.name??o.symbol)+' · '+o.submittedAt+(o.status==='planned'?'写下':'提交'))
 for(const s of m.settlements)labels.set(s.id,(s.kind==='sale'?'卖款交收':'模拟分红')+' · '+s.dueAt)
 for(const r of m.researches)labels.set(r.id,'个人公开研究 · '+r.startAt)
 for(const pos of m.positions)labels.set(pos.id,'当前持仓 · '+(m.stocks.find(s=>s.symbol===pos.symbol)?.name??pos.symbol))
 return <label className="scene-record-switch"><span>桌上这份判断 <small>阅读不产生交易</small></span><select aria-label="选择当前原市场事项" value={progress.entityId} onChange={e=>onSelect(e.target.value)}>{progress.entityIds.map(id=><option key={id} value={id}>{labels.get(id)??'原市场记录'}</option>)}</select></label>
}

export function DeepseekRecordSwitch({p,progress,onSelect}:{p:GamePanelProps;progress:DeepseekSceneProgress;onSelect:(id:string)=>void}){
 const d=p.features.deepseek
 if(!d)return null
 const labels=new Map<string,string>()
 const owner=progress.entity?(progress.entity.accountId==='personal'?'个人账户':p.features.workbench.routes.find(r=>r.accountId===progress.entity!.accountId)?.name??'原生态企业账户'):'参与主体仍由你选择'
 const rows=(items:readonly {id:string}[],name:string)=>items.forEach((item,index)=>labels.set(item.id,name+' '+(index+1)))
 rows(d.contracts,'生态合作');rows(d.deliveries,'生态履约应收');rows(d.invitations,'架空邀请');rows(d.negotiations,'架空条款');rows(d.agreements,'架空持仓');rows(d.exits,'架空退出');rows(d.governance,'原权利提案');rows(d.preparations,'实际准备');rows(d.adapters,'原用途适配');rows(d.outreaches,'实际需求研究');rows(d.leads,'原客户需求');rows(d.businesses,'原主体')
 return <div className="scene-record-switch"><span className={progress.source==='counterfactual-equity'?'encounter-counterfactual':''}>{progress.source==='counterfactual-equity'?'明确架空 / 原权益事项':'生态服务 / 原合作事项'}<small>{owner} · 合作与拥有分别决定</small></span>{progress.entityId?<select aria-label="选择当前原生态或架空事项" value={progress.entityId} onChange={e=>onSelect(e.target.value)}>{progress.entityIds.map(id=><option key={id} value={id}>{labels.get(id)??'原合作记录'}</option>)}</select>:null}</div>
}
