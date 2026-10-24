import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRun,campaignVideo} from '../application/campaign.ts'
import {projectVideo} from '../core/video-projection.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import {VideoCommandDetails} from './VideoCommandDetails.tsx'

const run=createCampaignRun({runId:'video-terms-ui',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'video-terms-ui'})
const video=projectVideo(run,campaignVideo)
const command:CommandEnvelope={runId:run.runId,actorId:'player',commandId:'review-terms',expectedRevision:run.revision,kind:'AcceptVideoCommission',payload:{}}
it('separates the actual quote, protected prepayment, zero current income and future balance',()=>{
 const html=renderToStaticMarkup(<VideoCommandDetails command={command} video={video}/>)
 for(const text of ['¥3,000','¥900','会同时保护这笔钱','原单交付或退款','¥0','自有资金','2天复核','¥2,100','7天后才收款','5%'])expect(html).toContain(text)
})
it('uses the captured catalog including a no-prepayment contract instead of global defaults',()=>{
 const custom=video?{...video,catalog:{...video.catalog,commercial:{...video.catalog.commercial,priceFen:200000,prepaymentFen:0,reviewDays:3,paymentDays:14,feeBps:300}}}:null
 const html=renderToStaticMarkup(<VideoCommandDetails command={command} video={custom}/>)
 for(const text of ['¥2,000','本次不收预款','¥0','3天复核','14天后才收款','3%'])expect(html).toContain(text)
 expect(html).not.toContain('¥900');expect(html).not.toContain('¥3,000')
})
it('does not promise commission revenue when merely arranging an uncontracted sample',()=>{
 expect(renderToStaticMarkup(<VideoCommandDetails command={{...command,kind:'StartVideoWork'}} video={video}/>)).toBe('')
})
