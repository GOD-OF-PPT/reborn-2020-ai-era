import {useState} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {Dialog} from './Dialog.tsx'
import {FirstChapterTrail} from './FirstChapterTrail.tsx'
import {moneyText} from './game-text.ts'
import {screenForRoute} from './Navigation.tsx'

export interface SceneWorkTarget{
 readonly accountId?:string
 readonly personId?:LifePerson
 readonly lifeSelection?:'person'|'rest'|'workspace'
}
export interface SceneWork extends SceneWorkTarget{
 readonly id:string
 readonly title:string
 readonly start:string
 readonly end:string
 readonly status:string
 readonly screen:Screen
 readonly cost:string
}

/** The original job owns its person, private account and personal-life mode. */
export function lifeWorkTarget(job:Pick<GamePanelProps['features']['life']['jobs'][number],'personId'|'kind'|'accountId'>):SceneWorkTarget{
 return {accountId:job.accountId,...(job.personId!==null?{personId:job.personId,lifeSelection:'person' as const}:job.kind==='rest'||job.kind==='workspace'?{lifeSelection:job.kind}:{})}
}
function workTarget(work:SceneWork):SceneWorkTarget{
 return {...(work.accountId?{accountId:work.accountId}:{}),...(work.personId?{personId:work.personId}:{}),...(work.lifeSelection?{lifeSelection:work.lifeSelection}:{})}
}

export function sceneWorks(p:Pick<GamePanelProps,'view'|'features'>):SceneWork[]{
 const f=p.features
 return [
  ...(['awaiting_submission','review','delivered'].includes(String(f.firstOrder.status))?[{id:'first-order-feedback',title:'那一份手工小单',start:f.firstOrder.dates.startAt,end:f.firstOrder.status==='awaiting_submission'?f.firstOrder.dates.submitBy:f.firstOrder.dates.earliestReviewAt,status:f.firstOrder.status==='awaiting_submission'?'作品已完成，等待你亲手提交':'已提交，客户复核与实际到账仍要分别发生',screen:'quarter' as Screen,accountId:'personal',cost:`实际制作成本${moneyText(f.firstOrder.result.directCostFen)} · 尚未当作已经回款`}]:[]),
  ...f.life.jobs.filter(j=>j.status==='running').map(j=>({id:j.id,title:j.kind==='promise_keep'?'答应过的那件事':f.life.work[j.kind].title,start:j.startAt,end:j.completeAt,status:'进行中，尚未完成',screen:'life' as Screen,cost:`个人已付${moneyText(j.costFen)} · 已耗${j.actionPoints}点`,...lifeWorkTarget(j)})),
  ...(p.view.operations?.jobs??[]).filter(j=>['planned','running'].includes(j.status)).map(j=>{const business=p.view.operations?.businesses.find(b=>b.id===j.businessId),route=f.workbench.routes.find(r=>r.id===business?.route);return {id:j.id,title:route?.name??'已确认的经营工作',start:j.startAt,end:j.completeAt,status:j.status==='planned'?'已经安排，等待实际开工':'进行中，完成后仍需核对交付',screen:business?screenForRoute(business.route):'quarter' as Screen,...(business?{accountId:business.accountId}:{}),cost:'原资金预留与费用，仍按原安排发生'}}),
  ...f.workbench.preparationJobs.filter(j=>j.status==='running').map(j=>({id:j.id,title:j.title,start:j.startAt,end:j.completeAt,status:'准备进行中，资格尚待实际结果',screen:'quarter' as Screen,accountId:j.accountId,cost:'开始准备不等于已经取得资格'})),
  ...f.story.jobs.filter(j=>j.status==='running').map(j=>({id:j.id,title:'已确认的合作与核查',start:j.startAt,end:j.completeAt,status:'进行中，仍待实际完成记录',screen:'story' as Screen,accountId:j.accountId,cost:'停止与独立恢复，仍是两件事'})),
 ].sort((a,b)=>a.end.localeCompare(b.end)||a.id.localeCompare(b.id))
}

/** The reel describes committed dates. It never advances the clock or invents completion. */
export function SceneJournal({p,onNavigate,compact=false}:{p:GamePanelProps;onNavigate:NavigateScene;compact?:boolean}){
 const works=sceneWorks(p),[selection,setSelection]=useState(0),[open,setOpen]=useState(false),index=Math.min(selection,Math.max(0,works.length-1)),work=works[index]
 const inspect=(screen:Screen,target?:SceneWorkTarget)=>{setOpen(false);onNavigate(screen,target)}
 return <>{compact?<button type="button" className="scene-journal-object" data-interaction="inspect" onClick={()=>setOpen(true)} aria-label="翻看全部实际行动"><span aria-hidden="true">▤</span><span>随身日历</span><small>{works.length?works.length+'项原安排':'查看原安排'} ↗</small></button>:<aside className="scene-journal" aria-label="实际行动胶片"><div className="journal-label"><span>正在经历 / {works.length?String(index+1).padStart(2,'0')+' · '+String(works.length).padStart(2,'0'):'此刻'}</span><button type="button" onClick={()=>setOpen(true)} aria-label="翻看全部实际行动">翻开日历 ↗</button></div>{work?<><h2>{work.title}</h2><p>{work.status}</p><div className="journal-dates"><time>{work.start}</time><span aria-hidden="true">········ ◇ ········</span><time>{work.end}</time></div><small>{work.cost}</small><div className="journal-controls">{works.length>1?<><button type="button" disabled={index===0} aria-label="上一个实际行动" onClick={()=>setSelection(index-1)}>←</button><button type="button" disabled={index===works.length-1} aria-label="下一个实际行动" onClick={()=>setSelection(index+1)}>→</button></>:null}<button type="button" onClick={()=>onNavigate(work.screen,workTarget(work))}>走近这件事 →</button></div></>:<><h2>先给日子，一个方向。</h2><p>此刻没有正在制作或准备的工作。可以留好工作、试一次小单，也可以把时间留给生活。</p><button type="button" className="journal-start" onClick={()=>onNavigate('quarter')}>想想接下来做什么 →</button></>}</aside>}{open?<Dialog title="日历里，实际发生的安排" onClose={()=>setOpen(false)}><FirstChapterTrail p={p} onOpen={()=>inspect('quarter')}/><p>这是已经提交的安排，不会因翻阅自动开工或完成。工资、客户交付和回款仍按各自日期发生。</p>{works.map(j=><section className="journal-record" key={j.id}><h3>{j.title}</h3><p>{j.start}—{j.end} · {j.status}</p><p>{j.cost}</p><button type="button" onClick={()=>inspect(j.screen,workTarget(j))}>查看原工作与可用选择</button></section>)}{!works.length?<p>尚无正在制作或准备的工作；不替你接受任何安排。</p>:null}<button type="button" onClick={()=>inspect('quarter')}>翻开全部本季安排与旧义务</button></Dialog>:null}</>
}
