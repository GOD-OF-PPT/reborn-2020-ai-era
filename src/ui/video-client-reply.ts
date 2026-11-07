import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import {videoSceneProgress} from './video-scene-progress.ts'
import {resolveVideoFocus,videoTargetEntity} from './video-player-thread.ts'
import {videoClientDirectPaid} from './video-client-settlement.ts'
import {VIDEO_JOBS} from '../content/video.ts'
import {isoDate} from '../core/calendar.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import {moneyText} from './game-text.ts'

export interface VideoClientReplyReading{readonly title:string;readonly line:string;readonly version:number;readonly revisions:number;readonly included:number;readonly dueAt:string;readonly reviewedAt:string;readonly priceFen:number;readonly prepaymentFen:number;readonly directPaidFen:number|null;readonly rework:{costFen:number;points:number;days:number};readonly negotiation:{costFen:number;points:number;days:number};readonly canNegotiate:boolean;readonly negotiationReason:string|null;readonly reworkTotalFen:number|null}
const amount=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=MONEY_LIMIT
/** Only the same already-public original client revision gets this comparison. */
export function videoClientReplyForTarget(p:GamePanelProps,target:VideoSceneTarget|undefined):VideoClientReplyReading|null{
 const v=p.features.video;if(!v||!target||p.view.phase!=='playing')return null
 const progress=videoSceneProgress(v,p.view.date,target),t=progress?.target
 if(progress?.invalidReason||progress?.stage!=='video-revision'||!t?.workId||!t.contractId)return null
 const channels=v.channels.filter(c=>c.id===t.channelId),works=v.works.filter(w=>w.id===t.workId),contracts=v.contracts.filter(c=>c.id===t.contractId),channel=channels[0],work=works[0],contract=contracts[0]
 if(channels.length!==1||works.length!==1||contracts.length!==1||!channel||!work||!contract||contract.status!=='revision'||channel.accountId!==p.accountId||work.contractId!==contract.id||work.channelId!==channel.id||contract.workId!==work.id||contract.channelId!==channel.id||resolveVideoFocus(p,{kind:'video',runId:p.view.runId,accountId:p.accountId,businessId:channel.businessId,entityId:videoTargetEntity(t),videoTarget:t}).reason||contract.reviewedAt===null||![work.version,contract.revisions,contract.includedRevisions].every(n=>Number.isSafeInteger(n)&&n>=0)||work.version<1||!amount(contract.priceFen)||!amount(contract.prepaymentFen)||contract.prepaymentFen>contract.priceFen)return null
 try{isoDate(contract.reviewedAt);isoDate(contract.dueAt);if(contract.reviewedAt>p.view.date||contract.dueAt<p.view.date)return null}catch{return null}
 const reworks=VIDEO_JOBS.filter(j=>j.id==='video-rework'),talks=VIDEO_JOBS.filter(j=>j.id==='video-negotiate'),rework=reworks[0],talk=talks[0]
 if(reworks.length!==1||talks.length!==1||!rework||!talk||[rework,talk].some(j=>!amount(j.costFen)||!Number.isSafeInteger(j.actionPoints)||j.actionPoints<0||!Number.isSafeInteger(j.durationDays)||j.durationDays<1))return null
 const directPaid=videoClientDirectPaid(p,{channelId:channel.id,workId:work.id,contractId:contract.id}),canNegotiate=contract.revisions>=contract.includedRevisions&&!contract.negotiated,combined=directPaid===null?null:directPaid+rework.costFen
 return {title:canNegotiate?'这轮修改，修还是谈？':'这轮修改，怎样继续？',line:directPaid===null?'这单直接投入来源待核，既有费用留在原账。':'这单已直接付出'+moneyText(directPaid)+'，客户还没验收。',version:work.version,revisions:contract.revisions,included:contract.includedRevisions,dueAt:contract.dueAt,reviewedAt:contract.reviewedAt,priceFen:contract.priceFen,prepaymentFen:contract.prepaymentFen,directPaidFen:directPaid,rework:{costFen:rework.costFen,points:rework.actionPoints,days:rework.durationDays},negotiation:{costFen:talk.costFen,points:talk.actionPoints,days:talk.durationDays},canNegotiate,negotiationReason:canNegotiate?null:contract.negotiated?'原谈判已用过，原条件与答复仍保留。':'仍在原包含的修改轮次内，先履行原约。',reworkTotalFen:combined!==null&&amount(combined)?combined:null}
}
export function videoClientReplyReading(p:GamePanelProps,thread:PlayerThreadView):VideoClientReplyReading|null{
 if(thread.focus.kind!=='video'||thread.stage!=='video-revision'||thread.focusStatus==='invalid'||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||!['current','carry'].includes(thread.focusScope)||thread.focus.accountId!==p.accountId||resolveVideoFocus(p,thread.focus).reason||p.features.workbench.atQuarterEnd)return null
 return videoClientReplyForTarget(p,thread.focus.videoTarget??undefined)
}
