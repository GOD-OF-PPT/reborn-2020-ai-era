import {useState,type Ref} from 'react'
import {Dialog} from './Dialog.tsx'
import {ScreenBook} from './ScreenBook.tsx'
import type {GamePanelProps} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {CommandButton} from './CommandButton.tsx'
import {PersonPortrait} from './PersonPortrait.tsx'
import {SceneLifeMoment} from './SceneLifeMoment.tsx'
import {sceneThreads} from './scene-thread-notes.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText,playableThrough} from './game-text.ts'

type Props=GamePanelProps&{
 screen:Screen;headingRef:Ref<HTMLHeadingElement>;personId:LifePerson
 onPerson:(id:LifePerson)=>void;onOpen:(screen?:Screen)=>void
 onPeople:()=>void;onYear:()=>void;onNavigate:(screen:Screen)=>void
 receipt:string|null;onDismissReceipt?:()=>void
}
const stories:Record<Exclude<Screen,'room'|'routes'>,{overline:string;title:string;line:string;open:string}>={
 quarter:{overline:'这一季 / 把日子重新握在手里',title:'从眼前的一件事开始。',line:'工作、一个小单，或者留给自己的时间。你不必同时抓住所有机会。',open:'翻开本季日历'},
 market:{overline:'窗前 / 判断与等待',title:'把生活留好，再看远方。',line:'记忆不是明天的价格。一次研究、一个仓位，都要留下足够的余地。',open:'看看行情与自己的仓位'},
 video:{overline:'街角 / 有人需要的作品',title:'让一个念头，被人看见。',line:'2020年的第一步可以只是手工剪辑。制作、交付和客户回款，各有自己的时刻。',open:'去安排一份作品'},
 course:{overline:'开课之前 / 值得交付的改变',title:'先把一件事做过，再认真教会。',line:'案例、样课和答疑，都是要亲自兑现的承诺。预售的钱还属于尚待完成的课。',open:'筹备课程与已经答应的课'},
 relay:{overline:'灯还亮着 / 每一次连接',title:'服务别人，也守住自己的边界。',line:'供应、客户和一笔笔用量，把这门生意连在一起。充值还不是利润。',open:'查看供应、客户与服务'},
 deepseek:{overline:'天将亮时 / 参与一种可能',title:'从真正的合作开始。',line:'技术服务、融资资格和拥有的权利，是不同的事。生态合作不会自动变成股权。',open:'寻找合作与核对参与条件'},
 life:{overline:'眼前生活 / 也给人留一点时间',title:'这一次，别只记得赚钱。',line:'有些选择不会变成利润，却会留下真实相处过的日子。',open:'翻看生活与已经答应的事'},
 memory:{overline:'书架旁 / 前世片段',title:'有些方向，依稀还记得。',line:'把趋势记在心里，把答案留给这一次的经历。阅读不会替你推进时间。',open:'翻开记忆与已经发生的新闻'},
 finance:{overline:'夜深了 / 算清自己的余地',title:'知道还剩多少，也记得欠着什么。',line:'现金、预款、持仓和股权，各有自己的去处。回顾不会把义务抹掉。',open:'摊开账本与本机存档'},
 story:{overline:'风向有变 / 留下自己的判断',title:'改变过什么，又要守住什么？',line:'把已经发生的事、尚待核实的信号和自己的权利分开看。停止不等于已经恢复。',open:'查看变化与需要面对的事'},
 routines:{overline:'日常还在继续 / 已确认的安排',title:'让答应过的事，有序发生。',line:'只有你确认过的范围才能执行。新的季度，仍要重新看看条件。',open:'翻看例行草稿与待办'},
}

function Choice({title,line,label,onClick}:{title:string;line:string;label:string;onClick:()=>void}){
 return <button type="button" className="scene-choice" onClick={onClick} aria-label={label}><span className="scene-choice-overline">一个念头</span><strong data-book-chapter={title}>{title}</strong><span className="scene-choice-line">{line}</span><span className="scene-choice-end">{label}<span aria-hidden="true">↗</span></span></button>
}
function Action({p,kind,payload,title,line,label}:{p:GamePanelProps;kind:string;payload:unknown;title:string;line:string;label:string}){
 return <CommandButton {...p} kind={kind} payload={payload} label={label} confirm className="scene-action"><span className="scene-choice-overline">由你决定</span><strong data-book-chapter={title}>{title}</strong><span className="scene-choice-line">{line}</span><span className="scene-choice-end">{label}<span aria-hidden="true">→</span></span></CommandButton>
}

function sceneCommitmentCount(p:GamePanelProps){
 const f=p.features,w=f.workbench
 return sceneThreads(f).length+w.events.filter(e=>e.presentation!=='ordinary'||e.isBlocking).length+
 w.finance.reduce((n,a)=>n+a.obligations.filter(o=>o.remainingFen>0&&o.date<=p.view.date).length+(a.protectionShortfallFen>0||a.commitmentShortfallFen>0?1:0),0)+(w.pause?1:0)
}

/** Known urgent facts stay outside the optional operation sheet. No facts are invented here. */
export function SceneAttention({p,onOpen}:{p:GamePanelProps;onOpen:(screen:Screen,accountId?:string)=>void}){
 const [open,setOpen]=useState(true)
 const w=p.features.workbench,short=w.finance.filter(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0)
 const due=w.finance.flatMap(a=>a.obligations.filter(o=>o.remainingFen>0&&o.date<=p.view.date).map(o=>({...o,accountId:a.accountId})))
 const forced=w.events.filter(e=>e.presentation!=='ordinary'||e.isBlocking)
 return short.length||due.length||forced.length||w.pause?<><button type="button" className="attention-pocket" onClick={()=>setOpen(true)}>有{short.length+due.length+forced.length+(w.pause?1:0)}件事需要面对 <span>翻开来信 →</span></button>{open?<Dialog title="不能略过的事" onClose={()=>setOpen(false)}><aside className="scene-attention" aria-label="不能略过的事">
  {short.map(a=><div role="alert" key={a.accountId}><strong>{a.accountId==='personal'?'个人':w.routes.find(r=>r.accountId===a.accountId)?.name??'企业'}承诺资金存在缺口 · {moneyText(Math.max(a.protectionShortfallFen,a.commitmentShortfallFen))}</strong><button type="button" onClick={()=>onOpen('finance',a.accountId)}>查看原账与责任</button></div>)}
  {due.map(o=><div role="alert" key={o.id}><strong>{o.accountId==='personal'?'个人':w.routes.find(r=>r.accountId===o.accountId)?.name??'企业'}到期未付 · {moneyText(o.remainingFen)} · {o.date}</strong><button type="button" onClick={()=>onOpen('quarter',o.accountId)}>处理这笔义务</button></div>)}
  {w.pause&&!forced.some(e=>e.isBlocking)?<div role="alert"><strong>日子在这里停了一下 · {w.progression.barrierLabel??'有一件需要你决定的事'}</strong><button type="button" onClick={()=>onOpen(w.pause?.reason==='STORY_RISK_DECISION_PENDING'?'story':'quarter')}>面对这件事</button></div>:null}
  {forced.map(e=><section className="scene-event-letter" key={e.id}><p className="scene-overline">眼前，多了一种选择 / {e.classification==='historical'?'史实节点':'本局模拟'}</p><h2>{e.title}</h2><p>{e.createdAt}出现 · {e.expiresAt}前决定。不回应时：{e.choices.find(c=>c.isDefault)?.label}。</p><div className="scene-event-options">{e.choices.map(choice=><CommandButton {...p} key={choice.id} kind="ChooseEvent" payload={{instanceId:e.id,choiceId:choice.id}} label={choice.label} confirm className="scene-event-action"><strong>{choice.label}</strong><span>安排需要{choice.actionPoints}点 · 确定费用{moneyText(choice.costFen)}</span><span className="scene-choice-end">核对这个决定 <span aria-hidden="true">→</span></span></CommandButton>)}</div>{e.isBlocking?<CommandButton {...p} kind="DeferEventDecision" payload={{instanceId:e.id}} label="暂缓，按期限默认" confirm/>:null}</section>)}
 </aside></Dialog>:null}</>:null
}

export function NarrativeScene(p:Props){
 const {view,features:f}=p,w=f.workbench,first=f.firstOrder
 const copy=stories[p.screen as Exclude<Screen,'room'|'routes'>]
 const person=f.life.people.find(person=>person.id===p.personId)??f.life.people[0]!
 const canAdvance=(view.date<playableThrough||view.date===playableThrough&&!w.atQuarterEnd)&&!w.progression.requiresDelivery&&w.pause===null
 const next=canAdvance?(w.progression.nextQuarterDate??playableAdvanceDate(w,view.date,w.progression.nextDate)):null
 const research=w.researches.find(r=>r.id==='market-overview')
 const accepted=person.promises.find(o=>o.status==='accepted'),offered=person.promises.find(o=>o.status==='offered'),running=person.jobs.find(j=>j.status==='running')
 const shared=person.jobs.find(j=>j.kind!=='promise_keep'&&j.status==='completed'&&j.startAt>=w.quarterStart)
 const personChoice=running?<Choice title="把这段相处，认真走完" line={`${running.startAt}—${running.completeAt}，已经开始，仍待实际完成。`} label={'翻看与'+person.name+'的实际记录'} onClick={p.onPeople}/>:accepted?<Action p={p} kind="FulfillLifePromise" payload={{promiseId:accepted.id}} title="答应过的事，留出日子去做" line={`个人${moneyText(accepted.costFen)} · ${person.promiseTerms.actionPoints}点 · ${accepted.days}日，须在${accepted.deadline}前实际完成。`} label={'核对并兑现与'+person.name+'的约定'}/>:offered?<Action p={p} kind="AcceptLifePromise" payload={{promiseId:offered.id,consent:true}} title="给这项邀请，一个明确答复" line={`现在只是接受；以后仍需个人${moneyText(offered.costFen)}、${person.promiseTerms.actionPoints}点和${offered.days}日，在${offered.deadline}前完成。`} label={'核对'+person.name+'的邀请'}/>:shared?<Choice title="这一季，已经有相处过的日子" line={`${shared.completeAt}实际完成；共同经历和对方自己的选择，都留在原记录里。`} label={'翻看与'+person.name+'的实际记录'} onClick={p.onPeople}/>:<Action p={p} kind="StartLifeWork" payload={{kind:person.work.kind,personId:person.id,reference:person.id==='tang-ying'?null:person.references[0]??null}} title={'和'+person.name+'留下一段共同经历'} line={`个人${moneyText(person.work.costFen)} · ${person.work.points}点 · ${person.work.days}日。对方有自己的日程与意愿。`} label={'核对与'+person.name+'的共同活动'}/>
 const personalWork=f.life.jobs.filter(j=>j.personId===null&&j.status==='running'),commitmentCount=sceneCommitmentCount(p)
 const firstChoice=first.status==='available'?<Action p={p} kind="StartFirstOrder" payload={{}} title="接下一笔手工小单" line={`制作预算${moneyText(first.terms.costFen)}，${first.terms.actionPoints}点；先核对开工与交付日期，再接受。`} label="核对这笔手工第一单"/>:first.status==='awaiting_submission'?<Action p={p} kind="SubmitDelivery" payload={{contractId:first.contractId}} title="把完成的作品交给客户" line="作品已经完成。提交后仍要等客户复核，回款不会提前发生。" label="核对并提交这份作品"/>:['planned','running'].includes(String(first.status))?<Choice title={first.status==='planned'?'这份作品，已排进日历':'把这一份作品认真做完'} line={first.status==='planned'?`${first.dates.startAt}实际开工，${first.dates.submitBy}前完成；此刻还没有交付和回款。`:`${first.dates.submitBy}前完成并提交；当前已发生成本${moneyText(first.result.directCostFen)}。完成以后还要交给客户。`} label="核对这笔小单的日历" onClick={()=>p.onOpen('quarter')}/>:['review','delivered'].includes(String(first.status))?<Choice title="作品已经交出，等下一处反馈" line={`最早${first.dates.earliestReviewAt}客户复核。复核、验收和实际到账还要分别核对，未到账不能叫回款。`} label="看看客户复核与收款记录" onClick={()=>p.onOpen('quarter')}/>:null
 return <section className={'narrative-scene narrative-'+p.screen} aria-label="场景中的选择"><header className="scene-title"><p className="scene-overline">{w.quarter} / {copy.overline}</p><h1 ref={p.headingRef} tabIndex={-1}>{p.screen==='quarter'&&w.atQuarterEnd?'这一季，你留下了什么？':copy.title}</h1><p>{p.screen==='quarter'&&w.atQuarterEnd?'已经发生的回款、成本和经历，留在这一季。旧承诺还在，下一季的安排仍由你决定。':copy.line}</p></header>
  {p.screen==='life'?<div className="scene-people" aria-label="你的长期联系">{f.life.people.map(person=><button type="button" key={person.id} aria-label={'看看'+person.name} aria-pressed={person.id===p.personId} onClick={()=>p.onPerson(person.id)}><PersonPortrait personId={person.id} name={person.name} revealed={person.known} textOnly={p.textOnly===true}/><span>{person.name}<small>{person.known?'已经相识':'还未形成联系'}</small></span></button>)}</div>:null}
  {p.screen==='life'&&!p.receipt?<figure className="scene-person-focus"><PersonPortrait personId={person.id} name={person.name} revealed={person.known} textOnly={p.textOnly===true} feature/><figcaption><strong>{person.name}</strong><span>{person.known?person.role:'这段联系，还没有实际前提。'}</span><p>{person.goal}</p><small>{person.boundary}</small></figcaption></figure>:null}
  <ScreenBook choiceNavigation key={p.screen+':'+(p.screen==='life'?p.personId:'')+':'+(p.receipt??'choosing')} label="眼前的选择" className="scene-story-book">

  {p.screen==='life'?<><SceneLifeMoment p={p} person={person}/>{personalWork.map(j=><section className="scene-life-moment" key={j.id}><h2>{j.kind==='promise_keep'?'约定工作':f.life.work[j.kind].title}，还在进行。</h2><p>{j.startAt}—{j.completeAt} · 已付{moneyText(j.costFen)} / 已耗{j.actionPoints}点。实际完成后才改变生活记录与场景。</p><CommandButton {...p} kind="InterruptLifeWork" payload={{jobId:j.id}} label="停止这次生活工作，保留已付成本" confirm/></section>)}</>:null}
  {p.screen==='life'&&sceneThreads(f).length>0?<section className="scene-person-voice"><h3>{person.name}在意的事</h3><p>{person.goal}</p><small>{person.boundary}</small></section>:null}
  {p.screen==='quarter'&&w.quarter==='2020-Q1'&&first.result.paymentFen>0?<aside className="scene-earned"><span>这笔小单，客户已经付了款。</span><strong>{moneyText(first.result.paymentFen)}</strong><p>实际制作成本{moneyText(first.result.directCostFen)} · 本单净额{moneyText(first.result.netOrderFen)}</p><small>工资和浮盈没有算进这笔净额。</small></aside>:null}
  <div className="scene-choices" aria-label="这一幕可以做的事">
   {p.screen==='quarter'&&w.atQuarterEnd?<><Choice title="回看这一季真实留下的记录" line="工作和经营的收入、实际成本与未结责任，各有自己的来处。" label="翻看本季实际记录" onClick={()=>p.onOpen('quarter')}/><Choice title="下一季，还想走哪条路？" line="可以继续，也可以调整。进入下一季不会自动替你接受工作、交易或融资。" label="再看看眼前的机会" onClick={()=>p.onNavigate('routes')}/></>:p.screen==='quarter'?<>{w.employment.some(plan=>plan.segments.some(segment=>segment.to===null))?<Choice title="把余下的时间，留给生活" line="本季工作已经确认。工资按真实在岗日到账，余下的行动仍由你安排。" label="看看生活里的人与事" onClick={()=>p.onNavigate('life')}/>:<Action p={p} kind="WorkQuarter" payload={{}} title="把这一季的工作留好" line="通常占本季2点。工资仍按实际在岗日期，在月末到账。" label="核对本季工作安排"/>}{firstChoice}<Choice title="给时间留另一种可能" line="学习、准备、已有经营与生活，可以按真实预算组合。" label={copy.open} onClick={()=>p.onOpen()}/></>:null}
   {p.screen==='video'?<>{firstChoice}<Choice title="从一份作品开始" line={w.routes.find(r=>r.id==='ai_video')?.preparation??copy.line} label={copy.open} onClick={()=>p.onOpen()}/></>:null}
   {p.screen==='market'?<>{research&&!research.state?<Action p={p} kind="ResearchMarket" payload={{definitionId:research.id}} title="先把产业线索理一理" line={`${research.actionPoints}点 · ${moneyText(research.costFen)} · ${research.days}日。研究不揭示未来价格。`} label="核对公开研究安排"/>:null}<Choice title="再给判断一个仓位" line="查看模拟个股、委托与交收，再决定是否投入。看到新闻不能按旧价买入。" label={copy.open} onClick={()=>p.onOpen()}/></>:null}
   {p.screen==='life'?<>{personChoice}<Action p={p} kind="StartLifeWork" payload={{kind:'rest',personId:null,reference:null}} title="把七天留给自己" line={`个人${moneyText(f.life.work.rest.costFen)} · ${f.life.work.rest.points}点 · ${f.life.work.rest.days}日。休整不会返还行动或增加收益。`} label="核对这次休整"/><Choice title="翻看答应过的事" line="已接受的约定不会因为离开页面消失。也可以回看已经发生的年度记录。" label="打开人物与原约定" onClick={p.onPeople}/></>:null}
   {!['quarter','video','market','life'].includes(p.screen)?<><Choice title={p.screen==='course'?'先备好值得交付的课':p.screen==='relay'?'把一次服务认真安排好':p.screen==='deepseek'?'先看看实际合作的前提':p.screen==='memory'?'翻开那些模糊的片段':p.screen==='finance'?'摊开每一笔账':p.screen==='story'?'先把事实看清': '看看已经确认过的安排'} line={copy.line} label={copy.open} onClick={()=>p.onOpen()}/><Choice title="仍可以慢慢选择" line="回到自己的住处，再决定这一季把时间留给哪里。" label="回到住处想一想" onClick={()=>p.onNavigate('room')}/></>:null}
  </div>
  </ScreenBook>

  {p.receipt?<aside className="scene-receipt" role="status"><span>这一笔，已经记下。</span><p>{p.receipt}</p>{p.screen!=='life'?<small>开始、完成、客户验收和实际到账，仍按原日期发生。</small>:null}<button type="button" onClick={p.onDismissReceipt}>继续选择 →</button></aside>:null}
  <footer className="scene-turn"><div><button type="button" className="scene-text-action" onClick={()=>p.onOpen('quarter')}>日历上的牵挂{commitmentCount>0?' · '+commitmentCount:''} ↗</button>{p.screen==='life'?<button type="button" className="scene-text-action" onClick={p.onYear}>回看年度胶片 ↗</button>:null}<button type="button" className="scene-text-action" onClick={()=>p.onOpen()}>细看这一幕的安排 ↗</button></div>{canAdvance?<CommandButton {...p} kind="AdvanceTime" payload={{date:next}} label={(w.progression.nextQuarterDate?'走进下一季 · ':'让日子向前 · ')+next} confirm/>:<button type="button" onClick={()=>p.onOpen('quarter')}>{w.progression.requiresDelivery?'先面对这份交付':view.date===playableThrough&&w.atQuarterEnd?'回看最后一季':'看看停在了哪件事'}</button>}</footer>
 </section>
}
