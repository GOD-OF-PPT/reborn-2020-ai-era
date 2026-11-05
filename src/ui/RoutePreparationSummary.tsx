import type {PreparationRoute,RoutePreparationReading} from './route-preparation-reading.ts'
import {moneyText} from './game-text.ts'
import './route-preparation.css'

export function RoutePreparationSummary({route,reading}:{route:PreparationRoute;reading:RoutePreparationReading}){
 const r=route.requirements
 return <section className="route-preparation-summary" aria-label={route.name+'的简明条件'}>
  <p className="route-preparation-story">{route.preparation}</p>
  <dl className="route-preparation-facts">
   <div><dt>起步资金门槛</dt><dd>{moneyText(r.minimumCashFen)}</dd><small>门槛，不是本次付款</small></div>
   <div><dt>{route.accountId==='personal'?'个人可花':'这项经营的企业可花'}</dt><dd>{moneyText(r.availableCashFen)}</dd>{reading.fundsShort?<small className="reason">还未达到起步门槛</small>:null}</div>
   <div><dt>准备材料</dt><dd>{r.preparationKey===null?'本段无需':r.preparationReady?'已经备好':'尚待完成'}</dd></div>
  </dl>
  {reading.barriers.length?<div className="route-preparation-barriers" aria-label="仍需准备的条件">{reading.barriers.map(line=><p key={line}>{line}</p>)}</div>:null}
  <p className="route-preparation-boundary">{reading.boundary}</p>
  {reading.futureTools?<p className="route-preparation-future">手工剪辑可另看安排；未来AI工具仍须等待年代与资格。</p>:null}
 </section>
}
