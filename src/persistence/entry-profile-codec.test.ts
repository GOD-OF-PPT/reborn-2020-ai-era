import { expect,it } from 'vitest'
import { createCampaignCodec,createCampaignRun } from '../application/campaign.ts'
import { hashValue } from '../core/hash.ts'
import oldMarket from '../../goal-1/evidence/t08-normal-q01-initial.json?raw'
const codec=createCampaignCodec(),saved=codec.export(createCampaignRun({runId:'profile-import',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'profile-import-seed'}))
it.each(['wish','extra-money','approach'])('refuses a resigned profile mismatch: %s',variant=>{const raw=JSON.parse(saved);if(variant==='wish')raw.state.playerProfile.wishId='own_brand';if(variant==='extra-money')raw.state.playerProfile.cashBonus=100000;if(variant==='approach')raw.state.playerProfile.approach='automatic_funding';const {checksum:ignored,...body}=raw;expect(ignored).toBeTruthy();raw.checksum=hashValue(body);expect(()=>codec.import(JSON.stringify(raw))).toThrow();expect(codec.export(codec.import(saved))).toBe(saved)})
it('explicitly refuses the old schema5 while retaining its original export',()=>{expect(()=>codec.import(oldMarket)).toThrow('UNSUPPORTED_SCHEMA_VERSION')})
