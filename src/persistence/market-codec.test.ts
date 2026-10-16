import { beforeAll,expect,it } from 'vitest'
import { createMarketFixture,stockOrder } from '../testing/market-fixture.ts'
import { hashValue } from '../core/hash.ts'
import { createCampaignCodec } from '../application/campaign.ts'
import oldFirstOrder from '../../goal-1/evidence/t07-technical-success-initial.json?raw'
const f=createMarketFixture();let settled='',pending='',paid=''
beforeAll(()=>{let r=f.apply(f.run,'PlaceStockOrder',stockOrder());r=f.apply(r,'AdvanceTime',{date:'2020-01-03'});settled=f.codec.export(r);r=f.apply(r,'PlaceStockOrder',stockOrder({side:'sell',quoteId:'p0',limitPriceFen:1200}));r=f.apply(r,'AdvanceTime',{date:'2020-01-04'});pending=f.codec.export(r);r=f.apply(r,'AdvanceTime',{date:'2020-01-05'});paid=f.codec.export(r)},15000)
it.each(['lot-date','qty','basis','missing-position','fee','volume','duplicate-priority','missing-match','event-phase','missing-ar','ar-balance','early-permission','historical','paid-missing-ar','order-date','eligibility','current-quote'])('refuses a resigned market save with %s',variant=>{
 const raw=JSON.parse(variant==='paid-missing-ar'?paid:variant==='missing-ar'||variant==='ar-balance'?pending:settled),s=raw.state.market
 if(variant==='lot-date')s.positions[0].lots[0].availableAt='2020-01-01'
 if(variant==='qty')s.positions[0].quantity++
 if(variant==='basis')s.positions[0].buyFeesFen=0
 if(variant==='missing-position')s.positions=[]
 if(variant==='fee')s.fills[0].feeFen=0
 if(variant==='volume')s.history[0].volume=1
 if(variant==='duplicate-priority'){s.orders.push({...s.orders[0],id:'duplicate-order',status:'cancelled',quantity:1,remaining:1,grossFilledFen:0,feesPaidFen:0})}
 if(variant==='missing-match')raw.state.timeline.pending=raw.state.timeline.pending.filter((e:{payload:{type?:string;entityId?:string}})=>e.payload.type!=='match'||e.payload.entityId!=='p1')
 if(variant==='event-phase'){const e=raw.state.timeline.pending.find((e:{payload:{type?:string}})=>e.payload.type==='match');e.phase='world_update'}
 if(variant==='paid-missing-ar')raw.state.economy.ledger.marketReceivables=[]
 if(variant==='order-date')s.orders[0].submittedAt='2020-01-03'
 if(variant==='eligibility')s.orders[0].eligibleIndex=1
 if(variant==='current-quote')s.quotes[0].priceFen=999
 if(variant==='missing-ar')raw.state.economy.ledger.marketReceivables=[]
 if(variant==='ar-balance')raw.state.economy.ledger.marketReceivables[0].remainingFen--
 if(variant==='early-permission')s.permissions.push({id:'sim-experimental-access',date:'2020-01-01',sourceId:'not-researched'})
 if(variant==='historical')s.mode='historical'
 const {checksum:ignored,...body}=raw;expect(ignored).toBeTruthy();raw.checksum=hashValue(body);expect(()=>f.codec.import(JSON.stringify(raw))).toThrow();expect(f.codec.export(f.codec.import(settled))).toBe(settled)
})
it('explicitly refuses schema4 without modifying its original export',()=>{const before=hashValue(oldFirstOrder);expect(()=>createCampaignCodec().import(oldFirstOrder)).toThrow('UNSUPPORTED_SCHEMA_VERSION');expect(hashValue(oldFirstOrder)).toBe(before)})
