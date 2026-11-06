import {useState,useRef,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {isoDate} from '../core/calendar.ts'
import './memory-clippings.css'

type Mode='news'|'memories'
type Selection={scope:string;mode:Mode;newsId:string|null;memoryId:string|null;page:number;sourcePage:number}
const past=(date:string,today:string)=>{try{return isoDate(date)===date&&date<=today}catch{return false}}
const accessNames:Record<string,string>={private_beta:'封闭测试',public_preview:'公开预览',conditional_release:'按条件开放',announcement:'公布消息',rule_effective:'规则生效'}
const memoryNames:Record<string,string>={content:'内容与作品',service:'服务与协作',local_tools:'本地工具'}

/** The cover shows a public page; selecting or turning it never marks it read or prepares a tool. */
export function MemoryClippings({p,onFull,feedback=null,receiptKind=null,onReadingChange}:{p:GamePanelProps;onFull:()=>void;feedback?:ReactNode;receiptKind?:string|null;onReadingChange?:()=>void}){
 const world=p.features.workbench.world,news=world.news.filter(n=>past(n.actualDate,p.view.date)).sort((a,b)=>b.actualDate.localeCompare(a.actualDate)||a.id.localeCompare(b.id)),memories=world.memories
 const scope=JSON.stringify([p.view.runId,p.accountId]),initial=():Selection=>({scope,mode:news.length?'news':'memories',newsId:news[0]?.id??null,memoryId:memories[0]?.id??null,page:0,sourcePage:0})
 const [stored,setStored]=useState<Selection>(initial),selection=stored.scope===scope?stored:initial()
 const origin=useRef<{scope:string;revision:number;kind:string;target:string}|null>(null),owner=useRef(scope)
 if(owner.current!==scope){owner.current=scope;origin.current=null}
 const edit=(patch:Partial<Omit<Selection,'scope'>>)=>setStored(old=>({...(old.scope===scope?old:initial()),...patch,scope}))
 const mode=selection.mode,rows=mode==='news'?news:memories,id=mode==='news'?selection.newsId:selection.memoryId,matches=rows.filter(r=>r.id===id),originalMatches=(mode==='news'?world.news:memories).filter(r=>r.id===id)
 const known=matches.length===1&&originalMatches.length===1,index=known?rows.findIndex(row=>row.id===id):-1,pages=Math.max(1,Math.ceil(rows.length/2)),page=Math.min(selection.page,pages-1)
 const currentNews=mode==='news'&&known?news.find(n=>n.id===id):undefined,currentMemory=mode==='memories'&&known?memories.find(m=>m.id===id):undefined
 const retire=()=>{origin.current=null;onReadingChange?.()}
 const select=(next:string,at:number)=>{if(next!==id)retire();edit({...(mode==='news'?{newsId:next}:{memoryId:next}),page:Math.floor(at/2),sourcePage:0})}
 const turn=(next:Mode)=>{if(next!==mode)retire();edit({mode:next,page:0,sourcePage:0,...(next==='news'&&selection.newsId===null?{newsId:news[0]?.id??null}:next==='memories'&&selection.memoryId===null?{memoryId:memories[0]?.id??null}:{})})}
 const request:GamePanelProps['request']=(kind,payload,label,confirm)=>{
  const row=payload!==null&&typeof payload==='object'&&!Array.isArray(payload)?payload as Record<string,unknown>:null,target=kind==='ReadNews'&&typeof row?.anchorId==='string'?'news:'+row.anchorId:kind==='FavoriteMemory'&&typeof row?.memoryId==='string'?'memories:'+row.memoryId:null
  origin.current=target?{scope,revision:p.view.revision,kind,target}:null
  p.request(kind,payload,label,confirm)
 }
 const last=p.view.receipts.at(-1),response=origin.current,showFeedback=!!feedback&&response?.scope===scope&&response.target===mode+':'+id&&p.view.revision===response.revision+1&&receiptKind===response.kind&&last?.kind===response.kind&&last.revisionAfter===p.view.revision
 const sourcePages=Math.max(1,Math.ceil((currentNews?.sourceIds.length??0)/2)),sourcePage=Math.min(selection.sourcePage,sourcePages-1)
 const action=currentNews?<CommandButton {...p} request={request} kind="ReadNews" payload={{anchorId:currentNews.id}} label={currentNews.read?'已读新闻':'读过这一页'} primary/>:currentMemory?<CommandButton {...p} request={request} kind="FavoriteMemory" payload={{memoryId:currentMemory.id,favorite:!currentMemory.favorite}} label={currentMemory.favorite?'取下这一页的书签':'夹入这一页的书签'} primary/>:null

 return <section className="memory-clippings" aria-label="时代来信与前世片段">
  <nav className="clipping-tabs" aria-label="翻哪一叠纸"><button type="button" aria-pressed={mode==='news'} onClick={()=>turn('news')}>时代来信 · {news.length}</button><button type="button" aria-pressed={mode==='memories'} onClick={()=>turn('memories')}>前世片段 · {memories.length}</button></nav>
  <div className="clipping-desk">
   <aside className="clipping-index" aria-label={mode==='news'?'已发生新闻索引':'前世片段索引'}><p>{mode==='news'?'已经发生的事':'前世留下的方向'}</p>{rows.slice(page*2,page*2+2).map((row,i)=><button type="button" className="clipping-index-entry" key={row.id+':'+(page*2+i)} aria-pressed={id===row.id} onClick={()=>select(row.id,page*2+i)}>{'actualDate' in row?<><span className="clipping-index-meta"><time>{row.actualDate}</time><span>{row.read?'已读':'未读'}</span></span><strong>{row.title}</strong></>:<><span className="clipping-index-meta"><span>片段 {page*2+i+1}</span><span>{row.favorite?'已夹书签':'未收藏'}</span></span><strong>{memoryNames[row.domain]??'前世方向'}</strong><span>{row.prepared?'本局已有对应准备':'本局尚未对应准备'}</span></>}</button>)}{!rows.length?<p>{mode==='news'?'还没有已经发生的时代来信。':'此刻没有可核对的前世片段。'}</p>:null}{pages>1?<div className="clipping-page-turn"><button type="button" disabled={page===0} onClick={()=>edit({page:page-1})}>← 前两份</button><span>{page+1}/{pages}</span><button type="button" disabled={page===pages-1} onClick={()=>edit({page:page+1})}>后两份 →</button></div>:null}</aside>
   <article className="clipping-paper" key={scope+':'+mode+':'+id} aria-label={mode==='news'?'正在读的时代来信':'正在读的前世片段'}>
    {currentNews?<><div className="clipping-paper-heading"><span>{currentNews.classification==='historical'?'史实剪报':'本局记录'}</span><span className="clipping-read-mark">{currentNews.read?'已读':'未读'}</span></div><h2>{currentNews.title}</h2><dl className="clipping-dates"><div><dt>实际发生</dt><dd>{currentNews.actualDate}</dd></div><div><dt>公布日期</dt><dd>{currentNews.publishedAt}</dd></div><div><dt>记录可用日</dt><dd>{currentNews.availableAt}</dd></div></dl><div className="clipping-notes"><p className="clipping-context">开放方式：{accessNames[currentNews.access]??'原范围待核'}；工具资格另核。</p><div className="clipping-sources" aria-label="这则新闻的原来源">{currentNews.sourceIds.slice(sourcePage*2,sourcePage*2+2).map((sourceId,i)=>{const sources=p.features.workbench.sourceLinks.filter(s=>s.id===sourceId),source=sources.length===1?sources[0]:null;return source?<a key={sourceId+':'+i} href={source.url} target="_blank" rel="noreferrer" aria-label={'这则新闻的原来源 '+sourceId}>原来源{sourcePage*2+i+1} ↗</a>:<span key={sourceId+':'+i}>原来源{sourceId}待核</span>})}{sourcePages>1?<><button type="button" disabled={sourcePage===0} onClick={()=>edit({sourcePage:sourcePage-1})}>前两项来源</button><span>{sourcePage+1}/{sourcePages}</span><button type="button" disabled={sourcePage===sourcePages-1} onClick={()=>edit({sourcePage:sourcePage+1})}>后两项来源</button></>:null}</div></div></>:currentMemory?<><div className="clipping-paper-heading"><span>{memoryNames[currentMemory.domain]??'前世方向'} · 前世片段{index+1}</span><span className="clipping-read-mark">{currentMemory.favorite?'已夹书签':'未收藏'}</span></div><blockquote>{currentMemory.hint}</blockquote><p className="clipping-prepared">{currentMemory.prepared?'本局已经留下对应准备。':'本局还没有对应准备。'}</p>{currentMemory.status==='deviated'||currentMemory.status==='intervened'?<p className="clipping-context">{currentMemory.status==='deviated'?'本局走向已偏离这段旧记忆，不能照搬旧轨迹。':'本局已作出影响这条线的选择，结果仍看这一次的经历。'}</p>:null}</>:<div className="clipping-unavailable" role="status"><h2>先选回一份可以核对的纸页。</h2><p>{id?'原纸页的身份或日期已不可核，没有换成另一份。':'从左侧明确选择一份来信或片段。'}</p><button type="button" onClick={onFull}>翻原完整手记</button></div>}
    {showFeedback?<div className="clipping-feedback" aria-label="刚才这页的回响">{feedback}</div>:null}
    {action?<div className="clipping-controls">{action}{known&&rows.length>1?<nav className="clipping-leaf-turn" aria-label="逐份翻阅纸页"><button type="button" disabled={index===0} onClick={()=>{const next=rows[index-1];if(next)select(next.id,index-1)}}>← 前一份</button><span>{index+1}/{rows.length}</span><button type="button" disabled={index===rows.length-1} onClick={()=>{const next=rows[index+1];if(next)select(next.id,index+1)}}>后一份 →</button></nav>:null}</div>:null}
   </article>
  </div>
  {news.length!==world.news.length?<p className="clipping-source-warning" role="status">有来源日期尚不可核对，原完整手记仍可翻阅。</p>:null}
 </section>
}
