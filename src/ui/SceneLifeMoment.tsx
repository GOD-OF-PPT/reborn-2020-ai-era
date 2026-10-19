import type {GamePanelProps} from './game-types.ts'
import type {LifeProjection} from '../core/life-projection.ts'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'

type Person=LifeProjection['people'][number]
export function SceneLifeMoment({p,person}:{p:GamePanelProps;person:Person}){
 const promises=person.promises,active=promises.find(o=>o.status==='accepted')??promises.find(o=>o.status==='offered')
 const running=person.jobs.find(j=>j.status==='running'),last=promises.filter(o=>o.resolvedAt!==null&&o.resolvedAt>=p.features.workbench.quarterStart).at(-1)
 if(!active&&!running&&!last)return null
 return <section className="scene-life-moment" aria-label={person.name+'的眼前约定'}>
  <p className="scene-overline">{person.name} / 相处过的日子，都有原来的日期</p>
  {active?<><h2>{person.promiseTerms.title}</h2><p>{active.status==='offered'?'这是一项邀请，还没有接受。请在'+active.expiresAt+'前回应。':'你已经接受，仍要用实际工作兑现。'}最迟{active.deadline}实际完成。</p>{active.status==='offered'?<CommandButton {...p} kind="DeclineLifePromise" payload={{promiseId:active.id}} label={'婉拒'+person.name+'的邀请'} confirm/>:null}</>:null}
  {running?<><h3>{running.kind==='promise_keep'?'约定正在用日子兑现':'共同活动，正在进行'}</h3><p>{running.startAt}—{running.completeAt} · 个人已付{moneyText(running.costFen)} / 已耗{running.actionPoints}点。此刻还没有完成。</p><CommandButton {...p} kind="InterruptLifeWork" payload={{jobId:running.id}} label={'停止与'+person.name+'的本次工作，保留原责任'} confirm/></>:null}
  {!active&&!running&&last?<><h2>{last.status==='fulfilled'?'答应过的事，已经实际做到。':last.status==='missed'?'这一次，约定没有按期完成。':last.status==='npc_declined'?'对方，也有自己的安排。':'这次邀请，没有新增承诺。'}</h2><p>{last.resolvedAt} · {last.status==='missed'?'失约与已发生成本仍保留，不会因翻页消失。':last.status==='npc_declined'?'撤回的是未接受的邀请，不记作你的失约。':'原日期和来源仍可在人物记录里核对。'}</p></>:null}
 </section>
}
