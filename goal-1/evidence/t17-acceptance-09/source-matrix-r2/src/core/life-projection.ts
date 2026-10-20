import {copyJson} from './json-input.ts'
import {accountFunds,type LedgerState} from './ledger.ts'
import {MONEY_LIMIT} from './money.ts'
import {isoDate,addDays} from './calendar.ts'
import {requireRule} from './errors.ts'
import {lifeOf,lifeId,lifePerson,personKnown,personAvailable,workReferences,relationshipAt,jobTerms} from './life-state.ts'
import type {GameRun} from './run-types.ts'
import type {ContentPack} from './content-types.ts'
import type {LifeRuntime} from './life.ts'

const amount=(n:bigint)=>n>=-BigInt(MONEY_LIMIT)&&n<=BigInt(MONEY_LIMIT)?Number(n):null
const total=(values:readonly number[])=>amount(values.reduce((s,n)=>s+BigInt(n),0n))
const samples=(ids:readonly string[])=>ids.length<=2?[...ids]:[ids[0]!,ids.at(-1)!]

/** Actual cash only. Large valid gross flows remain explicitly unrepresentable, never clamped to zero. */
export function projectPersonalYear(ledger:LedgerState,year:number,through:string){
 requireRule(Number.isInteger(year)&&year>=2020&&year<=2025,'LIFE_REVIEW_YEAR_OUTSIDE_TIMELINE');isoDate(through)
 const from=year+'-01-01',end=year+'-12-31';requireRule(through>=from&&through<=end,'LIFE_REVIEW_PERIOD_MISMATCH')
 requireRule(through<=ledger.asOf,'LIFE_REVIEW_FUTURE_PERIOD')
 const openingIds=new Set(ledger.receipts.filter(r=>r.kind==='opening_cash'&&r.accountId==='personal').flatMap(r=>{const op=JSON.parse(r.signature);return op.date===from?[r.id]:[]}))
 let opening=0n,closing=0n,received=0n,spent=0n;const ids:string[]=[]
 for(const t of ledger.transactions){
  const delta=t.lines.filter(l=>l.accountId==='personal').reduce((s,l)=>s+BigInt(l.deltaFen),0n)
  if(t.date<=through)closing+=delta
  if(t.date<from)opening+=delta
  else if(t.date<=through){if(openingIds.has(t.id))opening+=delta;else if(delta!==0n){if(delta>0n)received+=delta;else spent-=delta;ids.push(t.id)}}
 }
 requireRule(opening+received-spent===closing,'LIFE_REVIEW_CASH_NOT_RECONCILED')
 const values={openingFen:amount(opening),receivedFen:amount(received),spentFen:amount(spent),closingFen:amount(closing)}
 return {...values,from,through,overflow:Object.values(values).some(v=>v===null),transactionCount:ids.length,sourceTransactionIds:samples(ids),sourcesAreSamples:ids.length>2}
}

export function projectLife(run:GameRun,runtime:LifeRuntime,world:ContentPack){
 const s=lifeOf(run),date=run.timeline.cursor.date,currentYear=Number(date.slice(0,4)),lastReviewYear=Math.min(2025,currentYear)
 const sceneJob=s.jobs.find(j=>j.kind==='workspace'&&j.status==='completed'&&j.result==='workspace_ready')??null
 const lastRest=s.jobs.filter(j=>j.kind==='rest'&&j.status==='completed').at(-1)??null
 const people=runtime.catalog.people.map(p=>{
  const known=personKnown(run,p.id,date),relation=relationshipAt(run,p.id,date),calendar=known?runtime.catalog.busy.filter(b=>b.personId===p.id&&b.from.slice(0,4)===date.slice(0,4)).map(b=>({from:b.from,to:b.to,text:b.startText})):[]
  const busy=calendar.find(b=>b.from<=date&&date<b.to)??null
  return {id:p.id,name:p.name,role:p.role,known,goal:known?p.goal:'这段联系还没有实际前提；可以先继续自己的工作与准备。',boundary:known?p.boundary:'尚不能把这位人物当作已经建立的合作。',calendar,busy,relationship:{stage:relation.stage,sharedJobIds:relation.sharedJobIds,keptPromiseIds:relation.keptPromiseIds,missedPromiseIds:relation.missedPromiseIds,historicalSourceIds:relation.historicalSourceIds},
   work:{kind:p.work,...runtime.catalog.work[p.work]},promiseTerms:{title:p.promiseTitle,costFen:p.promiseCostFen,days:p.promiseDays,actionPoints:1},references:known?workReferences(run,p.id,date):[],
   jobs:s.jobs.filter(j=>j.personId===p.id),promises:s.promises.filter(o=>o.personId===p.id),availableToday:known&&personAvailable(p.id,date,addDays(date,1)),
  }
 })
 const years=Array.from({length:Math.max(0,lastReviewYear-2019)},(_,i)=>2020+i).map(year=>{
  const from=year+'-01-01',through=year===currentYear?date:year+'-12-31',money=projectPersonalYear(run.economy.ledger,year,through)
  const salary=run.operations?.payroll.filter(p=>p.kind==='salary'&&p.amountFen>0&&p.through>=from&&p.through<=through)??[]
  const paid=s.jobs.filter(j=>j.startAt>=from&&j.startAt<=through),completed=s.jobs.filter(j=>j.status==='completed'&&j.completeAt>=from&&j.completeAt<=through),interrupted=s.jobs.filter(j=>j.status==='interrupted'&&j.releasedAt!==null&&j.releasedAt>=from&&j.releasedAt<=through)
  const promises=s.promises.filter(p=>p.offeredAt>=from&&p.offeredAt<=through).map(p=>({...p,status:p.resolvedAt!==null&&p.resolvedAt<=through?p.status:p.acceptedAt!==null&&p.acceptedAt<=through?'accepted' as const:'offered' as const}))
  const worldChanges=run.world?.anchors.filter(a=>a.happenedAt>=from&&a.happenedAt<=through).map(a=>({id:a.id,date:a.happenedAt,title:world.anchors.find(d=>d.id===a.id)?.title??a.id,sourceIds:world.anchors.find(d=>d.id===a.id)?.sourceIds??[],sources:world.sources.filter(s=>world.anchors.find(d=>d.id===a.id)?.sourceIds.includes(s.id)).map(s=>({id:s.id,url:s.url,scope:s.scope})),causeId:a.causeId}))??[]
  const facts:{id:string;date:string;kind:string;text:string;sourceIds:string[]}[]=[]
  if(money.transactionCount>0)facts.push({id:lifeId('cash-year',String(year)),date:through,kind:'money',text:'个人现金流按原始实际交易核对；转移、工资和经营现金不冒充同一种利润。',sourceIds:money.sourceTransactionIds})
  if(salary.length)facts.push({id:lifeId('salary-year',String(year)),date:salary.at(-1)!.through,kind:'salary',text:'按实际在岗日期，收到'+salary.length+'次工资。',sourceIds:samples(salary.flatMap(p=>p.operationId?[p.operationId]:[]))})
  for(const a of worldChanges)facts.push({id:a.causeId,date:a.date,kind:'world',text:a.title+'已发生；发布事实不等于业务收益或访问资格。',sourceIds:[a.id,a.causeId]})
  for(const j of completed)facts.push({id:lifeId('result',j.id),date:j.completeAt,kind:'life',text:(j.personId?lifePerson(j.personId).name+' · ':'')+jobTerms(j.kind,j.personId).title+'已实际完成。',sourceIds:[j.id,j.originCommandId]})
  for(const p of promises.filter(p=>p.resolvedAt!==null&&['fulfilled','missed','npc_declined'].includes(p.status)))facts.push({id:lifeId('review-promise',p.id),date:p.resolvedAt!,kind:'promise',text:lifePerson(p.personId).name+' · '+(p.status==='fulfilled'?'原约定通过实际工作兑现。':p.status==='missed'?'原约定到期未完成，失约与已发生成本保留。':'对方按自己的计划撤回未接受邀请，不记玩家失约。'),sourceIds:[p.id,p.resolutionSourceId!]})
  const publication=run.story?.linzhou
  if(publication?.publishedAt&&publication.publishedAt>=from&&publication.publishedAt<=through&&publication.publicationSourceId)facts.push({id:publication.publicationSourceId,date:publication.publishedAt,kind:'local_history',text:publication.branch==='open'?'本局林舟工具实际走向独立开放，其他领域没有被全部重写。':'本局保留林舟工具封闭/未参与的默认路径，其他经营仍可继续。',sourceIds:[publication.publicationSourceId]})
  const important=facts.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)).slice(0,5)
  const paidFen=total(paid.map(j=>j.costFen)),salaryFen=total(salary.map(p=>p.amountFen))
  return {year,from,through,isCompleteYear:through===year+'-12-31',money,salaryReceivedFen:salaryFen,salaryPayments:salary.length,paidLifeCostFen:paidFen,overflow:money.overflow||paidFen===null||salaryFen===null,
   priorities:s.priorities.filter(g=>g.year===year&&g.date<=through),completedJobs:completed,interruptedJobs:interrupted,promises,worldChanges,important,
   people:people.map(p=>({id:p.id,name:p.name,relationship:relationshipAt(run,p.id,through).stage})),
  }
 })
 return copyJson({classification:'fictional' as const,asOf:date,currentYear,canPlanCurrentYear:run.phase==='playing'&&currentYear<=2025,personalAvailableFen:accountFunds(run.economy.ledger,'personal').availableFen,
  priority:s.priorities.filter(g=>g.year===currentYear).at(-1)?.priority??'unchanged',work:runtime.catalog.work,people,jobs:s.jobs,promises:s.promises,
  scene:{workspaceCompleted:sceneJob!==null,workspaceJobId:sceneJob?.id??null,workspaceCompletedAt:sceneJob?.completeAt??null,workspaceCostFen:sceneJob?.costFen??0,lastRestCompletedAt:lastRest?.completeAt??null},years,
  queued:s.promises.filter(p=>p.status==='accepted').map(p=>({id:p.id,personId:p.personId,title:lifePerson(p.personId).name+' · '+lifePerson(p.personId).promiseTitle,deadline:p.deadline,costFen:p.costFen,days:p.days,actionPoints:1,jobId:s.jobs.find(j=>j.promiseId===p.id&&j.status==='running')?.id??null})).sort((a,b)=>a.deadline.localeCompare(b.deadline)||a.id.localeCompare(b.id)),
 })
}
export type LifeProjection=ReturnType<typeof projectLife>
