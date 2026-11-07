import type {VideoClientSettlementReading} from './video-client-settlement.ts'
import {moneyText} from './game-text.ts'
import './video-client-receipt.css'

export function VideoClientReceipt({value,condensed=false}:{value:VideoClientSettlementReading;condensed?:boolean}){
 const direct=value.directPaidFen===null?'直接投入来源待核':'直接实付'+moneyText(value.directPaidFen),fee=value.feePaidFen===null?'本单费用已结，实付来源待核':'结算费实付'+moneyText(value.feePaidFen)
 return <section className="video-client-receipt" data-condensed={condensed?true:undefined} aria-label="这笔原商单的实际收支">
  <div className="video-client-received"><span>实际已收</span><strong>{moneyText(value.receivedFen)}</strong><time dateTime={value.settledAt}>{value.settledAt}{condensed?' · ':<br/>}本单收齐</time></div>
  {condensed?<p className="video-client-all-details"><span>前款{moneyText(value.prepaymentFen)}</span><span>余款{moneyText(value.balanceFen)}</span><span>{direct}</span><span>{fee}</span><small className="video-client-context">日常费用另记。</small></p>:<><p>前款{moneyText(value.prepaymentFen)} · 余款{moneyText(value.balanceFen)}</p><p className="video-client-paid"><span>{direct}</span><span>{fee}</span><small className="video-client-context">日常费用另记。</small></p></>}
 </section>
}
