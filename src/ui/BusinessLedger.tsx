import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {moneyText} from './game-text.ts'
type Funds=Pick<GamePanelProps['features']['workbench']['finance'][number],'availableFen'|'prepaidLiabilityFen'|'payableFen'|'protectionShortfallFen'|'commitmentShortfallFen'>
/** Compact reading layer; account responsibilities remain outside the optional full ledger. */
export function BusinessLedger({title,funds,children,open=false,status}:{title:string;funds:Funds|undefined;children:ReactNode;open?:boolean;status?:string}){
 const gap=funds?Math.max(funds.protectionShortfallFen,funds.commitmentShortfallFen):null
 return <section className="business-account"><div className="business-account-summary"><div className="section-heading"><h3>{title}</h3>{status?<span className="tag">{status}</span>:null}</div>{funds?<dl><div><dt>本主体可花</dt><dd>{moneyText(funds.availableFen)}</dd></div><div><dt>全部客户预款保护</dt><dd>{moneyText(funds.prepaidLiabilityFen)}</dd></div><div><dt>未结应付</dt><dd>{moneyText(funds.payableFen)}</dd></div></dl>:<p role="alert">暂未取得本主体完整资金，请先核对账本。</p>}</div>{gap!==null&&gap>0?<p role="alert" className="error-box">保护或承诺资金存在{moneyText(gap)}真实缺口；不能用可花0掩盖。旧义务仍需处理。</p>:null}<details className="panel business-ledger" open={open||gap!==null&&gap>0}><summary>展开本主体账目、资金与经营收尾</summary>{children}</details></section>
}
export function WorkflowOverview({label,items}:{label:string;items:readonly {label:string;value:string;target?:string}[]}){return <section className="workflow-overview" aria-label={label}>{items.map((item,i)=><div key={item.label}><span className="workflow-number">0{i+1}</span><div><strong>{item.label}</strong><small>{item.value}</small>{item.target?<a href={'#'+encodeURIComponent(item.target)}>查看这一层 →</a>:null}</div></div>)}</section>}
