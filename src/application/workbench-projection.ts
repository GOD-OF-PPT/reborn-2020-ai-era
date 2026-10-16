import { copyJson } from '../core/json-input.ts'
import { accountPosition,metricsFor } from '../core/ledger.ts'
import { quarterOf,addDays } from '../core/calendar.ts'
import { dayBefore,quarterLimit } from '../core/operations-calendar.ts'
import { marketValuationComplete } from '../core/market-projection.ts'
import { projectWorld } from '../core/world-projection.ts'
import { projectCashForecast } from './cash-forecast.ts'
import { projectFirstOrder } from './first-order.ts'
import { operatingAccruals } from '../core/operations-accrual.ts'
import type { GameRun } from '../core/run-types.ts'
import type { WorldRuntime } from '../core/world.ts'
import type { OperationsCatalog } from '../core/operations-types.ts'
import type { MarketCatalog } from '../core/market-types.ts'

const routeText={a_share:{name:'A股AI股票',preparation:'研究产业链、保留生活储备，使用虚构个股模拟制度。',feedback:'现金、持仓成本、市值与订单分别记录。'},ai_video:{name:'AI短视频',preparation:'2020年可做手工剪辑小单；未来生成工具、素材权利和变现资格另行核验。',feedback:'作品完成后仍需提交、客户验收和回款。'},ai_course:{name:'AI卖课',preparation:'积累已交付案例、教学大纲和答疑容量，等待可用工具与资格。',feedback:'预售形成交付义务；本体验暂未开放招生。'},api_relay:{name:'API中转站',preparation:'准备服务材料，取得供应访问资格、自有资金与维护能力。',feedback:'发布新闻不等于获得API；本体验暂未开放服务经营。'},deepseek_opportunity:{name:'DeepSeek生态与架空股权',preparation:'积累部署/服务案例；生态合作与融资资格分别审查。',feedback:'模型发布不等于股权；本体验暂未开放合同或架空融资。'}} as const

export function projectWorkbench(run:GameRun,world:WorldRuntime,catalog:OperationsCatalog,market:MarketCatalog){
 const date=run.timeline.cursor.date,quarter=quarterOf(date),from=quarter.slice(0,4)+'-'+String((Number(quarter.slice(-1))-1)*3+1).padStart(2,'0')+'-01',end=dayBefore(quarterLimit(date)),first=projectFirstOrder(run)
 const routes=catalog.businesses.map(d=>{const business=run.operations?.businesses.find(b=>b.definitionId===d.id&&b.lifecycle!=='closed'),accountId=business?.accountId??'personal';const reasons=d.capabilities.flatMap(id=>world.capabilityReasons(run,'player',id,date).map(reason=>({kind:'capability' as const,id,reason})));return {id:d.route,...routeText[d.route],definitionId:d.id,businessId:business?.id??null,accountId,lifecycle:business?.lifecycle??'not_started',requirements:{minimumCashFen:d.minCashFen,availableCashFen:accountPosition(run.economy.ledger,accountId).availableFen,preparationKey:d.preparationKey,preparationReady:d.preparationKey===null||run.world?.preparations.some(p=>p.key===d.preparationKey)===true,capabilities:d.capabilities.map(id=>({id,ready:world.capabilityReasons(run,'player',id,date).length===0})),reasons},currentlyPlayable:d.route==='a_share'||d.route==='ai_video',futureTool:d.route==='ai_video'?world.capabilityReasons(run,'player','kling_video',date):[],equity:d.route==='deepseek_opportunity'?world.capabilityReasons(run,'player','deepseek_counterfactual_equity',date):[]}})
 const info=projectWorld(run,world),pendingIds=[info.main,...info.side,...info.mandatoryAndRisk,...info.ordinaryArchive].flatMap(item=>item?[item.id]:[])
 const events=pendingIds.map(id=>{const instance=run.world!.instances.find(i=>i.id===id)!,definition=world.definition(instance.definitionId);return {id,accountId:run.world!.bindings.find(b=>b.id===instance.bindingId)!.accountId,isBlocking:run.timeline.pause?.instanceId===instance.openedBy,title:definition.title,presentation:definition.presentation,classification:definition.classification,createdAt:instance.createdAt,expiresAt:instance.expiresAt,defaultChoiceId:definition.defaultChoiceId,choices:definition.choices.map(c=>({id:c.id,label:c.label,actionPoints:c.actionPoints,costFen:c.costFen,isDefault:c.id===definition.defaultChoiceId}))}})
 const points=run.timeline.pending.filter(e=>e.date>=date&&e.date<=end).map(e=>({date:e.date,id:e.instanceId,kind:e.payload.kind,type:'type' in e.payload?e.payload.type:null})).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))
 const barriers: {date:string;label:string}[]=[]
 if(first.status==='planned')barriers.push({date:first.dates.startAt,label:'首单开始制作'})
 if(first.status==='running')barriers.push({date:first.dates.submitBy,label:'首单完成，等待你提交'})
 if(first.status==='review'||first.status==='delivered')barriers.push({date:first.dates.earliestReviewAt,label:'客户复核与到账反馈'})
 for(const order of run.market?.orders.filter(o=>['pending','partially_filled'].includes(o.status))??[]){const point=market.checkpoints[Math.max(order.eligibleIndex,(run.market?.lastMatchedIndex??-1)+1)];if(point)barriers.push({date:point.date,label:'订单的下一撮合点'})}
 const barrier=barriers.filter(p=>p.date>=date&&p.date<=end).sort((a,b)=>a.date.localeCompare(b.date))[0]
 const unresolvedDelivery=first.status==='awaiting_submission'&&!first.deadlineMissed
 const quarterTarget=barrier?.date??end,next=points.find(p=>p.date>=date)?.date??(date<end?end:addDays(end,1))
 const accruals=operatingAccruals(run,date)
 const finance=run.controlledAccountIds.map(accountId=>{
  const position=accountPosition(run.economy.ledger,accountId),posted=metricsFor(run.economy.ledger,accountId,undefined,from,date),accruedCostFen=accruals.filter(a=>a.accountId===accountId).reduce((sum,a)=>sum+a.amountFen,0),known=marketValuationComplete(run,accountId)
  return {accountId,...position,valuationStatus:known?'current':'data_unavailable',lastKnownInvestmentValueFen:position.investmentValueFen,investmentValueFen:known?position.investmentValueFen:null,netAssetsFen:known?position.netAssetsFen-accruedCostFen:null,incomeFen:posted.incomeFen,postedCostFen:posted.costFen,accruedCostFen,costFen:posted.costFen+accruedCostFen,profitFen:posted.profitFen-accruedCostFen,forecast:projectCashForecast(run,accountId,catalog,market.checkpoints),reservations:run.economy.ledger.reservations.filter(r=>r.accountId===accountId&&r.amountFen>0),obligations:run.economy.ledger.obligations.filter(o=>o.accountId===accountId&&o.remainingFen>0),contracts:run.economy.ledger.contracts.filter(c=>c.accountId===accountId),transactions:run.economy.ledger.transactions.filter(t=>t.lines.some(line=>line.accountId===accountId)).map(t=>({id:t.id,date:t.date,amountFen:t.lines.find(l=>l.accountId===accountId)!.deltaFen,sourceId:t.sourceEventId,businessId:t.businessId,contractId:t.contractId})),metrics:run.economy.ledger.metrics.filter(m=>m.accountId===accountId)}
 })
 return copyJson({quarter,quarterStart:from,quarterEnd:end,atQuarterEnd:date===end&&run.timeline.cursor.phase==='snapshot'&&run.timeline.cursor.priority===Number.MAX_SAFE_INTEGER&&run.timeline.cursor.instanceId==='',pause:run.timeline.pause,firstOrderStatus:first.status,
  routes,events,preparationJobs:run.world!.jobs.map(job=>({id:job.id,title:world.definition(run.world!.instances.find(i=>i.id===job.instanceId)!.definitionId).title,accountId:run.world!.bindings.find(b=>b.id===job.bindingId)!.accountId,startAt:job.startAt,completeAt:job.completeAt,status:job.status})),world:info,sourceLinks:world.pack.sources.filter(s=>info.news.some(n=>n.sourceIds.includes(s.id))).map(s=>({id:s.id,url:s.url,scope:s.scope})),progression:{nextDate:next,quarterTarget,barrierLabel:barrier?.label??null,requiresDelivery:unresolvedDelivery,nextQuarterDate:date===end&&end<'2025-12-31'?addDays(end,1):null},
  finance,
  employment:run.operations?.employment.filter(p=>p.quarter===quarter)??[],researches:market.researches.map(d=>({...d,state:run.market?.researches.find(r=>r.definitionId===d.id)??null})),
  evidence:run.causes.filter(c=>c.visibility==='visible').slice(-20).map(c=>({id:c.id,date:c.date,text:c.visibleSummary,sourceId:c.sourceEventId})),
 })
}
export type WorkbenchProjection=ReturnType<typeof projectWorkbench>
