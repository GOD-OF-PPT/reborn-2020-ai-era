import { expect,it } from 'vitest'
import { createCampaignCodec,createCampaignRun } from './campaign.ts'
import { projectRun } from '../core/commands.ts'

it('preserves the chosen wish and approach through a normal save without granting money or skills',()=>{
 const codec=createCampaignCodec(),input={runId:'entry-profile',actorId:'player',commandId:'create',backgroundId:'content_employee',seed:'entry-profile-seed'}
 const chosen=createCampaignRun({...input,playerProfile:{wishId:'own_brand',approach:'investment'}})
 const normal=createCampaignRun(input),loaded=codec.import(codec.export(chosen))
 expect(projectRun(loaded)).toMatchObject({backgroundId:'content_employee',playerProfile:{wishId:'own_brand',approach:'investment'}})
 expect(chosen.economy).toEqual(normal.economy);expect(chosen.world?.entitlements).toEqual(normal.world?.entitlements);expect(chosen.market?.orders).toHaveLength(0)
})
