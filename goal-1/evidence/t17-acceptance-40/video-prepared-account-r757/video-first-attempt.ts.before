import type {GamePanelProps} from './game-types.ts'
import type {VideoOpeningFocus} from './video-player-thread.ts'
import {quarterOf} from '../core/calendar.ts'
import {VIDEO_JOBS} from '../content/video.ts'

type Input={view:GamePanelProps['view'];features:Pick<GamePanelProps['features'],'video'|'workbench'>}
export interface VideoFirstAttemptReading{
 readonly channelId:string;readonly title:string;readonly line:string
 readonly sample:{readonly costFen:number;readonly points:number;readonly days:number}
 readonly marketing:{readonly costFen:number;readonly points:number;readonly days:number}
}
/** A clean selected account can compare intentions. Anything with history,
 * obligations or unclear identity keeps the original complete route. */
export function videoFirstAttemptReading(p:Input,f:VideoOpeningFocus):VideoFirstAttemptReading|null{
 const {view,features}=p,v=features.video,w=features.workbench,t=f.videoTarget
 if(!v||!t||f.runId!==view.runId||f.entityId!==t.channelId||Object.keys(t).some(k=>k!=='channelId'&&k!=='section')||t.section!==undefined&&t.section!=='making'||view.phase!=='playing'||view.busy||view.readOnly||view.hasCandidate||view.saveStatus!=='saved'||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.isBlocking||e.presentation!=='ordinary')||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=view.date)))return null
 const channels=v.channels.filter(c=>c.id===t.channelId),c=channels[0]
 if(channels.length!==1||!c||c.lifecycle!=='operating'||c.accountId!==f.accountId||f.businessId!==undefined&&f.businessId!==c.businessId||view.accounts.filter(a=>a.accountId===c.accountId).length!==1||c.audience!==0||c.qualifiedInquiries!==0||c.leads.length||c.eligiblePrograms.length||c.metrics.incomeFen!==0||c.metrics.costFen!==0)return null
 try{if(c.createdAt>view.date||quarterOf(c.createdAt)!==w.quarter||quarterOf(view.date)!==w.quarter)return null}catch{return null}
 const businesses=view.operations?.businesses.filter(b=>b.id===c.businessId)??[]
 if(businesses.length!==1||businesses[0]!.accountId!==c.accountId||businesses[0]!.route!=='ai_video'||businesses[0]!.lifecycle!=='operating'||view.operations?.jobs.some(j=>j.businessId===c.businessId))return null
 if([v.works,v.contracts,v.marketing,v.publications,v.settlements,v.applications].some(rows=>rows.some(row=>row.channelId===c.id)))return null
 const manual=v.modes.filter(m=>m.id==='manual'),sample=VIDEO_JOBS.find(j=>j.id==='video-make-hotspot-manual-original'),marketing=VIDEO_JOBS.find(j=>j.id==='video-marketing')
 if(manual.length!==1||manual[0]!.reasonCodes.length||!sample||!marketing||[sample,marketing].some(j=>!Number.isSafeInteger(j.costFen)||j.costFen<0||!Number.isSafeInteger(j.actionPoints)||j.actionPoints<0||!Number.isSafeInteger(j.durationDays)||j.durationDays<=0))return null
 return {channelId:c.id,title:'先做作品，还是先认识观众？',line:c.name+' · 还没有作品或受众推广。',sample:{costFen:sample.costFen,points:sample.actionPoints,days:sample.durationDays},marketing:{costFen:marketing.costFen,points:marketing.actionPoints,days:marketing.durationDays}}
}
