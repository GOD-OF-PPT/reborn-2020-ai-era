import {useEffect,useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {LifePerson} from '../core/life-schema.ts'
import {lifeSceneProgress} from './life-scene-progress.ts'
import {makeSharedAction} from './shared-action.ts'
import {PersonPortrait} from './PersonPortrait.tsx'
import {Dialog} from './Dialog.tsx'
import './life-contact-book.css'

type Person=GamePanelProps['features']['life']['people'][number]
/** These labels read original public progress; they never decide eligibility. */
export function lifeContactReading(p:Pick<GamePanelProps,'view'|'features'>,person:Person){
 const progress=lifeSceneProgress(p.features.life,p.view.date,person.id),promise=progress.promise,job=progress.job
 if(progress.stage==='running')return {title:'这段相处正在继续',detail:job?'预计'+job.completeAt+'结束':'日期沿原安排',tone:'active'}
 if(progress.stage==='accepted')return {title:'已经答应的事',detail:(promise?'原期限'+promise.deadline+' · ':'')+progress.choice.label,tone:'attention'}
 if(progress.stage==='offered')return {title:'有一份原邀请',detail:promise?'回应期限 '+promise.expiresAt:'请翻原邀请',tone:'attention'}
 if(progress.stage==='missed')return {title:'原约定尚未兑现',detail:promise?'原期限 '+promise.deadline:'请翻原约定',tone:'danger'}
 if(progress.stage==='completed')return {title:'共同经历已经留下',detail:promise?.resolvedAt??job?.completeAt??'原记录仍在',tone:'completed'}
 if(progress.stage==='interrupted')return {title:'这次安排停在途中',detail:job?.releasedAt?'停止于 '+job.releasedAt:'原投入仍保留',tone:'neutral'}
 if(progress.stage==='npc-declined')return {title:'对方另有安排',detail:promise?.resolvedAt??'原邀请仍可阅读',tone:'neutral'}
 if(progress.stage==='expired'||progress.stage==='declined')return {title:progress.stage==='expired'?'原邀请已过回应窗口':'原邀请已婉拒',detail:promise?.resolvedAt??'原记录仍在',tone:'neutral'}
 if(!person.known)return {title:'还未形成联系',detail:'先看看原相识前提',tone:'unknown'}
 if(person.busy)return {title:'对方有自己的安排',detail:person.busy.from+'起、'+person.busy.to+'前',tone:'neutral'}
 return {title:progress.stage==='ready'?'先看看互动条件':'原材料与条件待核',detail:progress.stage==='ready'?person.role:progress.choice.title,tone:'neutral'}
}

export function LifeContactBook({p,selectedId,onSelect}:{p:GamePanelProps;selectedId:LifePerson;onSelect:(id:LifePerson)=>void}){
 const [openAt,setOpenAt]=useState<string|null>(null)
 useEffect(()=>{setOpenAt(null)},[p.view.runId])
 const people=p.features.life.people,known=people.filter(person=>person.known).length
 const offered=p.features.life.promises.filter(promise=>promise.status==='offered'&&promise.offeredAt<=p.view.date).length
 const accepted=p.features.life.promises.filter(promise=>promise.status==='accepted'&&promise.offeredAt<=p.view.date&&promise.acceptedAt!==null&&promise.acceptedAt<=p.view.date).length
 const open=makeSharedAction(p,'翻开联系簿',()=>setOpenAt(p.view.runId),{allowReadOnly:true})
 return <div className="life-contact-entry">
  <button type="button" className="life-contact-open" disabled={open.disabled} onClick={open.activate}>翻开联系簿 <span aria-hidden="true">↗</span></button>
  <span className="life-contact-count">已相识{known}位{offered>0?' · 原邀请'+offered+'份':''}{accepted>0?' · 已答应'+accepted+'份':''}</span>
  {openAt===p.view.runId?<Dialog title="联系簿" layout="direct" className="opening-paper life-contact-book" onClose={()=>setOpenAt(null)} footer={<div className="life-contact-footer"><p>先看看，真正的约定再由你决定。</p><button type="button" onClick={()=>setOpenAt(null)}>回到眼前的生活</button></div>}>
   <p className="life-contact-date">{p.view.date} · 每个人都有自己的日子。</p>
   <div className="life-contact-cards">{people.map((person,index)=>{
    const state=lifeContactReading(p,person),description='life-contact-state-'+person.id+'-'+index
    const choose=makeSharedAction(p,'看看'+person.name,()=>{setOpenAt(null);onSelect(person.id)},{allowReadOnly:true,disabled:people.filter(row=>row.id===person.id).length!==1})
    return <button type="button" className="life-contact-card" key={person.id+':'+index} data-known={person.known?'true':'false'} data-tone={state.tone} aria-label={choose.label} aria-describedby={description} aria-pressed={person.id===selectedId} disabled={choose.disabled} onClick={choose.activate}>
     <PersonPortrait personId={person.id} name={person.name} revealed={person.known} textOnly={p.textOnly===true}/><span className="life-contact-copy"><strong>{person.name}</strong><span id={description}><span className="life-contact-state">{state.title}</span><span className="life-contact-detail">{state.detail}</span></span></span><i aria-hidden="true">↗</i>
    </button>
   })}</div>
  </Dialog>:null}
 </div>
}
