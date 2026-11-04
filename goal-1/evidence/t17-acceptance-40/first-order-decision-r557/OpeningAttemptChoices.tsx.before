import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {OpeningAttemptView} from './opening-attempt.ts'
import type {OpeningFocus} from './player-thread.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import {addDays} from '../core/calendar.ts'
import './opening-attempt.css'

export type OpeningChoicePanel='offer'|'free'|'next'|'market'
type Props={p:GamePanelProps;attempt:OpeningAttemptView;panel:OpeningChoicePanel;onClose:()=>void;onInspect:()=>void;onMarket:()=>void;onExplore:()=>void;onFocus:(focus:OpeningFocus)=>void;onNavigate:NavigateScene}

/** These are decisions about today's original objects, never a second tutorial state machine. */
export function OpeningAttemptChoices({p,attempt,panel,onClose,onInspect,onMarket,onExplore,onFocus,onNavigate}:Props){
 const first=attempt.firstOrder,request:GamePanelProps['request']=(...args)=>{onClose();p.request(...args)},current={...p,request}
 const overview=panel==='market'?p.features.workbench.researches.find(r=>r.id==='market-overview'):undefined,research=overview?.state,personal=panel==='market'?p.view.accounts.find(a=>a.accountId==='personal'):undefined
 const ui=(label:string,line:string,perform:()=>void)=>{
  const binding=makeSharedAction(p,label,()=>{onClose();perform()},{allowReadOnly:true})
  return <button type="button" key={label} className="opening-next-choice" disabled={binding.disabled} onClick={binding.activate}><strong>{label}</strong><span>{line}</span>{binding.reason?<span className="reason">{binding.reason}</span>:null}<i aria-hidden="true">↗</i></button>
 }
 const title=panel==='offer'?'这封委托，怎样答复？':panel==='free'?'今天，先把时间留给什么？':panel==='market'?'这笔钱，先怎么安排？':'接下来的日子，想怎样继续？'
 return <Dialog title={title} layout={panel==='market'?'direct':'book'} className={'opening-paper opening-attempt-choices'+(panel==='market'?' opening-market-choices':'')} onClose={onClose} footer={<div className="opening-choice-footer"><button type="button" onClick={onClose}>先不决定，留在这里</button><button type="button" className="scene-text-action" onClick={()=>{onClose();onInspect()}}>翻看当前对象的完整记录 ↗</button></div>}>
  {panel==='offer'&&first?<>
   <p className="opening-paper-date">{p.view.date} · 最迟{first.dates.replyBy}答复</p>
   <p>剪一条短片，并整理交付资料。客户报价<strong>{moneyText(first.terms.priceFen)}</strong>。</p>
   <p className="opening-paper-terms">你要留出个人{moneyText(first.terms.costFen)}和本季{first.terms.actionPoints}点；{first.dates.startAt}开工，{first.dates.submitBy}前亲手提交。接下时先预留，开工才付款；客户确认后的实际回款另记。</p>
   <div className="opening-offer-decisions"><CommandButton {...current} kind="StartFirstOrder" payload={{}} label="接下这笔手工单" confirm/><CommandButton {...current} kind="DeclineOffer" payload={{offerId:first.offerId}} label="婉拒这笔报价" confirm/><CommandButton {...current} kind="SkipOffer" payload={{offerId:first.offerId}} label="略过这次委托" confirm/></div>
  </>:null}
  {panel==='free'?<>
   <p>原有工作与约定仍照常。接下来的时间，想留给什么？每次新安排仍由你确认。</p>
   <CommandButton {...current} kind="WorkQuarter" payload={{}} label="保留这一季的工作" confirm><span>保留这一季的工作<small>本季2点 · 按实际在岗日领工资</small></span></CommandButton>
   <CommandButton {...current} kind="StartLifeWork" payload={{kind:'rest',personId:null,reference:null}} label="把七天留给自己" confirm><span>把七天留给自己<small>个人0元 · 本季1点 · 七日后看实际结果</small></span></CommandButton>
   {ui('先翻看模拟市场','只看公开行情，不买股、不占行动。',onMarket)}
   {ui('环顾房间，看看别的可能','作品、人物、生活与五条路都还在。',onExplore)}
  </>:null}
  {panel==='market'?<>
   <div className="opening-market-context"><span>{p.view.date} · 模拟市场</span><p>{personal?<>个人可花 <strong>{moneyText(personal.availableFen)}</strong></>:'个人可花金额仍需查看原账。'}<small>生活与投资，共用这笔钱。</small></p></div>
   <div className="opening-market-decisions">
    {overview&&!research?<CommandButton {...current} kind="ResearchMarket" payload={{definitionId:overview.id}} label="先读公开资料" confirm><span><strong>先读公开资料</strong><small>{moneyText(overview.costFen)} · {overview.actionPoints}点 · 预计{addDays(p.view.date,overview.days)}完成</small><small>整理已知线索，不揭示未来价格，也不自动买入。</small></span></CommandButton>:research?ui('查看这份研究',research.status==='running'?`公开资料正在整理 · ${research.startAt}开始，预计${research.completeAt}完成。`:research.status==='completed'?`公开资料已于${research.completeAt}整理完成；不会因此自动买入。`:'这份研究已中断；已经投入的资源仍按原账保留。',()=>onFocus({kind:'market',runId:p.view.runId,accountId:'personal',entityId:research.id,entityKind:'research'})):null}
    {ui('填写模拟委托','自己选标的、数量、限价和期限，提交前再核对费用。',onMarket)}
    {ui('先留着这笔钱','去看看工作和生活；不买入，也不占行动。',onExplore)}
   </div>
  </>:null}
  {panel==='next'?<>
   <p>{attempt.endpoint}</p>
   <p>这次留下的结果仍在。下面只换眼前关注，不会替你接工作、开业务或下单。</p>
   {attempt.nextChoices.map(choice=>ui(choice.label,choice.line,()=>{if(choice.focus)onFocus(choice.focus);else onNavigate(choice.screen,choice.target)}))}
   {ui('再看看其它可能','先环顾房间，不新增安排。',onExplore)}
  </>:null}
 </Dialog>
}
