import {expect,it} from 'vitest'
import {sceneCashResult} from './scene-cash-result.ts'

const row=(id:string,amountFen:number)=>({id,amountFen,date:'2025-11-01',sourceId:'original:'+id,businessId:null,contractId:null})
const a=(accountId:string,cashFen:number,transactions:ReturnType<typeof row>[]=[] )=>({accountId,cashFen,transactions})
const show=(before:ReturnType<typeof a>[],after:ReturnType<typeof a>[])=>sceneCashResult(before,after,'2025-10-29','2025-11-02',id=>id==='personal'?'个人':'生态服务')

it('reports actual gross payments and receipts separately even when net cash is unchanged',()=>{
 const copy=show([a('personal',1000000)],[a('personal',1000000,[row('cost',-400000),row('salary',400000)])])
 expect(copy).toContain('个人实际付出¥4,000，另收到¥4,000');expect(copy).not.toContain('利润')
})
it('preserves both accounts of an internal capital transfer rather than inventing consolidated income',()=>{
 const copy=show([a('personal',1000000),a('eco',0)],[a('personal',900000,[row('transfer',-100000)]),a('eco',100000,[row('transfer',100000)])])
 expect(copy).toContain('个人实际付出¥1,000；生态服务实际收到¥1,000');expect(copy).toContain('性质和逐笔来源仍按原账')
})
it('keeps missing, altered, duplicated, unsafe or future cash sources unknown rather than calling them zero',()=>{
 const old=row('old',-100),before=[a('personal',1000,[{...old,date:'2025-10-29'}])]
 const copies=[show(before,[a('personal',900,before[0]!.transactions)]),show(before,[a('personal',1000,[{...old,amountFen:-200}])]),show([a('personal',1000)],[a('personal',800,[row('x',-100),row('x',-100)])]),show([a('personal',1000)],[a('personal',999.5,[row('float',-0.5)])]),show([a('personal',1000)],[a('personal',900,[{...row('future',-100),date:'2025-11-03'}])])]
 for(const copy of copies)expect(copy).toContain('来源尚未完整核定')
 expect(show([a('personal',1000)],[a('personal',1000)])).toBeNull()
})
