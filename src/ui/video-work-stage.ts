import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {resolveVideoFocus} from './video-player-thread.ts'
import {videoSceneProgress,type VideoSceneTarget} from './video-scene-progress.ts'

const stages=new Set(['video-planned','video-running','video-self-review','video-quality','video-ready-to-publish','video-published','video-platform-collect','video-platform-payment-wait','video-platform-paid','video-affiliate-window','video-stopped'])
/** A reading surface for this selected original sample; never an execution permission. */
export function videoWorkStage(p:GamePanelProps,thread:PlayerThreadView):boolean{
 if(p.view.phase!=='playing'||thread.focus.kind!=='video'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['current','carry'].includes(thread.focusScope)||!stages.has(thread.stage))return false
 const f=thread.focus,t=f.videoTarget
 if(!t?.workId||t.contractId||t.marketingId||f.accountId!==p.accountId||resolveVideoFocus(p,f).reason)return false
 const work=p.features.video?.works.find(w=>w.id===t.workId)
 return work?.contractId===null&&videoSceneProgress(p.features.video,p.view.date,t)?.stage===thread.stage
}
export function videoWorkCanReturnToday(p:GamePanelProps,thread:PlayerThreadView):boolean{
 return videoWorkStage(p,thread)&&thread.stage==='video-published'&&thread.outcome==='actual'
}
/** Only the actual ready-to-publish sample gets the two semantic preparation pages. */
export function videoPublicationPreparation(p:GamePanelProps,target:VideoSceneTarget|undefined):boolean{
 if(p.view.phase!=='playing'||!target?.workId||target.contractId||target.marketingId)return false
 const v=p.features.video,channel=v?.channels.find(c=>c.id===target.channelId),work=v?.works.find(w=>w.id===target.workId)
 if(!channel||!work||work.contractId!==null||channel.accountId!==p.accountId)return false
 const focus={kind:'video' as const,runId:p.view.runId,accountId:p.accountId,businessId:channel.businessId,entityId:work.id,videoTarget:target}
 return resolveVideoFocus(p,focus).reason===null&&videoSceneProgress(v,p.view.date,target)?.stage==='video-ready-to-publish'
}
