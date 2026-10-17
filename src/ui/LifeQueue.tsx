import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'
import type {LifePerson} from '../core/life-schema.ts'

export function LifeQueue({p,onOpen}:{p:GamePanelProps;onOpen:(personId?:LifePerson)=>void}){
 const life=p.features.life,from=p.features.workbench.quarterStart,notices=life.promises.filter(o=>o.resolvedAt!==null&&o.resolvedAt>=from&&['missed','fulfilled','npc_declined'].includes(o.status))
 if(!life.queued.length&&!notices.length)return null
 return <section className="life-commitment-queue panel"><div className="section-heading"><div><p className="eyebrow">已经答应的事 / 个人</p><h3>时间里的承诺，也要留着位置。</h3></div><button type="button" className="text-button" onClick={()=>onOpen(life.queued[0]?.personId??notices.at(-1)?.personId)}>查看人物与原记录</button></div><p>个人现可用{moneyText(life.personalAvailableFen)}。接受约定没有代替后续工作，企业资金不会自动支付。</p>
 {life.queued.map(o=>{const job=life.jobs.find(j=>j.id===o.jobId);return <article className="life-promise-due" key={o.id}><div><strong>{o.title}</strong><p>最迟{o.deadline}实际完成 · {job?'已耗':'另需'}{o.actionPoints}点 / {job?'已付':''}{moneyText(o.costFen)} / {o.days}日</p>{job?<p>{job.startAt}—{job.completeAt} · 实际进行中，尚未兑现</p>:<p>还没有安排实际工作。到期未完成会留下失约记录，不会自动收费或免费完成。</p>}</div>{job?<CommandButton {...p} kind="InterruptLifeWork" payload={{jobId:job.id}} label="停止本次工作，约定仍保留" confirm/>:<CommandButton {...p} kind="FulfillLifePromise" payload={{promiseId:o.id}} label="安排实际兑现工作" confirm/>}</article>})}
 {notices.length?<details className="life-notices" open={notices.some(o=>o.status==='missed')}><summary>本季约定的已发生变化（{notices.length}）</summary>{notices.map(o=><p className={o.status==='missed'?'warning-box':''} key={o.id}>{o.resolvedAt} · {life.people.find(p=>p.id===o.personId)!.name} · {o.status==='fulfilled'?'已通过实际工作兑现':o.status==='missed'?'原约定到期未完成，失约及已付成本保留':'对方按自己的安排撤回未接受邀请，不记玩家失约'}。</p>)}</details>:null}
 </section>
}
