import type {ClockCommitmentProjection} from '../core/clock-projection-types.ts'
import {moneyText} from './game-text.ts'

export function ClockCommandDetails({projection,accountName}:{projection:ClockCommitmentProjection;accountName:(id:string)=>string}){
 const hasOutflows=projection.accounts.some(a=>a.outflows.length>0)
 return <section className="confirmation-context clock-command-context"><h3>这段日历中的原支出</h3><p>计划从{projection.from}到{projection.target}；遇到交付、选择或资金缺口，按实际停点处理。</p>
 {projection.targetPhase!=='snapshot'?<p>按本次选定的日内阶段核对；同日更晚阶段的付款尚未列入这一段。</p>:null}
 {projection.accounts.filter(a=>a.outflows.length>0).map(a=><section key={a.accountId}><h4>{accountName(a.accountId)}</h4><ul>{a.outflows.map(f=><li key={f.id}><strong>{f.date} · {f.label} · {moneyText(-f.amountFen)}</strong>{f.originalDueAt&&f.originalDueAt!==f.date?<p>原到期日{f.originalDueAt}，这笔未结责任仍在。</p>:null}{f.releasedFen>0?<p>{moneyText(f.releasedFen)}已列为资金占款，将按原引用转换或释放，不另占一份。</p>:null}</li>)}</ul></section>)}
 {!hasOutflows?<p>这段日期内没有按确定金额登记的其他付款；未成交委托与未出账仍按原条款处理。</p>:null}
 {projection.accounts.filter(a=>a.accruedAtFromFen>0).map(a=><p key={'accrued:'+a.accountId}>{accountName(a.accountId)}截至{projection.from}已用未出账{moneyText(a.accruedAtFromFen)}，是原成本的已有部分；不能与同一份到期账单重复相加。</p>)}
 <p>只列现有排程，未成交委托、未排期工作和未确定用量另行核对；原费用与义务保留，未到账不能支持当前支出。</p></section>
}
