import {expect,it} from 'vitest'
import {StoryHarness} from '../testing/story-harness.ts'
import {projectWorkbench} from './workbench-projection.ts'
import {campaignRuntime,campaignOperations,campaignMarket} from './campaign.ts'
import {playableAdvanceDate} from './playable-advance.ts'
import {addDays} from '../core/calendar.ts'

const view=(h:StoryHarness)=>projectWorkbench(h.run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog)
it('stops a quarterly convenience advance at actual personal-work completion',()=>{
 const h=new StoryHarness({seed:'t15-workbench-running'});h.send('DeclineOffer',{offerId:'manual-first-2020'});h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null})
 const w=view(h);expect(w.progression.quarterTarget).toBe('2020-01-08');expect(w.progression.barrierLabel).toContain('生活');expect(playableAdvanceDate(w,'2020-01-01','2020-03-31')).toBe('2020-01-08')
 h.at('2020-01-08',{work:false});expect(view(h).progression.quarterTarget).toBe('2020-03-31')
},60000)
it('leaves the final response day usable and advances the ignored invitation to its real default event',()=>{
 const h=new StoryHarness({seed:'t15-workbench-offer'});h.send('DeclineOffer',{offerId:'manual-first-2020'});h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});h.at('2020-01-04',{work:false});const offer=h.run.life!.promises[0]!
 h.at(offer.expiresAt,{work:false});const w=view(h),expiry=addDays(offer.expiresAt,1)
 expect(w.progression.quarterTarget).toBe(expiry);expect(playableAdvanceDate(w,offer.expiresAt,'2020-03-31')).toBe(expiry)
 h.at(expiry,{work:false});expect(h.run.life!.promises[0]!.status).toBe('expired');expect(view(h).progression.quarterTarget).toBe('2020-03-31')
},60000)
it('keeps the accepted promise deadline visible even when no work was started',()=>{
 const h=new StoryHarness({seed:'t15-workbench-accepted'});h.send('DeclineOffer',{offerId:'manual-first-2020'});h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});h.at('2020-01-04',{work:false});const offer=h.run.life!.promises[0]!;h.send('AcceptLifePromise',{promiseId:offer.id,consent:true})
 expect(view(h).progression.quarterTarget).toBe(offer.deadline);h.at(offer.deadline,{work:false});expect(h.run.life!.promises[0]!.status).toBe('missed');expect(view(h).progression.quarterTarget).toBe('2020-03-31')
},60000)
