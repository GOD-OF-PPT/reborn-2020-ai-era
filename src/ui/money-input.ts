import { MONEY_LIMIT } from '../core/money.ts'
/** Convert a displayed decimal amount to integer fen; rules validate ownership and affordability. */
export function parseMoneyInput(text:string):number|null{
 if(!/^\d+(\.\d{1,2})?$/.test(text))return null
 const [whole,fraction='']=text.split('.'),value=BigInt(whole!)*100n+BigInt(fraction.padEnd(2,'0'))
 return value>0n&&value<=BigInt(MONEY_LIMIT)?Number(value):null
}
