import { useState } from 'react'
import {SaveTextPages} from './SaveTextPages.tsx'
import type { GameController } from '../application/game-controller.ts'
import { MAX_SAVE_BYTES } from '../persistence/codec.ts'
import { RuleError } from '../core/errors.ts'
import { backgroundNames,reasonText,wishes } from './game-text.ts'
export function StoragePanel({controller,initialText='',kind='import',onDone}:{controller:GameController;initialText?:string;kind?:string;onDone:()=>void}){
 const [text,setText]=useState(initialText),[preview,setPreview]=useState<ReturnType<GameController['inspectImport']>|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const fail=(error:unknown)=>setError(reasonText(error instanceof RuleError?error.code:'FILE_READ_FAILED'))
 const inspect=()=>{try{setError(null);setPreview(controller.inspectImport(text))}catch(error){setPreview(null);fail(error)}}
 const current=controller.snapshot.view,canRestore=preview&&current?.runId===preview.runId&&!current.hasCandidate&&!current.readOnly&&!current.busy
 async function apply(mode:'new'|'restore'){setBusy(true);setError(null);try{if(mode==='new')await controller.importNew(text);else await controller.restore(text);onDone()}catch(error){fail(error)}finally{setBusy(false)}}
 function download(){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`reborn-2020-${kind}-save.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('已请求浏览器下载，请确认文件已保存到本机。')}
 return <div className="storage-panel"><p>{kind==='candidate'?'这是未提交的候选，不代表当前操作已经保存到本机。':'存档包含本局完整状态，可能含私人备注和隐藏事实。请只保存在你信任的位置。'}</p>
 <label className="field">选择本机存档文件<input type="file" accept=".json,application/json" disabled={busy} onChange={event=>{const input=event.currentTarget,file=input.files?.[0];if(!file)return;if(file.size>MAX_SAVE_BYTES){setError(reasonText('SAVE_TOO_LARGE'));input.value='';return}setBusy(true);void file.text().then(value=>{setText(value);setPreview(null);setError(null)}).catch(fail).finally(()=>{setBusy(false);input.value=''})}}/></label>
 <SaveTextPages text={text} onChange={value=>{setText(value);setPreview(null);setError(null)}}/>
 {error?<p role="alert" className="error-box">{error}</p>:null}{message?<p role="status">{message}</p>:null}
 <div className="button-row"><button type="button" disabled={!text||busy} onClick={inspect}>检查存档</button><button type="button" disabled={!text||busy} onClick={download}>下载这份存档</button><button type="button" disabled={!text||busy} onClick={()=>{const copying=navigator.clipboard?.writeText(text);if(!copying){setMessage('浏览器未提供复制接口。请下载整份存档，或打开只读原文并点击「全选完整原文」后复制；片段输入框不是整份存档。');return}void copying.then(()=>setMessage('已复制完整存档，请妥善保管。')).catch(()=>setMessage('浏览器未允许复制。请下载整份存档，或打开只读原文并点击「全选完整原文」后复制；片段输入框不是整份存档。'))}}>复制存档</button></div>
 {preview?<section className="import-review"><h3>导入前核对</h3><dl><div><dt>日期 / 提交</dt><dd>{preview.date} / {preview.revision}</dd></div><div><dt>背景</dt><dd>{backgroundNames[preview.backgroundId as keyof typeof backgroundNames]??preview.backgroundId}</dd></div><div><dt>人生愿望</dt><dd>{wishes[preview.playerProfile.wishId]}</dd></div><div><dt>人生标识</dt><dd className="identifier">{preview.runId}</dd></div></dl>{preview.origin==='fixture'?<p className="warning-box">这是隔离测试存档，不能把其中预设资源当作正常开局。</p>:null}
 {!preview.alreadyExists&&!current?<button type="button" className="primary" disabled={busy} onClick={()=>{void apply('new')}}>确认导入为独立人生</button>:canRestore?<><p className="warning-box">将当前已保存的第{current!.revision}次提交恢复为第{preview.revision}次。替换前的提交会保留为备份；不会合并两份进度。</p><button type="button" className="danger" disabled={busy} onClick={()=>{void apply('restore')}}>确认恢复这份同一人生存档</button></>:<p>请先返回入口，或进入相应人生后再审阅恢复。未保存候选须先导出或处理；不会自动覆盖其他人生。</p>}
 </section>:null}</div>
}
