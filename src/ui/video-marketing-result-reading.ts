import type {ComponentProps} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {SceneTimeNotice} from './SceneEcho.tsx'

type Input=Pick<GamePanelProps,'view'|'features'>
type Notice=Pick<ComponentProps<typeof SceneTimeNotice>,'date'|'text'|'brief'|'frame'>
/** Only the exact selected current fact can be covered by the already-published
 * original result. The original notice, retained tail, frame and actions stay intact. */
export function videoMarketingResultCoversLine(p:Input,thread:PlayerThreadView,notice:Notice,line:string):boolean{
 const {view,features}=p,v=features.video,f=thread.focus,frame=notice.frame,last=view.receipts.at(-1)
 if(!v||f.kind!=='video'||!f.videoTarget?.marketingId||f.runId!==view.runId||view.phase!=='playing'||view.busy||view.readOnly||view.hasCandidate||view.saveStatus!=='saved'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||thread.stage!=='video-marketing-completed'||thread.outcome!=='actual'||!['current','carry'].includes(thread.focusScope)||last?.kind!=='AdvanceTime'||last.revisionAfter!==view.revision||notice.date!==view.date||!frame)return false
 const rows=v.marketing.filter(m=>m.id===f.videoTarget!.marketingId),m=rows[0],channels=v.channels.filter(c=>c.id===f.videoTarget!.channelId),c=channels[0]
 if(rows.length!==1||channels.length!==1||!m||!c||m.channelId!==c.id||f.entityId!==m.id||c.accountId!==f.accountId||f.businessId!==undefined&&f.businessId!==c.businessId||m.completedAt!==view.date||!m.cohortId||m.job?.status!=='completed'||m.job.completeAt!==view.date||m.job.id!==m.jobId||m.job.businessId!==c.businessId||m.job.definitionId!=='video-marketing')return false
 const businesses=view.operations?.businesses.filter(b=>b.id===c.businessId&&b.accountId===c.accountId&&b.route==='ai_video')??[]
 if(businesses.length!==1||v.marketing.filter(row=>row.channelId===c.id).length!==1||[v.works,v.contracts,v.publications,v.settlements,v.applications].some(rows=>rows.some(row=>row.channelId===c.id))||!thread.resultRefs.some(ref=>ref.kind==='marketing'&&ref.id===m.id&&ref.date===view.date))return false
 if(c.leads.some(lead=>lead.cohortId!==m.cohortId)||new Set(c.leads.map(lead=>lead.personId)).size!==c.leads.length)return false
 const expectedLine=`${view.date}形成实际受众；本账号当前有${c.leads.length}名未转化询价者。`
 const brief=`「${c.name}」的这次推广已于${view.date}实际完成；该来源新增${c.leads.length}份合格询价，当前${c.leads.length}份尚未转化。`
 const original=brief+'下一步可明确选择回应哪位客户；询价还不是订单或收入。'
 if(line!==expectedLine||thread.line!==expectedLine||!notice.text.startsWith(original)||notice.brief!==undefined&&notice.brief!==brief)return false
 const accounts=view.accounts.filter(a=>a.accountId===c.accountId),account=frame.accounts[0]
 return accounts.length===1&&frame.accounts.length===1&&!!account&&account.id===c.accountId&&account.before===account.after&&account.after===accounts[0]!.availableFen&&!frame.quarterChanged&&frame.dateBefore<frame.dateAfter&&frame.dateAfter===view.date&&frame.pointsBefore===frame.pointsAfter&&frame.pointsAfter===view.budget.available&&frame.reservedBefore===frame.reservedAfter&&frame.reservedAfter===view.budget.reserved&&frame.spentBefore===frame.spentAfter&&frame.spentAfter===view.budget.spent
}
