import {beforeAll,expect,it} from 'vitest'
import {signedEquity,offeredEquityExit,completedEco} from '../testing/deepseek-scenarios.ts'
import {hashValue} from '../core/hash.ts'
import {queueEvent} from '../core/timeline.ts'
import {dsEvent} from '../core/deepseek-state.ts'
import {createCampaignCodec} from '../application/campaign.ts'
import previousRelay from '../../goal-1/evidence/t12-browser-final.json?raw'
let equity:ReturnType<typeof signedEquity>,exit:ReturnType<typeof offeredEquityExit>,eco:ReturnType<typeof completedEco>,raw:string,exitRaw:string,ecoRaw:string
beforeAll(()=>{equity=signedEquity();equity.h.send('AdvanceTime',{date:'2025-09-30'});raw=equity.h.codec.export(equity.h.run);exit=offeredEquityExit();exit.h.send('AcceptEquityExit',{exitId:exit.exit.id,shares:50000});exitRaw=exit.h.codec.export(exit.h.run);eco=completedEco();ecoRaw=eco.h.codec.export(eco.h.run)},60000)
const resign=(value:Record<string,unknown>)=>{const {checksum:_,...body}=value;return JSON.stringify({...body,checksum:hashValue(body)})}
it.each(['shares','denominator','round-money','issued-shares','free-governance','short-lock','historical-label','lot-basis','qualification','consent','owner','fact-source','orphan-event'])('rejects a resigned inconsistent equity state: %s',variant=>{
 const v=JSON.parse(raw),s=v.state.deepseek,a=s.agreements[0]
 if(variant==='shares')a.shares++
 if(variant==='denominator')s.rounds[1].totalShares++
 if(variant==='round-money')s.rounds[0].newMoneyFen++
 if(variant==='issued-shares')s.rounds[1].issuedShares++
 if(variant==='free-governance')a.board=true
 if(variant==='short-lock')a.lockUntil='2025-04-30'
 if(variant==='historical-label')a.classification='historical'
 if(variant==='lot-basis')a.lots[0].remainingCostFen--
 if(variant==='qualification')s.preparations=s.preparations.filter((p:{kind:string})=>p.kind!=='eligibility')
 if(variant==='consent')s.invitations[0].financingConsent=false
 if(variant==='owner')a.accountId='world'
 if(variant==='fact-source')v.state.facts.find((f:{id:string})=>f.id===s.invitations[0].termsFactId).sourceEventId='other-invitation'
 if(variant==='orphan-event')v.state.timeline=queueEvent(v.state.timeline,dsEvent('follow_round','orphan','2025-10-01'))
 expect(()=>equity.h.codec.import(resign(v))).toThrow();expect(equity.h.codec.export(equity.h.codec.import(raw))).toBe(raw)
})
it.each(['quote','private-receivable','disposed-basis','collection-grant'])('rejects a resigned private-sale mismatch: %s',variant=>{const v=JSON.parse(exitRaw),s=v.state.deepseek;if(variant==='quote')s.exits[0].unitPriceFen++;if(variant==='private-receivable')v.state.economy.ledger.privateReceivables[0].remainingFen++;if(variant==='disposed-basis')s.agreements[0].disposedBasisFen--;if(variant==='collection-grant')s.exits[0].collectedFen++;expect(()=>exit.h.codec.import(resign(v))).toThrow()})
it.each(['prepayment','income','support','duplicate-person','unearned-cancellation'])('rejects a resigned ecosystem contract mismatch: %s',variant=>{const v=JSON.parse(ecoRaw),s=v.state.deepseek;if(variant==='prepayment')s.contracts[0].prepaymentFen++;if(variant==='income')s.deliveries[0].creditFen++;if(variant==='support')s.contracts[0].supportPostedAt='2024-07-01';if(variant==='unearned-cancellation'){s.contracts[0].status='cancelled';s.contracts[0].cancelledAt=v.state.timeline.cursor.date;s.contracts[0].supportPostedAt=null}if(variant==='duplicate-person')s.leads.push({...s.leads[0],id:'fake-second-lead'});expect(()=>eco.h.codec.import(resign(v))).toThrow()})
it('explicitly refuses and preserves the previous schema9 relay export',()=>{const before=hashValue(previousRelay);expect(()=>createCampaignCodec().import(previousRelay)).toThrow('UNSUPPORTED_SCHEMA_VERSION');expect(hashValue(previousRelay)).toBe(before)})
