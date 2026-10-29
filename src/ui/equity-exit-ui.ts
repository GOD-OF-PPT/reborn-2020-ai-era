import type {EquityJourney} from './equity-journey.ts'
export type EquityExitMark='planned'|'running'|'quote'|'waiting'|'due'|'partial'|'collected'|'zero'|'no-buyer'|'expired'|'stopped'|'source-unknown'
export function equityExitMark(journey:EquityJourney):EquityExitMark|null{
 if(journey.resolution.target?.kind!=='exit'||journey.resolution.status!=='valid'||!journey.resolution.exit)return null
 const e=journey.resolution.exit
 if(journey.phase==='exit-planned')return 'planned'
 if(journey.phase==='exit-running')return 'running'
 if(journey.phase==='quote')return 'quote'
 if(journey.phase==='collection-source-unknown'||journey.phase==='collection-source-partial')return 'source-unknown'
 if(journey.phase==='collected')return 'collected'
 if(journey.phase==='transfer-no-credit')return 'zero'
 if(journey.phase==='receivable')return 'waiting'
 if(journey.phase==='collection')return e.collectedFen>0?'partial':'due'
 if(journey.phase==='no-buyer')return 'no-buyer'
 if(journey.phase==='quote-expired')return 'expired'
 if(journey.phase==='exit-stopped')return 'stopped'
 return 'source-unknown'
}
export const equityExitMarkText:Record<EquityExitMark,string>={planned:'询价已排期 · 尚未开工',running:'买方调查中 · 尚无报价',quote:'原有限报价 · 还未成交',waiting:'股份已转出 · 等原款到期',due:'原款已到期 · 尚未收取',partial:'已收一部分 · 原余款仍在',collected:'本笔实际现金已核齐',zero:'未形成净款 · 原转让记录', 'no-buyer':'本次无人接手 · 未售股保留',expired:'原报价已结束 · 未售股保留',stopped:'原调查已停 · 尚无报价','source-unknown':'原款记录保留 · 现金来源待核'}
