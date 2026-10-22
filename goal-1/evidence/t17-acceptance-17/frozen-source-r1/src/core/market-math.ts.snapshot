import { money } from './money.ts'
import { requireRule } from './errors.ts'
import type { MarketRule } from './market-types.ts'
export function stockValue(price:number,quantity:number):number {money(price);requireRule(Number.isSafeInteger(quantity)&&quantity>=0&&quantity<=1000000000,'INVALID_STOCK_QUANTITY');const value=BigInt(price)*BigInt(quantity);return money(Number(value))}
export function ratioFloor(value:number,numerator:number,denominator:number):number{requireRule(Number.isSafeInteger(numerator)&&Number.isSafeInteger(denominator)&&numerator>=0&&denominator>0,'INVALID_ALLOCATION_RATIO');return money(Number(BigInt(money(value))*BigInt(numerator)/BigInt(denominator)))}
export function rateFee(gross:number,bps:number):number{return money(Number((BigInt(money(gross))*BigInt(bps)+5000n)/10000n))}
export function orderFee(gross:number,rule:MarketRule,side:'buy'|'sell'):number{return gross===0?0:money(Math.max(rule.minimumCommissionFen,rateFee(gross,rule.commissionBps))+(side==='sell'?rateFee(gross,rule.sellTaxBps):0))}
