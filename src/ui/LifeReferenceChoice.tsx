import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {LifeProjection} from '../core/life-projection.ts'
import {addDays} from '../core/calendar.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'

type Person=LifeProjection['people'][number]
const references={paid_case:'已付履约案例',video_work:'实际原创制作',course_delivery:'完整课程履约',linzhou_participation:'林舟实际参与记录'}
export function LifeReferenceChoice({p,person,onFullRecord,children}:{p:GamePanelProps;person:Person;onFullRecord:()=>void;children:(open:()=>void)=>ReactNode}){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(''),revision=useRef(p.view.revision)
 const reference=person.references.find(r=>r.kind+':'+r.id===selected)??null
 useEffect(()=>{if(open&&(p.view.hasCandidate||p.view.saveStatus==='conflict'||p.view.revision!==revision.current&&p.view.saveStatus==='saved'))setOpen(false)},[open,p.view.revision,p.view.saveStatus,p.view.hasCandidate])
 return <>{children(()=>{revision.current=p.view.revision;setOpen(true)})}{open?<Dialog title={'带一份真正做过的材料，见见'+person.name} className="life-reference-choice" onClose={()=>setOpen(false)}>
  <p>{person.boundary}</p><p>这次{person.work.title}由个人承担{moneyText(person.work.costFen)}、{person.work.points}点和{person.work.days}日；现在开始，原预计完成日{addDays(p.view.date,person.work.days)}。对方的实际档期、原产能和费用仍由原确认裁定。</p>
  <label className="field">这次共同活动，想讨论哪份实际材料<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">由你明确选择本次材料</option>{person.references.map(r=><option key={r.kind+':'+r.id} value={r.kind+':'+r.id}>{r.date} · {references[r.kind]} · {r.id.slice(-6)}</option>)}</select></label>
  {reference?<section className="encounter-source"><h3>这份原依据</h3><p>{reference.date} · {references[reference.kind]}</p><p>{reference.id}</p><p>使用本次原材料不授予额外商业许可、合作同意或治理权。</p></section>:<p>先选择真实做过的依据。阅读、选材料和返回都不会付费，也不会自动获得对方同意。</p>}
  <div className="encounter-actions">{reference?<CommandButton {...p} kind="StartLifeWork" payload={{kind:person.work.kind,personId:person.id,reference}} label={'核对这份材料与'+person.name+'的实际活动'} confirm primary/>:<button type="button" disabled>先选定这次实际材料</button>}<button type="button" onClick={()=>{setOpen(false);onFullRecord()}}>翻看全部材料、人物日程和原约定</button></div>
 </Dialog>:null}</>
}
