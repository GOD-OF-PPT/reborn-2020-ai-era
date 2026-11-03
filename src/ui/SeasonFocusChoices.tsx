import {useId,useState} from 'react'
import {Dialog} from './Dialog.tsx'
import type {SeasonFocusChoice} from './season-thread.ts'
import './season-focus-choices.css'

const PAGE_SIZE=3
export function seasonChoicePage(choices:readonly SeasonFocusChoice[],requested:number){
 const pages=Math.max(1,Math.ceil(choices.length/PAGE_SIZE))
 const page=Math.max(0,Math.min(pages-1,Number.isSafeInteger(requested)?requested:0))
 return {page,pages,items:choices.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)}
}
export function seasonChoiceOrigin(choice:SeasonFocusChoice){
 return (choice.scope==='history'?'历史回看':choice.scope==='carry'?'旧约继续':choice.scope==='entry'?'可选方向':'本季事项')+(choice.originQuarter?' · '+choice.originQuarter:'')+(choice.date?' · 来源 '+choice.date:'')
}
export function SeasonFocusDetails({choice,currentDate}:{choice:SeasonFocusChoice;currentDate:string}){
 return <><p className="opening-paper-date">{seasonChoiceOrigin(choice)}</p><p>{choice.line}</p>{choice.nextDate?<p>{choice.nextDate>currentDate?'下一次公开反馈':'原反馈日期'} · {choice.nextDate}</p>:null}{choice.disabledReason?<p className="reason">{choice.disabledReason}</p>:null}<p className="field-help">这里只翻阅说明。合上后，再决定要不要换书签。</p></>
}

/** Reading details and selecting a draft are separate; neither commits a focus. */
export function SeasonFocusChoices({choices,selectedId,currentDate,label,onSelect}:{choices:readonly SeasonFocusChoice[];selectedId:string|null;currentDate:string;label:string;onSelect:(id:string)=>void}){
 const [requestedPage,setPage]=useState(0),[detailId,setDetailId]=useState<string|null>(null),name=useId()
 const {page,pages,items}=seasonChoicePage(choices,requestedPage),detail=choices.find(row=>row.id===detailId)
 return <div className="season-bookmark-options">
  <div className="season-bookmark-list" role="radiogroup" aria-label={label}>
   {items.map(choice=><div key={choice.id} className="season-bookmark-row" data-selected={selectedId===choice.id?'true':undefined}>
    <label className="season-bookmark-label"><input type="radio" name={name} value={choice.id} checked={selectedId===choice.id} disabled={choice.disabledReason!==null} onChange={()=>onSelect(choice.id)} aria-label={choice.title}/><span>
     <strong>{choice.title}</strong>
     <span className="season-bookmark-meta">{seasonChoiceOrigin(choice)}{choice.nextDate?<span> · {choice.nextDate>currentDate?'下次反馈':'原反馈'} {choice.nextDate}</span>:null}</span>
     {choice.disabledReason?<span className="season-bookmark-reason">{choice.disabledReason}</span>:null}
    </span></label>
    <button type="button" className="season-bookmark-details" aria-label={'查看'+choice.title+'的详情'} onClick={()=>setDetailId(choice.id)}>详情 ↗</button>
   </div>)}
   {!choices.length?<p className="season-bookmark-empty">这组暂时没有记录。可以看看其它方向。</p>:null}
  </div>
  <nav className="season-bookmark-pages" aria-label="书签对象分页"><button type="button" disabled={page===0} onClick={()=>setPage(page-1)}>← 上一组</button><span role="status">{page+1} / {pages} · {choices.length}件事</span><button type="button" disabled={page===pages-1} onClick={()=>setPage(page+1)}>下一组 →</button></nav>
  {detailId!==null?<Dialog title={detail?.title??'这份记录已变化'} className="opening-paper season-focus-details" onClose={()=>setDetailId(null)}>
   {detail?<SeasonFocusDetails choice={detail} currentDate={currentDate}/>:<p>原对象已不可达，请回到列表重新查看；没有替你换成其它对象。</p>}
  </Dialog>:null}
 </div>
}
