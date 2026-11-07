import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {videoWorkCanReturnToday} from './video-work-stage.ts'
import {resolveVideoFocus} from './video-player-thread.ts'
import {isoDate} from '../core/calendar.ts'

export interface VideoPublicationFeedbackReading{
 readonly title:string
 readonly line:string
 readonly measuredAt:string
 readonly views:number
 readonly inquiries:number
 readonly moneyLine:string
 readonly currentLeads:number
 readonly canReply:boolean
}
/** Actual facts for this one publication, never a command or an account total. */
export function videoPublicationFeedbackReading(p:GamePanelProps,thread:PlayerThreadView):VideoPublicationFeedbackReading|null{
 if(!videoWorkCanReturnToday(p,thread)||thread.focus.kind!=='video'||!thread.focus.videoTarget?.workId)return null
 const v=p.features.video!,t=thread.focus.videoTarget,channels=v.channels.filter(c=>c.id===t.channelId),works=v.works.filter(w=>w.id===t.workId&&w.channelId===t.channelId),rows=v.publications.filter(pub=>pub.channelId===t.channelId&&pub.workId===t.workId),c=channels[0],pub=rows[0]
 if(channels.length!==1||works.length!==1||rows.length!==1||!c||!pub||pub.measuredAt===null||v.publications.filter(row=>row.id===pub.id).length!==1||v.settlements.some(s=>s.publicationId===pub.id))return null
 try{isoDate(pub.publishedAt);isoDate(pub.measureAt);isoDate(pub.measuredAt);if(pub.publishedAt>pub.measuredAt||pub.measureAt>pub.measuredAt||pub.measuredAt>p.view.date)return null}catch{return null}
 if([pub.views,pub.qualifiedInquiries].some(n=>!Number.isSafeInteger(n)||n<0)||c.leads.some(l=>!l.personId||!l.cohortId)||new Set(c.leads.map(l=>l.personId)).size!==c.leads.length)return null
 const w=p.features.workbench
 if(w.pause!==null||w.progression.requiresDelivery||w.events.some(e=>e.isBlocking||e.presentation!=='ordinary')||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 return {title:pub.qualifiedInquiries>0?'有人看完，还想再聊聊。':pub.views>0?'这一版，已经有人看见。':'这一版，暂时没有回声。',line:c.name+' · '+pub.measuredAt+'的这次发布反馈。',measuredAt:pub.measuredAt,views:pub.views,inquiries:pub.qualifiedInquiries,moneyLine:pub.monetization==='none'?'只积累受众 · 本次没有平台应收。':!pub.qualified?'本次未取得对应收益资格，没有平台应收。':'本次没有平台应收。',currentLeads:c.leads.length,canReply:c.lifecycle==='operating'&&c.leads.length>0}
}

/** The player explicitly moved from a result to inquiry preparation; no order exists yet. */
export function videoInquiryChoiceReading(p:GamePanelProps,thread:PlayerThreadView):{title:string;line:string;stage:string;currentLeads:number}|null{
 if(p.view.phase!=='playing'||thread.stage!=='video-channel'||thread.focus.kind!=='video'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['current','carry','entry'].includes(thread.focusScope)||thread.focus.accountId!==p.accountId||resolveVideoFocus(p,thread.focus).reason)return null
 const t=thread.focus.videoTarget,v=p.features.video
 if(!v||!t||t.section!=='leads'||Object.keys(t).some(k=>k!=='channelId'&&k!=='section'))return null
 const rows=v.channels.filter(c=>c.id===t.channelId),c=rows[0],w=p.features.workbench
 if(rows.length!==1||!c||c.lifecycle!=='operating'||!c.leads.length||new Set(c.leads.map(l=>l.personId)).size!==c.leads.length||w.pause!==null||w.progression.requiresDelivery||w.events.some(e=>e.isBlocking||e.presentation!=='ordinary')||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 return {title:'这次，想回应谁的询价？',line:c.name+' · 当前'+c.leads.length+'名可回应；还没有接下这份新委托。',stage:'询价准备 · 尚未接单',currentLeads:c.leads.length}
}
