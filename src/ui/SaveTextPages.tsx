import {useRef,useState} from 'react'
import {Dialog} from './Dialog.tsx'

/** Raw JSON has its own pages; copying/downloading still uses the complete original string. */
export function SaveTextPages({text,onChange,readOnly=false}:{text:string;onChange:(value:string)=>void;readOnly?:boolean}){
 const size=240,[selected,setSelected]=useState(0),[reading,setReading]=useState(false),pages=Math.max(1,Math.ceil(text.length/size)),page=Math.min(selected,pages-1),start=page*size
 const fullText=useRef<HTMLPreElement>(null),[selectionNotice,setSelectionNotice]=useState('')
 const selectFullText=()=>{
  const node=fullText.current,selection=window.getSelection();if(!node||!selection){setSelectionNotice('当前无法全选，请下载完整存档。');return}
  const range=document.createRange();range.selectNodeContents(node);selection.removeAllRanges();selection.addRange(range)
  setSelectionNotice('已选中完整原文，请按 Ctrl+C 或 Command+C 复制。')
 }
 return <section className="save-text-pages"><label className="field">存档内容<textarea rows={6} value={text.slice(start,start+size)} readOnly={readOnly} spellCheck={false} onChange={event=>onChange(text.slice(0,start)+event.target.value+text.slice(start+size))}/></label><div className="save-text-navigation"><button type="button" disabled={page===0} onClick={()=>setSelected(page-1)}>前一段</button><label>文本片段<input aria-label="存档文本片段" type="number" min={1} max={pages} value={page+1} onChange={event=>{const value=Number(event.target.value);if(Number.isSafeInteger(value))setSelected(Math.max(0,Math.min(pages-1,value-1)))}}/> / {pages}</label><button type="button" disabled={page===pages-1} onClick={()=>setSelected(page+1)}>后一段</button></div><p className="field-help">完整文本共{text.length.toLocaleString()}字。复制、下载与检查始终使用整份存档；大档建议选择文件导入。</p><button type="button" disabled={!text} onClick={()=>{setSelectionNotice('');setReading(true)}}>只读翻阅完整原文</button>{reading?<Dialog title="完整存档原文 · 只读" onClose={()=>setReading(false)}><button type="button" onClick={selectFullText}>全选完整原文</button>{selectionNotice?<p role="status">{selectionNotice}</p>:null}<pre ref={fullText} className="full-save-text" aria-label="完整存档原文">{text}</pre></Dialog>:null}</section>
}
