import {useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {StoryProjection} from '../core/story-projection.ts'
import {addDays} from '../core/calendar.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {moneyText} from './game-text.ts'

type Incident=StoryProjection['incidents'][number]
function businessName(p:GamePanelProps,id:string){const b=p.view.operations?.businesses.find(b=>b.id===id);return (b?.route==='ai_course'?'课程工作室':b?.route==='api_relay'?'API中转站':'原业务')+' · '+id.slice(-6)}

/** A payer is an actual bound, controlled business; the account being viewed is not consent. */
export function riskPayers(p:GamePanelProps,c:Incident){
 return p.view.accounts.filter(a=>p.view.operations?.businesses.some(b=>c.businessIds.includes(b.id)&&b.accountId===a.accountId&&b.lifecycle!=='closed'))
}
export function RiskInvestigationChoice({p,incident:c,onFullRecord,children}:{p:GamePanelProps;incident:Incident;onFullRecord:()=>void;children:(open:()=>void)=>ReactNode}){
 const [open,setOpen]=useState(false),payers=riskPayers(p,c)
 const [chosenAccount,setAccount]=useState(payers.length===1?payers[0]!.accountId:'')
 const [resource,setResource]=useState('player-production')
 const account=payers.some(a=>a.accountId===chosenAccount)?chosenAccount:''
 const term=c.taskTerms.investigate!,completeAt=addDays(p.view.date,term.days)
 const name=(id:string)=>{const b=p.view.operations?.businesses.find(b=>b.accountId===id);return b?businessName(p,b.id):'原业务'}
 return <>{children(()=>setOpen(true))}{open?<Dialog title="请人把这封来信查清楚" className="risk-investigation-choice" onClose={()=>setOpen(false)}>
  <p className="risk-letter-heading">一份独立委托 / {c.businessIds.map(id=>businessName(p,id)).join('、')}</p>
  <h3>让记录回答，先不替它下结论。</h3>
  <p>从{p.view.date}实际开工，预计{completeAt}完成。工作费用{moneyText(term.costFen)}，占本季{term.points}点、所选资源{term.days}日。开始不会立刻得到调查结果。</p>
  <label className="field">由哪份原业务账支付<select value={account} onChange={e=>setAccount(e.currentTarget.value)}>{!account?<option value="" disabled>请明确选择实际付款主体</option>:null}{payers.map(a=><option key={a.accountId} value={a.accountId}>{name(a.accountId)} · 可花{moneyText(a.availableFen)}</option>)}</select></label>
  {!payers.length?<p role="alert">当前没有可用的绑定付款主体。请翻看原账和责任，不能改由个人账户代付。</p>:null}
  <label className="field">谁留出这几天<ResourceSelect value={resource} onChange={setResource} options={p.features.story.resources}/></label>
  <p>默认处置时间是{c.deadline}，核查不会延后它。{completeAt>=c.deadline?'预计回信不早于默认处置；原有限停止可能先发生，调查不会复活已取消的支持。':'真实回信到达后，仍需你另行核对并确认。'}原工资、服务费、客户保护和其他排程继续计算。</p>
  <div className="button-row">{account?<CommandButton {...p} kind="StartRiskTask" payload={{incidentId:c.id,kind:'investigate',accountId:account,resourceId:resource}} label="核对这份独立委托" confirm primary/>:null}<button type="button" onClick={()=>{setOpen(false);onFullRecord()}}>翻看原授权、全部责任与退出选择</button></div>
 </Dialog>:null}</>
}

/** Reading every public signal/evidence is optional; it never marks the incident handled. */
export function RiskLetter({p,incident:c,index,count,onNext}:{p:GamePanelProps;incident:Incident;index:number;count:number;onNext:()=>void}){
 const [open,setOpen]=useState(false),job=c.jobs.investigate
 const names=c.businessIds.map(id=>businessName(p,id)).join('、')
 return <><aside className="risk-scene-letter" aria-label="眼前这封来信">
  <div className="risk-letter-heading"><span>{job?.status==='completed'?'独立回信':job?.status==='running'?'委托已寄出':'桌上的来信'} / 本局虚构</span><span>{index+1} / {count}</span></div>
  <h2>{names}</h2>
  <p>{c.openedAt}留下的记录 · 默认处置{c.deadline}</p>
  {job?<p>{job.status==='completed'?'核查已实际完成':job.status==='running'?'核查仍在进行':'原核查已中断'} · {job.startAt}—{job.completeAt} · 已付{moneyText(job.costFen)} / {job.actionPoints}点。</p>:<p>这仍是一条待核实的信号。费用、原因和实际控制，要分别找证据。</p>}
  <div className="risk-letter-links"><button type="button" onClick={()=>setOpen(true)}>展开这封信的公开记录 ↗</button>{count>1?<button type="button" onClick={onNext}>翻到下一封来信 →</button>:null}</div>
 </aside>{open?<Dialog title={names+' · 来信与独立回信'} className="risk-letter-records" onClose={()=>setOpen(false)}>
  <p>这里只展示当前已经保存的公开记录。阅读不确认评估，也不承担新的付款或权限。</p>
  <h3>原信号</h3>{c.signals.map(s=><article key={s.id}><h4>{s.date} / {s.source==='system_report'?'系统自报':'独立来源信号'}</h4><p>{s.text}</p></article>)}
  <h3>实际独立核查</h3>{c.evidence.length?c.evidence.map(e=><article key={e.id}><h4>{e.date} / 独立记录</h4><p>{e.text}</p></article>):<p>还没有实际完成的独立回信。</p>}
  <p>本案独立工作已付{moneyText(c.paidWorkCostFen)}；已记异常费用{moneyText(c.knownCostFen)}，其中未付{moneyText(c.unpaidKnownCostFen)}；未核实处理费已付{moneyText(c.unverifiedFeePaidFen)}。停止自报不等于恢复，原账与旧交付继续保留。</p>
 </Dialog>:null}</>
}
