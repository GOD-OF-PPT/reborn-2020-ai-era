import { beforeAll,expect,it } from 'vitest'
import { createCampaignRun,createCampaignCodec } from '../application/campaign.ts'
import { evaluateCommand } from '../core/commands.ts'
import { hashValue } from '../core/hash.ts'
import oldOperations from '../../goal-1/evidence/t06-work-technical_employee-initial.json?raw'
const codec=createCampaignCodec(),registry=codec.registry
let accepted='',paid=''
beforeAll(()=>{let run=createCampaignRun({runId:'first-codec',actorId:'player',commandId:'create',seed:'first-codec-seed',backgroundId:'technical_employee'});const apply=(kind:string,payload:unknown)=>{const result=evaluateCommand(run,{runId:run.runId,actorId:'player',commandId:`codec-${run.revision}`,expectedRevision:run.revision,kind,payload},registry,'player');if(result.status!=='proposed')throw new Error(JSON.stringify(result));run=codec.import(codec.export(result.nextRun))};apply('StartFirstOrder',{});accepted=codec.export(run);apply('AdvanceTime',{date:'2020-01-19'});apply('SubmitDelivery',{contractId:run.operations?.contracts[0]?.id});apply('AdvanceTime',{date:'2020-01-20'});paid=codec.export(run)},20000)
it.each(['premature-case','missing-case','wrong-case-source','historical-contract','missing-expiry','accepted-and-declined'])('refuses a resigned inconsistent first-order save: %s',(variant)=>{
 const raw=JSON.parse(variant==='premature-case'||variant==='missing-expiry'?accepted:paid)
 if(variant==='premature-case')raw.state.world.preparations.push({key:'paid_manual_case',bindingId:'player',date:'2020-01-01',sourceEventId:raw.state.operations.contracts[0].id})
 if(variant==='missing-case')raw.state.world.preparations=[]
 if(variant==='wrong-case-source')raw.state.world.preparations[0].sourceEventId='not-the-contract'
 if(variant==='historical-contract')raw.state.operations.contracts[0].classification='historical'
 if(variant==='missing-expiry')raw.state.timeline.pending=raw.state.timeline.pending.filter((event:{payload:{type?:string}})=>event.payload.type!=='offer_expiry')
 if(variant==='accepted-and-declined')raw.state.operations.offerDecisions.push({offerId:'manual-first-2020',kind:'declined',date:'2020-01-01',sourceId:raw.state.operations.logs[0].id})
 const {checksum:ignored,...body}=raw;expect(ignored).toBeTruthy();raw.checksum=hashValue(body);expect(()=>codec.import(JSON.stringify(raw))).toThrow();expect(codec.export(codec.import(paid))).toBe(paid)
})
it('explicitly preserves and refuses the old schema3 baseline',()=>{expect(()=>codec.import(oldOperations)).toThrow('UNSUPPORTED_SCHEMA_VERSION')})
