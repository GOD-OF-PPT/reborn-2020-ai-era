import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {LifeProjection} from '../core/life-projection.ts'
import {addDays} from '../core/calendar.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'

type Person=LifeProjection['people'][number]
const references={paid_case:'已收款的交付',video_work:'完成的原创视频',course_delivery:'完成的课程交付',linzhou_participation:'参与林舟协作的记录'}
function materialChoices(person:Person){
 const rows=person.references.map(reference=>({reference,key:reference.kind+':'+reference.id,label:(references[reference.kind]??'已完成的材料')+' · '+reference.date}))
 const counts=new Map<string,number>(),positions=new Map<string,number>()
 for(const row of rows)counts.set(row.label,(counts.get(row.label)??0)+1)
 return rows.map(row=>{const number=(positions.get(row.label)??0)+1;positions.set(row.label,number);return {...row,label:row.label+((counts.get(row.label)??0)>1?' · 第'+number+'份':'')}})
}
export function LifeReferenceChoice({p,person,onFullRecord,children}:{p:GamePanelProps;person:Person;onFullRecord:()=>void;children:(open:()=>void)=>ReactNode}){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(''),revision=useRef(p.view.revision)
 const reference=person.references.find(r=>r.kind+':'+r.id===selected)??null
 const materials=materialChoices(person),chosen=materials.find(row=>row.key===selected)
 useEffect(()=>{if(open&&(p.view.hasCandidate||p.view.saveStatus==='conflict'||p.view.revision!==revision.current&&p.view.saveStatus==='saved'))setOpen(false)},[open,p.view.revision,p.view.saveStatus,p.view.hasCandidate])
 return <>{children(()=>{revision.current=p.view.revision;setOpen(true)})}{open?<Dialog title={'带哪份材料去见'+person.name+'？'} className="life-reference-choice" onClose={()=>setOpen(false)}>
  <h3>{person.work.title}</h3>
  <p>个人{moneyText(person.work.costFen)} · {person.work.points}点 · {person.work.days}日。现在开始，预计{addDays(p.view.date,person.work.days)}完成；实际档期、产能和费用会在确认时核对。</p>
  <p>{person.boundary}</p>
  <label className="field">这次带哪份已经做过的材料<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">请选择本次材料</option>{materials.map(row=><option key={row.key} value={row.key}>{row.label}</option>)}</select></label>
  <p>{reference&&chosen?'这次带上：'+chosen.label+'。':'先选一份本次交流的材料，查看和返回都不会付费。'}材料只说明你做过什么，不代替对方同意，也不授予商业许可或治理权。</p>
  <div className="encounter-actions">{reference?<CommandButton {...p} kind="StartLifeWork" payload={{kind:person.work.kind,personId:person.id,reference}} label={'核对并安排与'+person.name+'的活动'} confirm primary/>:<button type="button" disabled>先选本次带去的材料</button>}<button type="button" onClick={()=>{setOpen(false);onFullRecord()}}>查看人物日程与全部材料</button></div>
  <details className="encounter-source"><summary>查看材料来源和完整编号</summary><p>展开只查看来源，材料仍由上方选择。</p>{materials.map(row=><article key={row.key}><h3>{row.label}</h3><p>记录编号：{row.reference.id}</p></article>)}</details>
 </Dialog>:null}</>
}
