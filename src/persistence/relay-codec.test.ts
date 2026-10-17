import {beforeAll,expect,it} from 'vitest'
import {replayRelayF04} from '../testing/relay-scenarios.ts'
import {hashValue} from '../core/hash.ts'
import {queueEvent} from '../core/timeline.ts'
import {relayId} from '../core/relay.ts'
import {createCampaignCodec} from '../application/campaign.ts'
import previousCourse from '../../goal-1/evidence/t11-browser-closed.json?raw'
let scenario:ReturnType<typeof replayRelayF04>
beforeAll(()=>{scenario=replayRelayF04()},60000)
it.each(['quantity','actual-truth','prepaid','wrong-cost','new-credit','authorization','grant-expiry','fake-adapter','orphan-timer','duplicate-customer'])('refuses a resigned inconsistent relay save: %s',variant=>{
 const raw=JSON.parse(scenario.end),s=raw.state.relay
 if(variant==='quantity')s.meters[0].reportedUnits++
 if(variant==='actual-truth'){s.meters[0].actualUnits--;s.meters[0].missedUnits++}
 if(variant==='prepaid')s.recharges[0].usedFen--
 if(variant==='wrong-cost')s.meters[0].costOperationId=s.meters[1].costOperationId
 if(variant==='new-credit'){s.customers[0].initialMode='postpaid';s.customers[0].mode='postpaid';s.customers[0].initialCreditLimitFen=2000000;s.customers[0].creditLimitFen=2000000}
 if(variant==='authorization')s.periods[0].maxSupplierCostFen++
 if(variant==='grant-expiry')s.applications[0].expiresAt='2026-12-31'
 if(variant==='fake-adapter')s.adapters[0].jobId='no-job'
 if(variant==='duplicate-customer')s.customers.push({...s.customers[0],id:'another-customer'})
 if(variant==='orphan-timer')raw.state.timeline=queueEvent(raw.state.timeline,{instanceId:relayId('meter_day','orphan','2025-02-14'),date:'2025-02-14',phase:'player_actions',priority:250,payload:{kind:'relay_event',type:'meter_day',entityId:'orphan',date:'2025-02-14'}})
 const {checksum:_,...body}=raw;raw.checksum=hashValue(body);expect(()=>scenario.h.codec.import(JSON.stringify(raw))).toThrow();expect(scenario.h.codec.export(scenario.h.codec.import(scenario.end))).toBe(scenario.end)
})
it('refuses and preserves the schema8 course export explicitly',()=>{const codec=createCampaignCodec(),before=hashValue(previousCourse);expect(()=>codec.import(previousCourse)).toThrow('UNSUPPORTED_SCHEMA_VERSION');expect(hashValue(previousCourse)).toBe(before)})
