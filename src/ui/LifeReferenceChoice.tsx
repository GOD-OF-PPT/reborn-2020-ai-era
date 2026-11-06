import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {LifeProjection} from '../core/life-projection.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {makeSharedAction} from './shared-action.ts'
import type {LifeMaterialSelection} from './life-material-draft.ts'
import './life-reference-choice.css'
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
 const [open,setOpen]=useState(false),[pane,setPane]=useState<'choose'|'sources'>('choose'),[leaf,setLeaf]=useState(0),[preview,setPreview]=useState<string|null>(null),[selections,setSelections]=useState({runId:p.view.runId,values:{} as Record<string,LifeMaterialSelection>}),revision=useRef(p.view.revision)
 const context=JSON.stringify([p.view.runId,p.accountId,person.id]),remembered=p.lifeMaterialDraftMemory?.read(p.view.runId,p.accountId,person.id)??(selections.runId===p.view.runId?selections.values[context]:undefined),selected=remembered&&person.references.some(r=>r.kind+':'+r.id===remembered.key&&r.date===remembered.date)?remembered.key:'',materials=materialChoices(person).map(row=>{
  let issue:string|null=null
  try{isoDate(row.reference.date);if(row.reference.date>=p.view.date)issue='尚未到原材料可用的次日。'}catch{issue='原材料日期暂不可核。'}
  if(!row.reference.id.trim()||person.references.filter(r=>r.kind+':'+r.id===row.key).length!==1)issue='这份原材料的身份需要先核对。'
  return {...row,issue}
 }),pages=Math.max(1,Math.ceil(materials.length/2)),page=Math.min(leaf,pages-1),visible=materials.slice(page*2,page*2+2),shown=visible.find(row=>row.key===preview)??visible[0]??null,chosen=materials.find(row=>row.key===selected&&row.issue===null),reference=chosen?.reference??null
 const life=useRef({alive:true,generation:0}),owner=useRef<{key:string;view:GamePanelProps['view'];controller:GamePanelProps['controller'];session:string|undefined;memory:GamePanelProps['lifeMaterialDraftMemory'];full:typeof onFullRecord}|null>(null),key=JSON.stringify([context,open,pane,page,materials.map(row=>[row.key,row.reference.date,row.issue])])
 if(!owner.current||owner.current.key!==key||owner.current.view!==p.view||owner.current.controller!==p.controller||owner.current.session!==p.controller.runtimeSession||owner.current.memory!==p.lifeMaterialDraftMemory||owner.current.full!==onFullRecord)owner.current={key,view:p.view,controller:p.controller,session:p.controller.runtimeSession,memory:p.lifeMaterialDraftMemory,full:onFullRecord}
 const source=owner.current,generation=life.current.generation,options={allowReadOnly:true,canActivate:()=>life.current.alive&&owner.current===source&&life.current.generation===generation}
 useEffect(()=>{life.current.alive=true;return()=>{life.current.alive=false}},[])
 const close=()=>{life.current.generation++;setOpen(false)}
 useEffect(()=>{if(open&&(p.view.hasCandidate||p.view.saveStatus==='conflict'||p.view.revision!==revision.current&&p.view.saveStatus==='saved'))close()},[open,p.view.revision,p.view.saveStatus,p.view.hasCandidate])
 const action=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,options),choose=(row:typeof materials[number])=>action('带上'+row.label,()=>{if(!open||row.issue!==null)return;const choice={key:row.key,date:row.reference.date};p.lifeMaterialDraftMemory?.write(p.view.runId,p.accountId,person.id,choice);setSelections(old=>({runId:p.view.runId,values:{...(old.runId===p.view.runId?old.values:{}),[context]:choice}}));setPreview(row.key)})
 const turn=(next:number)=>action('翻材料',()=>{setLeaf(next);setPreview(null)}),reading=action('核对材料来源',()=>setPane(pane==='choose'?'sources':'choose')),full=action('查看人物日程与全部材料',()=>{close();onFullRecord()}),opening=action('带一份经历去见面',()=>{revision.current=p.view.revision;life.current.generation++;setPane('choose');const index=materials.findIndex(row=>row.key===selected);setLeaf(index<0?0:Math.floor(index/2));setPreview(index<0?null:selected);setOpen(true)})
 const pagination=pages>1?<nav className="life-material-turn" aria-label="原材料分页"><button type="button" disabled={page===0} onClick={turn(page-1).activate}>← 前两份</button><span>{page+1}/{pages} · 共{materials.length}份</span><button type="button" disabled={page===pages-1} onClick={turn(page+1).activate}>后两份 →</button></nav>:null
 const footer=<div className="life-material-footer">{pane==='choose'?<>{reference?<CommandButton {...p} kind="StartLifeWork" payload={{kind:person.work.kind,personId:person.id,reference}} label={'核对并安排与'+person.name+'的活动'} confirm primary/>:<button type="button" disabled>先选本次带去的材料</button>}<button type="button" className="life-material-link" disabled={reading.disabled} onClick={reading.activate}>核对材料来源 ↗</button></>:<button type="button" disabled={reading.disabled} onClick={reading.activate}>回到这次带去的经历 →</button>}<button type="button" className="life-material-link" onClick={close}>先合上，保留选择</button><button type="button" className="life-material-link" disabled={full.disabled} onClick={full.activate}>{full.label} ↗</button></div>
 return <>{children(opening.activate)}{open?<Dialog title={'带哪份材料去见'+person.name+'？'} layout="direct" className="opening-paper life-reference-choice" onClose={close} footer={footer}>
  <div className="life-material-context"><h3>{person.work.title}</h3><p>个人{moneyText(person.work.costFen)} · {person.work.points}点 · {person.work.days}日。若今天开始，预计{addDays(p.view.date,person.work.days)}完成；档期与费用仍须核对。</p><p className="life-material-boundary">{person.boundary}</p></div>
  {pane==='choose'?<div className="life-material-desk"><nav className="life-material-index" aria-label="本次交流可带的原经历">{visible.map((row,index)=>{const binding=choose(row);return <button type="button" key={row.key+':'+(page*2+index)} aria-label={binding.label} aria-pressed={selected===row.key} data-preview={shown?.key===row.key?'true':'false'} disabled={binding.disabled||row.issue!==null} onPointerEnter={()=>setPreview(row.key)} onFocus={()=>setPreview(row.key)} onClick={binding.activate}><span>{row.reference.date}</span><strong>{row.label.split(' · ')[0]}</strong><small>{row.label.includes(' · 第')?row.label.slice(row.label.lastIndexOf(' · 第')+3)+' · ':''}{selected===row.key?'本次携带':'翻看这一份'} ↗</small>{row.issue?<small>{row.issue}</small>:null}</button>})}{!visible.length?<p>还没有可带去的实际材料。先翻人物日程与原记录。</p>:null}{pagination}</nav><article className="life-material-paper" aria-label="正在预看的交流材料">{shown?<><p className="life-material-mark">{selected===shown.key?'本次携带':'预看 · 尚未选择'}</p><h3>{shown.label.split(' · ')[0]}</h3><p>原材料日期 {shown.reference.date}</p><p>经历是话题，不代替同意、商业许可或治理权。</p>{shown.issue?<p role="status">{shown.issue}</p>:<button type="button" disabled={choose(shown).disabled} onClick={choose(shown).activate}>{selected===shown.key?'已选作本次交流材料':'带上这一份经历'} ↗</button>}</>:<p>先留下一份真实完成的经历，再约一次交流。</p>}</article></div>:<section className="life-material-sources" aria-label="全部原材料来源"><p>同一份原类型、日期与完整编号；这里只翻阅。</p>{visible.map((row,index)=><article key={row.key+':'+(page*2+index)}><h3>{row.label}</h3><p>记录编号：<code>{row.reference.id}</code></p>{row.issue?<p>{row.issue}</p>:null}</article>)}{pagination}</section>}
 </Dialog>:null}</>
}
