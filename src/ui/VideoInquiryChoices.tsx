import {useEffect,useRef} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import './video-inquiry-choices.css'

export type VideoInquiry=NonNullable<GamePanelProps['features']['video']>['channels'][number]['leads'][number]
type Props={p:GamePanelProps;contextKey:string;name:string;leads:readonly VideoInquiry[];preview:VideoInquiry|null;selected:VideoInquiry|null;priceFen:number;prepaymentFen:number;includedRevisions:number;onBrowse:(lead:VideoInquiry)=>void;onSelect:(lead:VideoInquiry)=>void}
const same=(a:VideoInquiry|null,b:VideoInquiry|null)=>!!a&&!!b&&a.personId===b.personId&&a.cohortId===b.cohortId
/** Flip real anonymous inquiries; looking at one never accepts or chooses it. */
export function VideoInquiryChoices({p,contextKey,name,leads,preview,selected,priceFen,prepaymentFen,includedRevisions,onBrowse,onSelect}:Props){
 const live=useRef(true),scope=useRef<{key:string;owner:GamePanelProps['controller'];view:GamePanelProps['view'];session:string|undefined;browse:Props['onBrowse'];select:Props['onSelect']}|null>(null)
 const index=leads.findIndex(lead=>same(lead,preview)),selectedIndex=leads.findIndex(lead=>same(lead,selected)),key=JSON.stringify([contextKey,leads,preview,selected])
 if(!scope.current||scope.current.key!==key||scope.current.owner!==p.controller||scope.current.view!==p.view||scope.current.session!==p.controller.runtimeSession||scope.current.browse!==onBrowse||scope.current.select!==onSelect)scope.current={key,owner:p.controller,view:p.view,session:p.controller.runtimeSession,browse:onBrowse,select:onSelect}
 const source=scope.current,current=()=>live.current&&scope.current===source
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const browse=(lead:VideoInquiry)=>makeSharedAction(p,'翻看另一份询价',()=>onBrowse(lead),{allowReadOnly:true,canActivate:current}),pick=preview?makeSharedAction(p,'选择这份询价',()=>onSelect(preview),{allowReadOnly:true,canActivate:current}):null
 const before=index>0?browse(leads[index-1]!):null,after=index>=0&&index+1<leads.length?browse(leads[index+1]!):null,back=selectedIndex>=0&&!same(selected,preview)?browse(leads[selectedIndex]!):null,restart=index<0&&leads.length?browse(leads[0]!):null
 return <section className="video-inquiry-choices" aria-label="翻阅并明确选择一份真实询价">
  <div className="video-inquiry-paper">
   <p className="video-inquiry-number">{index>=0?'询价 '+(index+1)+' / '+leads.length:'原询价需要重新选择'}</p>
   <h3>先听这一份，再谈怎么做。</h3>
   {preview&&index>=0?<><p>来自这个账号已有的受众，尚未成为委托。</p><label className="video-inquiry-pick"><input type="radio" name={name} checked={same(selected,preview)} disabled={pick!.disabled} onChange={pick!.activate}/><span>{same(selected,preview)?'已选这份询价':'选择这份询价'}</span></label>{pick!.reason?<p className="reason">{pick!.reason}</p>:null}</>:<p role="status">原来翻看的询价已不在当前可接名单，请重新翻阅。</p>}
   <nav aria-label="翻阅真实询价"><button type="button" disabled={!before||before.disabled} onClick={before?.activate}>← 上一份询价</button><button type="button" disabled={!after||after.disabled} onClick={after?.activate}>下一份询价 →</button></nav>
   {back?<p className="video-inquiry-selected">已选第{selectedIndex+1}份，翻阅不会换人。<button type="button" disabled={back.disabled} onClick={back.activate}>回到已选询价</button></p>:null}
   {restart?<button type="button" className="video-inquiry-restart" disabled={restart.disabled} onClick={restart.activate}>从第一份重新翻阅</button>:null}
  </div>
  <aside className="video-inquiry-terms" aria-label="这笔商单的原条件"><p>先把条件看清</p><dl><div><dt>约定报价</dt><dd>{moneyText(priceFen)}</dd></div><div><dt>保护预款</dt><dd>{moneyText(prepaymentFen)}</dd></div></dl><p>收到预款时须保留，用于这单交付或退款。当期收入仍为¥0。</p><p>条款包含{includedRevisions}轮修改；验收与实收分别发生。制作投入下一步核对。</p></aside>
 </section>
}
