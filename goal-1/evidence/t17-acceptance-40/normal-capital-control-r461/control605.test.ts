import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {original605Remainder} from './control605.ts'
const c=JSON.parse(fs.readFileSync(new URL('./control605.json',import.meta.url),'utf8'))
test('continues exactly the five unfinished renewals, before recharge and the original Aug1 service',()=>{const result=original605Remainder(c);assert.deepEqual(result.remainingRenewals,c.customers.slice(15).map((x:{id:string})=>x.id));assert.equal(result.remainingRenewals.length,5);assert.equal(result.from,'2024-08-01');assert.equal(result.to,'2024-08-29');assert.equal(result.nextCommandId,'normal-capital-v2:606');assert.equal(result.nextQuarter,4)})
test('rejects a changed revision/date/business/account or budget instead of starting2025',()=>{for(const patch of [{revision:637},{date:'2025-01-01'},{businessId:'other'},{accountId:'personal'},{budget:{...c.budget,available:0,spent:4}}])assert.throws(()=>original605Remainder({...c,...patch}))})
test('rejects an already arranged period or unresolved prior period',()=>{assert.throws(()=>original605Remainder({...c,periodCount:1}));assert.throws(()=>original605Remainder({...c,activePeriods:['active']}));assert.throws(()=>original605Remainder({...c,periods:[{id:'unexpected'}]}))})
test('rejects changed customer order, duplicate customer or a replayed already-renewed command',()=>{assert.throws(()=>original605Remainder({...c,customers:[...c.customers].reverse()}));assert.throws(()=>original605Remainder({...c,customers:[c.customers[0],...c.customers.slice(0,-1)]}));assert.throws(()=>original605Remainder({...c,customers:c.customers.map((x:object,i:number)=>i===15?{...x,termEnd:c.renewedTerm}:x)}))})
test('rejects a changed local date range or original supply coverage',()=>{for(const patch of [{from:'2024-08-02'},{to:'2024-09-01'},{required:'2024-08-29'},{permissions:[]},{permissions:[{id:'old',expiresAt:'2024-08-28'}]}])assert.throws(()=>original605Remainder({...c,...patch}))})
