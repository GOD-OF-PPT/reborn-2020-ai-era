import type {PlayerThreadView} from './player-thread.ts'
import type {VideoPaperState} from './VideoContinuityPaper.tsx'

/** Art only names a public committed stage. A measured publication is never a cash receipt. */
export function videoPaperFor(thread:PlayerThreadView):VideoPaperState|undefined{
 if(thread.focus.kind!=='video'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired)return undefined
 if(thread.focusScope==='history')return {phase:'history'}
 const stage=thread.stage
 if(stage==='video-planned'||stage==='video-marketing-planned')return {phase:'planned'}
 if(stage==='video-running'||stage==='video-marketing-running')return {phase:'making'}
 if(stage==='video-self-review')return {phase:'review'}
 if(stage==='video-submit'||stage==='video-ready-to-publish')return {phase:'delivery'}
 if(stage==='video-revision'||stage==='video-quality')return {phase:'revision'}
 if(['video-payment-wait','video-affiliate-window','video-platform-payment-wait','video-platform-collect'].includes(stage))return {phase:'settlement'}
 if(thread.outcome==='non-success')return {phase:'non-success'}
 if(thread.outcome==='actual')return {phase:'result'}
 if(thread.wait||stage==='video-negotiating')return {phase:'feedback'}
 return {phase:'entry'}
}
