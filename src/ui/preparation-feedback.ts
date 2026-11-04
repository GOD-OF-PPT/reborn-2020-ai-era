import type {PublicFeedback} from '../application/public-feedback.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

type Job=NonNullable<PlayingView['world']>['jobs'][number]
const terms:Record<string,{key:string;label:string;boundary:string}>={
 'PREP-CASE':{key:'manual_case',label:'手工练习案例',boundary:'接单与客户验收仍是下一次决定。'},
 'PREP-RESEARCH':{key:'customer_research',label:'客户需求研究材料',boundary:'这不是客户订单，新的经营仍由你决定。'},
 'PREP-API':{key:'api_application_materials',label:'API接入准备材料',boundary:'材料不等于访问许可，实际接入仍须另行核对。'},
 'PREP-COURSE':{key:'teaching_outline',label:'教学大纲',boundary:'样课与招生仍需另行安排。'},
 'PREP-ECOSYSTEM':{key:'ecosystem_materials',label:'生态服务准备材料',boundary:'实际合作与参与资格仍须另行核对。'},
}
const features=(v:PlayingView)=>v.features as unknown as PlayFeatures
const day=(v:string)=>{try{return isoDate(v)===v}catch{return false}}
const unique=<T,>(rows:readonly T[]):T|null=>rows.length===1?rows[0]!:null
function step(before:PlayingView,current:PlayingView,kind:string):boolean {
 const last=current.receipts.at(-1)
 return before.runId===current.runId&&current.revision===before.revision+1&&current.date>=before.date&&current.saveStatus==='saved'&&!current.hasCandidate&&last?.kind===kind&&last.revisionAfter===current.revision&&current.receipts.length===before.receipts.length+1&&before.receipts.every((r,i)=>{const n=current.receipts[i];return n?.commandId===r.commandId&&n.kind===r.kind&&n.revisionAfter===r.revisionAfter})
}
function source(v:PlayingView,id:string){
 const f=features(v),job=unique(v.world?.jobs.filter(j=>j.id===id)??[]),shown=unique(f.workbench.preparationJobs.filter(j=>j.id===id))
 if(!job||!shown||!shown.title.trim()||!day(job.startAt)||!day(job.completeAt)||job.startAt>v.date||job.completeAt<=job.startAt||shown.startAt!==job.startAt||shown.completeAt!==job.completeAt||shown.status!==job.status||v.accounts.filter(a=>a.accountId===shown.accountId).length!==1)return null
 if([...(v.operations?.jobs??[]),...f.life.jobs,...f.market.researches,...f.story.jobs].some(j=>j.id===id))return null
 const event=unique(v.world?.events.filter(e=>e.id===job.instanceId)??[])
 if(!event||event.status!=='resolved'||event.bindingId!==job.bindingId||event.choiceId!==job.choiceId||!Object.hasOwn(terms,event.definitionId))return null
 const account=shown.accountId==='personal'?'个人账户':(f.workbench.routes.find(r=>r.accountId===shown.accountId)?.name??'企业账户')+' · '+shown.accountId.slice(-6)
 return {job,shown,event,term:terms[event.definitionId]!,account}
}
const sameJob=(a:Job,b:Job)=>['id','instanceId','actionId','bindingId','choiceId','startAt','completeAt','capacityUnits'].every(key=>a[key as keyof Job]===b[key as keyof Job])

/** Actual response -> actual new preparation. No effects or future queue reads. */
export function preparationStartResult(kind:string,before:PlayingView|null,current:PlayingView):string|null {
 if(kind!=='ChooseEvent'||!before||!step(before,current,kind)||before.date!==current.date)return null
 const added=features(current).workbench.preparationJobs.filter(j=>!features(before).workbench.preparationJobs.some(old=>old.id===j.id)),shown=unique(added),c=shown?source(current,shown.id):null
 if(!c||c.job.status!=='running'||c.job.startAt!==current.date||c.event.resolution!=='chosen'||before.world?.jobs.some(j=>j.id===c.job.id))return null
 const old=unique(features(before).workbench.events.filter(e=>e.id===c.event.id)),event=unique(before.world?.events.filter(e=>e.id===c.event.id)??[]),choice=unique(old?.choices.filter(ch=>ch.id===c.job.choiceId)??[])
 if(!old||!event||event.status!=='pending'||event.definitionId!==c.event.definitionId||event.bindingId!==c.job.bindingId||old.accountId!==c.shown.accountId||old.title!==c.shown.title||!choice||!Number.isSafeInteger(choice.costFen)||choice.costFen<0||!Number.isSafeInteger(choice.actionPoints)||choice.actionPoints<0)return null
 if(current.budget.quarter!==before.budget.quarter||current.budget.spent-before.budget.spent!==choice.actionPoints||before.budget.available-current.budget.available!==choice.actionPoints||current.budget.reserved!==before.budget.reserved||current.accounts.length!==before.accounts.length)return null
 for(const a of current.accounts){const oldAccount=unique(before.accounts.filter(b=>b.accountId===a.accountId));if(!oldAccount||oldAccount.cashFen-a.cashFen!==(a.accountId===old.accountId?choice.costFen:0))return null}
 return `${c.account} · “${c.shown.title}”已开始：已付${moneyText(choice.costFen)}、已用${choice.actionPoints}点，预计${c.job.completeAt}完成。`
}

/** A generic completion may be named only by its unchanged public job and the
 * newly recorded material from that exact event, binding and completion day. */
export function preparationCompletionReading(before:PlayingView,current:PlayingView,row:PublicFeedback):string|null {
 if(!step(before,current,'AdvanceTime')||row.kind!=='job'||row.attention!=='pause'||row.label!=='一份原工作已经有了实际结果。'||row.key!=='job:'+row.sourceId+':"completed"')return null
 const a=source(before,row.sourceId),b=source(current,row.sourceId)
 if(!a||!b||a.job.status!=='running'||b.job.status!=='completed'||!sameJob(a.job,b.job)||a.shown.title!==b.shown.title||a.shown.accountId!==b.shown.accountId||a.event.definitionId!==b.event.definitionId||b.job.completeAt<before.date||b.job.completeAt>current.date)return null
 const records=current.world?.preparations.filter(p=>p.sourceEventId===b.event.id&&p.bindingId===b.job.bindingId&&p.date===b.job.completeAt&&!before.world?.preparations.some(old=>old.key===p.key&&old.sourceEventId===p.sourceEventId&&old.bindingId===p.bindingId&&old.date===p.date))??[],record=unique(records)
 if(!record||record.key!==b.term.key)return null
 return `${b.account} · ${b.term.label}已于${b.job.completeAt}准备好。${b.term.boundary}`
}
