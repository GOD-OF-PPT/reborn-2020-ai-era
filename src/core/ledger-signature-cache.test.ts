import {afterEach,expect,it,vi} from 'vitest'
import {applyLedger,assertLedger,createLedger} from './ledger.ts'
import {canonicalJson} from './identity.ts'

afterEach(()=>vi.restoreAllMocks())
function original(){
 let state=createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2020-01-01')
 const stamp=(id:string)=>({id,date:'2020-01-01',sourceEventId:'supplier-cache-regression',accountId:'personal'})
 state=applyLedger(state,{...stamp('opening'),kind:'opening_cash',counterpartyId:'world',amountFen:1000})
 state=applyLedger(state,{...stamp('prepay'),kind:'supplier_prepay',businessId:'relay',prepaymentId:'pool',counterpartyId:'world',amountFen:200})
 state=applyLedger(state,{...stamp('consume'),kind:'consume_supplier',businessId:'relay',prepaymentId:'pool',amountFen:50})
 state=applyLedger(state,{...stamp('invoice'),kind:'incur_supplier_usage',businessId:'relay',prepaymentId:'pool',counterpartyId:'world',obligationId:'due',dueAt:'2020-01-02',amountFen:50})
 // Fresh receipt objects model codec/worker reads, not an already warm singleton.
 return {...state,receipts:state.receipts.map(x=>({...x})),metrics:state.metrics.map(x=>({...x})),obligations:state.obligations.map(x=>({...x})),supplierPrepayments:state.supplierPrepayments.map(x=>({...x}))}
}
it('parses each unchanged receipt once across repeated real whole-ledger validations',()=>{
 const ledger=original(),before=canonicalJson(ledger),parse=vi.spyOn(JSON,'parse')
 for(let i=0;i<20;i++)assertLedger(ledger)
 expect(parse).toHaveBeenCalledTimes(ledger.receipts.length)
 expect(canonicalJson(ledger)).toBe(before)
})
it('reparses a changed signature and still checks the current cost, invoice and asset balances',()=>{
 const ledger=original(),receipt=ledger.receipts.find(x=>x.id==='consume')!,signature=receipt.signature
 assertLedger(ledger)
 receipt.signature=canonicalJson({...JSON.parse(signature),amountFen:49})
 expect(()=>assertLedger(ledger)).toThrow('SUPPLIER_COST_HISTORY_MISMATCH')
 receipt.signature=signature;assertLedger(ledger)
 const metric=ledger.metrics.find(x=>x.operationId==='consume')!,delta=metric.deltaFen
 metric.deltaFen=delta+1;expect(()=>assertLedger(ledger)).toThrow('SUPPLIER_COST_HISTORY_MISMATCH');metric.deltaFen=delta
 const invoice=ledger.obligations.find(x=>x.id==='due')!;invoice.remainingFen=49
 expect(()=>assertLedger(ledger)).toThrow('SUPPLIER_INVOICE_HISTORY_MISMATCH');invoice.remainingFen=50
 ledger.supplierPrepayments[0]!.remainingFen=149
 expect(()=>assertLedger(ledger)).toThrow('SUPPLIER_HISTORY_MISMATCH');ledger.supplierPrepayments[0]!.remainingFen=150
 assertLedger(ledger)
})
it('never treats warm parsing as a duplicate-id or receipt-status approval',()=>{
 const ledger=original(),receipt=ledger.receipts[0]!,id=receipt.id
 assertLedger(ledger);receipt.id=ledger.receipts[1]!.id
 expect(()=>assertLedger(ledger)).toThrow('DUPLICATE_LEDGER_RECEIPT');receipt.id=id
 Object.defineProperty(receipt,'status',{value:'invalid',writable:true,enumerable:true,configurable:true})
 expect(()=>assertLedger(ledger)).toThrow('INVALID_RECEIPT_STATUS')
})
it('retains native JSON parse/property failures after warming, including non-string signatures',()=>{
 const ledger=original(),receipt=ledger.receipts[0]!,signature=receipt.signature
 assertLedger(ledger)
 for(const [value,ErrorType]of [['{invalid',SyntaxError],['null',TypeError],[undefined,SyntaxError]] as const){
  Object.defineProperty(receipt,'signature',{value,writable:true,enumerable:true,configurable:true})
  expect(()=>assertLedger(ledger)).toThrow(ErrorType)
 }
 receipt.signature=signature;assertLedger(ledger)
 // Public low-level callers do not acquire a new WeakMap key/type error path.
 const invalid={...ledger,receipts:[null,...ledger.receipts.slice(1)]}
 expect(()=>assertLedger(invalid as unknown as typeof ledger)).toThrow(TypeError)
})
it('reads an accessor signature on every call rather than caching the property read',()=>{
 const ledger=original(),receipt=ledger.receipts[0]!,signature=receipt.signature;let reads=0,current=signature
 Object.defineProperty(receipt,'signature',{enumerable:true,configurable:true,get(){reads++;return current}})
 assertLedger(ledger);assertLedger(ledger);expect(reads).toBe(2)
 current='{invalid';expect(()=>assertLedger(ledger)).toThrow(SyntaxError);expect(reads).toBe(3)
})
it('does not reuse a different receipt object and does not cache oversized signature text',()=>{
 const ledger=original(),first=ledger.receipts[0]!,signature=first.signature,parse=vi.spyOn(JSON,'parse')
 assertLedger(ledger);ledger.receipts[0]={...first};assertLedger(ledger)
 expect(parse.mock.calls.filter(([text])=>text===signature)).toHaveLength(2)
 // assertLedger's original direct-input behavior ignores unrelated JSON fields;
 // RunCodec continues to reject these non-domain records in its own schema.
 const large=canonicalJson({...JSON.parse(signature),unrelated:'x'.repeat(8192)})
 ledger.receipts[0]!.signature=large;parse.mockClear();assertLedger(ledger);assertLedger(ledger)
 expect(parse.mock.calls.filter(([text])=>text===large)).toHaveLength(2)
})
it('evicts private parse reuse after its entry budget and keeps the ledger checks intact',()=>{
 const ledger=original(),signature=ledger.receipts[0]!.signature,parse=vi.spyOn(JSON,'parse')
 assertLedger(ledger)
 const receipts=Array.from({length:32769},(_,i)=>({id:'cache-entry:'+i,signature:'{"kind":"income"}',kind:'income' as const,status:'applied' as const,accountId:'personal',contractId:null}))
 // A low-level ledger validation stress input, not a valid campaign or a save.
 assertLedger({...ledger,receipts:[...ledger.receipts,...receipts]});assertLedger(ledger)
 expect(parse.mock.calls.filter(([text])=>text===signature)).toHaveLength(2)
})
it('evicts on aggregate text budget independently of the entry budget',()=>{
 const ledger=original(),signature=ledger.receipts[0]!.signature,parse=vi.spyOn(JSON,'parse')
 assertLedger(ledger)
 const large=canonicalJson({kind:'income',unrelated:'x'.repeat(8000)})
 const receipts=Array.from({length:2100},(_,i)=>({id:'cache-text:'+i,signature:large,kind:'income' as const,status:'applied' as const,accountId:'personal',contractId:null}))
 assertLedger({...ledger,receipts:[...ledger.receipts,...receipts]});assertLedger(ledger)
 expect(parse.mock.calls.filter(([text])=>text===signature)).toHaveLength(2)
})
