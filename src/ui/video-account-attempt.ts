import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {VideoOpeningFocus} from './video-player-thread.ts'
import {resolveVideoFocus} from './video-player-thread.ts'
import {videoFirstAttemptReading,type VideoFirstAttemptReading} from './video-first-attempt.ts'
import {VIDEO_JOBS} from '../content/video.ts'
import {isoDate,quarterOf} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

/** A known bare account with no video attempt yet; settled manual work remains history. */
function establishedAccountReading(p:GamePanelProps,f:VideoOpeningFocus):VideoFirstAttemptReading|null{
 const {view,features}=p,v=features.video,w=features.workbench,t=f.videoTarget,ops=view.operations
 if(!v||!t||!ops||f.accountId!==p.accountId||Object.keys(t).some(k=>k!=='channelId'&&k!=='section')||t.section!==undefined&&t.section!=='making'||view.phase!=='playing'||view.busy||view.readOnly||view.hasCandidate||view.saveStatus!=='saved'||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.isBlocking||e.presentation!=='ordinary')||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=view.date))||resolveVideoFocus(p,f).reason)return null
 const channels=v.channels.filter(c=>c.id===t.channelId),c=channels[0]
 if(channels.length!==1||!c||c.lifecycle!=='operating'||view.accounts.filter(a=>a.accountId===c.accountId).length!==1||c.audience!==0||c.qualifiedInquiries!==0||c.leads.length||!Number.isSafeInteger(c.metrics.incomeFen)||c.metrics.incomeFen<0||!Number.isSafeInteger(c.metrics.costFen)||c.metrics.costFen<0||[v.works,v.contracts,v.marketing,v.publications,v.settlements].some(rows=>rows.some(row=>row.channelId===c.id)))return null
 try{isoDate(c.createdAt);if(c.createdAt>view.date||quarterOf(view.date)!==w.quarter)return null}catch{return null}
 const businesses=ops.businesses.filter(b=>b.id===c.businessId)
 if(businesses.length!==1||businesses[0]!.lifecycle!=='operating')return null
 const jobs=ops.jobs.filter(j=>j.businessId===c.businessId),contracts=ops.contracts.filter(k=>k.businessId===c.businessId),apps=v.applications.filter(a=>a.channelId===c.id),allowedJobs=new Set<string>()
 for(const a of apps){
  if(!a.resultRead||a.decidedAt===null||typeof a.approved!=='boolean'||a.decidedAt>view.date||v.applications.filter(row=>row.id===a.id).length!==1)return null
  try{isoDate(a.appliedAt);isoDate(a.decidedAt)}catch{return null}
  const definition=v.catalog.programs.filter(program=>program.id===a.program),matches=jobs.filter(j=>j.id===a.jobId),job=matches[0]
  if(definition.length!==1||matches.length!==1||!job||!a.job||a.job.id!==job.id||a.job.businessId!==c.businessId||a.job.status!=='completed'||job.status!=='completed'||job.definitionId!==definition[0]!.jobId||job.completeAt>view.date||a.decidedAt<job.completeAt||allowedJobs.has(job.id))return null
  allowedJobs.add(job.id)
 }
 for(const contract of contracts){
  if(contract.status!=='settled'||contract.settledAt===null||contract.settledAt>view.date||ops.contracts.filter(k=>k.id===contract.id).length!==1)return null
  const matches=jobs.filter(j=>j.id===contract.jobId),job=matches[0]
  if(matches.length!==1||!job||job.status!=='completed'||job.completeAt>view.date||job.contractId!==contract.id||allowedJobs.has(job.id))return null
  allowedJobs.add(job.id)
 }
 if(jobs.length!==allowedJobs.size||jobs.some(j=>!allowedJobs.has(j.id)))return null
 const manual=v.modes.filter(m=>m.id==='manual'),sample=VIDEO_JOBS.find(j=>j.id==='video-make-hotspot-manual-original'),marketing=VIDEO_JOBS.find(j=>j.id==='video-marketing')
 if(manual.length!==1||manual[0]!.reasonCodes.length||!sample||!marketing||[sample,marketing].some(j=>!Number.isSafeInteger(j.costFen)||j.costFen<0||!Number.isSafeInteger(j.actionPoints)||j.actionPoints<0||!Number.isSafeInteger(j.durationDays)||j.durationDays<=0))return null
 return {channelId:c.id,title:'第一份作品，还是先认识观众？',line:c.name+' · 还没有视频作品。同分账历史确认收入'+moneyText(c.metrics.incomeFen)+' / 已发生成本'+moneyText(c.metrics.costFen)+'。',sample:{costFen:sample.costFen,points:sample.actionPoints,days:sample.durationDays},marketing:{costFen:marketing.costFen,points:marketing.actionPoints,days:marketing.durationDays}}
}
/** Selection reads only the same public existing account; it never creates a command. */
export function videoChannelAttemptReading(p:GamePanelProps,f:VideoOpeningFocus):VideoFirstAttemptReading|null{
 return videoFirstAttemptReading(p,f)??establishedAccountReading(p,f)
}
export function videoAccountAttemptReading(p:GamePanelProps,thread:PlayerThreadView):VideoFirstAttemptReading|null{
 if(thread.stage!=='video-channel'||thread.focus.kind!=='video'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['entry','current','carry'].includes(thread.focusScope))return null
 return videoChannelAttemptReading(p,thread.focus)
}
