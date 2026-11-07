import {addDays} from '../core/calendar.ts'
import type {LifeProjection} from '../core/life-projection.ts'
import type {LifePerson,LifeReference,LifeJob} from '../core/life-schema.ts'
import {moneyText} from './game-text.ts'

type Person=LifeProjection['people'][number]
type Promise=LifeProjection['promises'][number]
type Job=LifeProjection['jobs'][number]
export type LifeSceneSelection=LifePerson|'rest'|'workspace'
export type LifeSceneStage='unknown'|'ready'|'offered'|'accepted'|'running'|'completed'|'interrupted'|'npc-declined'|'expired'|'missed'|'declined'|'unavailable'
export type LifeSceneCommand=
 |{readonly kind:'StartLifeWork';readonly payload:{readonly kind:Exclude<LifeJob['kind'],'promise_keep'>;readonly personId:LifePerson|null;readonly reference:LifeReference|null};readonly confirm:true}
 |{readonly kind:'AcceptLifePromise';readonly payload:{readonly promiseId:string;readonly consent:true};readonly confirm:true}
 |{readonly kind:'DeclineLifePromise';readonly payload:{readonly promiseId:string};readonly confirm:false}
 |{readonly kind:'FulfillLifePromise';readonly payload:{readonly promiseId:string};readonly confirm:true}
 |{readonly kind:'InterruptLifeWork';readonly payload:{readonly jobId:string};readonly confirm:true}
export interface LifeSceneProgress{
 readonly selection:LifeSceneSelection
 readonly person:Person|null
 readonly stage:LifeSceneStage
 readonly title:string
 readonly line:string
 readonly choice:{readonly title:string;readonly line:string;readonly label:string}
 readonly command:LifeSceneCommand|null
 readonly secondaryCommand:LifeSceneCommand|null
 readonly waitDate:string|null
 readonly promise:Promise|null
 readonly job:Job|null
 readonly references:readonly LifeReference[]
 readonly referenceRequired:boolean
 readonly sourceId:string
}
export interface PendingLifePromise{
 readonly promise:Promise
 readonly person:Person
 readonly terms:Person['promiseTerms']
 /** A stopped attempt remains evidence; an actually running one is handled as a current job. */
 readonly job:Job|null
}

/** Accepted responsibilities remain visible even when the original deadline is already past. */
export function pendingLifePromises(life:LifeProjection,date:string):PendingLifePromise[]{
 return life.promises.filter(p=>p.status==='accepted'&&p.offeredAt<=date&&p.acceptedAt!==null&&p.acceptedAt<=date
  &&!life.jobs.some(j=>j.promiseId===p.id&&j.status==='running'))
  .flatMap(promise=>{
   const person=life.people.find(person=>person.id===promise.personId)
   return person?[{promise,person,terms:person.promiseTerms,job:life.jobs.filter(j=>j.promiseId===promise.id).at(-1)??null}]:[]
  }).sort((a,b)=>a.promise.deadline.localeCompare(b.promise.deadline)||a.promise.id.localeCompare(b.promise.id))
}

function quarterStart(date:string){const month=Math.floor((Number(date.slice(5,7))-1)/3)*3+1;return date.slice(0,4)+'-'+String(month).padStart(2,'0')+'-01'}
function referenceText(reference:LifeReference){
 const name={paid_case:'已付履约案例',video_work:'实际原创制作',course_delivery:'完整课程履约',linzhou_participation:'林舟实际参与记录'}[reference.kind]
  return `${reference.date} · ${name}`
}

/** Only public committed life records choose the scene. A command still needs the original preview. */
export function lifeSceneProgress(life:LifeProjection,date:string,selection:LifeSceneSelection):LifeSceneProgress{
 const personal=selection==='rest'||selection==='workspace',person=personal?null:life.people.find(p=>p.id===selection)??null
 const jobs=personal?life.jobs.filter(j=>j.personId===null&&j.kind===selection):person?.jobs??[]
 const references=person?.references??[]
 const context={selection,person,promise:null,job:null,references,referenceRequired:false,sourceId:selection,command:null,secondaryCommand:null,waitDate:null}
 const scene=(stage:LifeSceneStage,title:string,line:string,choiceTitle:string,choiceLine:string,label:string,extra:Partial<Pick<LifeSceneProgress,'promise'|'job'|'sourceId'|'command'|'secondaryCommand'|'waitDate'|'referenceRequired'>>={}):LifeSceneProgress=>({...context,stage,title,line,choice:{title:choiceTitle,line:choiceLine,label},...extra})
 const running=jobs.filter(j=>j.status==='running'&&j.startAt<=date).sort((a,b)=>a.completeAt.localeCompare(b.completeAt)||a.id.localeCompare(b.id))[0]
 if(running){
  const promise=running.promiseId?life.promises.find(p=>p.id===running.promiseId)??null:null
   const title=running.kind==='promise_keep'?`答应${person!.name}的事，正在用日子兑现。`:person?`留给${person.name}的这段时间，还在继续。`:selection==='workspace'?'桌椅与照明，正在改善。':'这七天，已经留给自己。'
   return scene('running',title,`这次安排从${running.startAt}到${running.completeAt}，还没有完成。`,person?'等这次共同活动结束':selection==='workspace'?'等桌椅与照明改善完成':'等这七天休整结束',`个人已付${moneyText(running.costFen)} · 已耗${running.actionPoints}点；中断不退成本和行动。${promise?'答应的事最迟仍须在'+promise.deadline+'完成。':''}`,'等到这次安排完成',{job:running,promise,sourceId:running.id,waitDate:running.completeAt,secondaryCommand:{kind:'InterruptLifeWork',payload:{jobId:running.id},confirm:true}})
 }
 const accepted=person?.promises.filter(p=>p.status==='accepted'&&p.offeredAt<=date&&p.acceptedAt!==null&&p.acceptedAt<=date).sort((a,b)=>a.deadline.localeCompare(b.deadline)||a.id.localeCompare(b.id))[0]
 if(accepted){
  const expected=addDays(date,accepted.days),late=expected>accepted.deadline
   return scene('accepted',`答应${person!.name}的事，还要亲自去做。`,late?`现在开始，已经不能在原期限${accepted.deadline}内完成。承诺和已发生成本仍保留，不能再用婉拒撤掉。`:`你已答应${person!.promiseTerms.title}，还需要留出时间去做，最迟${accepted.deadline}完成。`,'为答应的事留出时间',`个人${moneyText(accepted.costFen)} · ${accepted.actionPoints}点 · ${accepted.days}日；现在开始，预计${expected}完成。确认前仍须核对时间和费用。`,late?'核对逾期后能否安排兑现':'开始兑现这项约定',{promise:accepted,sourceId:accepted.id,command:{kind:'FulfillLifePromise',payload:{promiseId:accepted.id},confirm:true},job:jobs.filter(j=>j.promiseId===accepted.id).at(-1)??null})
 }
 const offered=person?.promises.filter(p=>p.status==='offered'&&p.offeredAt<=date).sort((a,b)=>a.expiresAt.localeCompare(b.expiresAt)||a.id.localeCompare(b.id))[0]
  if(offered)return scene('offered',`${person!.name}有一件事，想请你一起做。`,`${person!.promiseTerms.title}；${offered.offeredAt}提出，请在${offered.expiresAt}前回应。未接受不会自动付费或完成。`,'要答应这次邀请吗？',`现在接受0点、无即时费用；以后仍需个人${moneyText(offered.costFen)} · ${offered.actionPoints}点 · ${offered.days}日，最迟${offered.deadline}完成。`,'看清约定后答应',{promise:offered,sourceId:offered.id,command:{kind:'AcceptLifePromise',payload:{promiseId:offered.id,consent:true},confirm:true},secondaryCommand:{kind:'DeclineLifePromise',payload:{promiseId:offered.id},confirm:false}})
 const from=quarterStart(date)
 const resolved=person?.promises.filter(p=>p.resolvedAt!==null&&p.resolvedAt>=from&&p.resolvedAt<=date).sort((a,b)=>b.resolvedAt!.localeCompare(a.resolvedAt!)||b.id.localeCompare(a.id))[0]
 const finished=jobs.filter(j=>j.status==='completed'&&j.completeAt<=date&&(j.completeAt>=from||selection==='workspace')).sort((a,b)=>b.completeAt.localeCompare(a.completeAt)||b.id.localeCompare(a.id))[0]
 const interrupted=jobs.filter(j=>j.status==='interrupted'&&j.releasedAt!==null&&j.releasedAt>=from&&j.releasedAt<=date).sort((a,b)=>b.releasedAt!.localeCompare(a.releasedAt!)||b.id.localeCompare(a.id))[0]
 const lastJob=interrupted&&(!finished||interrupted.releasedAt!>finished.completeAt)?interrupted:finished
 if(resolved&&(!lastJob||resolved.resolvedAt!>=(lastJob.releasedAt??lastJob.completeAt))){
  const extra={promise:resolved,sourceId:resolved.id,job:resolved.completionJobId?jobs.find(j=>j.id===resolved.completionJobId)??null:null}
   if(resolved.status==='fulfilled')return scene('completed',`答应${person!.name}的事，你做到了。`,`${resolved.resolvedAt}，这项约定已经兑现；接受与支出也各有自己的日期。`,'回看一起走过的这段日子',`个人费用${moneyText(resolved.costFen)} · 已耗${resolved.actionPoints}点；完成不会返还行动、增加现金或改变合作权限。`,'查看这项约定与完成记录',extra)
  if(resolved.status==='npc_declined')return scene('npc-declined',`${person!.name}也有自己的安排。`,`${resolved.resolvedAt}对方按自己的计划撤回尚未接受的邀请；不记作你的失约，也不强迫对方继续。`,'尊重对方这次选择','原共同经历和已付成本保留；这次没有新增接受、付费或兑现。','查看对方公开日程与原邀请',extra)
  if(resolved.status==='missed')return scene('missed',`这次原约定，没有按期兑现。`,`${resolved.resolvedAt}原约定到期未完成。失约与已发生成本保留，翻页、等待或婉拒都不能抹掉。`,'面对这次未兑现的约定',`原期限${resolved.deadline} · 个人约定费用${moneyText(resolved.costFen)}；费用是否已付仍以原工作和账目为准，不默认补扣。`,'查看失约与原工作记录',extra)
  return scene(resolved.status==='expired'?'expired':'declined',resolved.status==='expired'?'这次邀请，已经过了回应窗口。':'这次邀请，你已经明确婉拒。',`${resolved.resolvedAt}记下原结果；没有自动接受、付费或完成工作。`,'回看这次原邀请','已经发生的共同经历仍在，未接受的邀请没有变成新的付费承诺。','查看原邀请与实际日期',extra)
 }
 if(lastJob){
  if(lastJob.status==='interrupted'){
   const kind=lastJob.kind,work=kind==='promise_keep'?null:life.work[kind],reference=lastJob.reference
   const sameReference=reference!==null&&references.some(r=>r.kind===reference.kind&&r.id===reference.id&&r.date===reference.date)
   const referenceReady=person===null||person.id==='tang-ying'||sameReference
   const retry:LifeSceneCommand|null=life.canPlanCurrentYear&&!person?.busy&&referenceReady&&kind!=='promise_keep'?{kind:'StartLifeWork',payload:{kind,personId:person?.id??null,reference:person&&person.id!=='tang-ying'?reference:null},confirm:true}:null
   const retryTerms=retry&&work?`重新安排仍需个人${moneyText(work.costFen)} · ${work.points}点 · ${work.days}日，原预计完成日${addDays(date,work.days)}。${reference?'本次沿用的原实际依据：'+referenceText(reference)+'。':''}`:'再次安排仍需原费用、行动和日期；已接受的原约定另按原期限处理。'
   return scene('interrupted',person?`与${person.name}的这次工作，停在了半路。`:'这次生活工作，已经中断。',`${lastJob.releasedAt}实际停止；等到原完成日也不会自动补做。`,retry?'另行决定是否重新安排':'核对停止后的原记录',`个人已付${moneyText(lastJob.costFen)} · 已耗${lastJob.actionPoints}点均保留。${retryTerms}`,retry?'重新核对并安排一次实际工作':'查看中断工作与原责任',{job:lastJob,sourceId:lastJob.id,command:retry})
  }
   return scene('completed',person?`与${person.name}相处过的日子，已经留下记录。`:selection==='workspace'?'桌椅与照明，已经改善。':'这七天，已经好好度过。',`${lastJob.completeAt}完成；${person?'之后是否有新邀请，还要等对方的回应。':selection==='workspace'?'你花下的钱与时间，已经成为眼前用得上的东西。':'休整不返还行动或增加收益。'}`,'回看这次安排的结果',`个人已付${moneyText(lastJob.costFen)} · 已耗${lastJob.actionPoints}点；这不是新增收入。`,'查看这次活动与结果',{job:lastJob,sourceId:lastJob.id})
 }
 if(!personal&&(!person||!person.known))return scene('unknown','这段联系，还没有实际前提。',person?.goal??'请先查看实际已经认识的人与原记录。','先看清相识与共同活动的前提',person?.boundary??'阅读不会建立关系、付费或授予合作权限。','查看相识前提与原记录')
 const work=personal?{...life.work[selection],kind:selection}:person!.work
 const expected=addDays(date,work.days)
 const reference=references.length===1?references[0]!:null
 const needsReference=person!==null&&person.id!=='tang-ying'
  const referenceLine=needsReference?(reference?'这次用到的材料：'+referenceText(reference)+'，完整来源可展开查看。':references.length?`已有${references.length}份材料，请选择这次要一起看的那一份；完整来源可展开查看。`:'当前没有本次所需的实际材料；钱或关系不能代替真实履约及对方同意。'):''
  const resources=`个人${moneyText(work.costFen)} · ${work.points}点 · ${work.days}日`,terms=`${resources}；现在开始，预计${expected}完成。${referenceLine}`
 if(person?.busy)return scene('unavailable',`${person.name}这段日子有自己的安排。`,`${person.busy.from}起、${person.busy.to}前是对方公开档期，不能用付款强迫共同工作。`,'查看对方公开日程',`${resources}；对方档期结束后，再核对开工与完成日期。${referenceLine}`,'查看原日程与其他活动')
 if(!life.canPlanCurrentYear)return scene('unavailable','新的生活安排，要留在实际可用的年代。','当前这里只回看已提交生活记录；原未完承诺仍按原规则处理。','回看原生活与人物记录',`${resources}；当前只回看已有安排。${referenceLine}`,'查看原生活记录')
 const command:LifeSceneCommand|null=needsReference&&!reference?null:{kind:'StartLifeWork',payload:{kind:work.kind,personId:person?.id??null,reference:needsReference?reference:null},confirm:true}
  const label=person?person.id==='tang-ying'?`安排与${person.name}见面`:person.id==='linzhou'?`安排与${person.name}共同核对`:person.id==='xu-cheng'?`安排与${person.name}整理笔记`:`安排与${person.name}复盘交付`:selection==='workspace'?'改善桌椅与照明':'留出七天休整'
  return scene(needsReference&&!references.length?'unavailable':'ready',person?`给${person.name}留一段真正相处的时间。`:selection==='workspace'?'把桌椅与照明，认真改善一次。':'把七天，留给自己的生活。',person?person.boundary:selection==='workspace'?'开始采购还没有改变场景；完成以后，投入才成为眼前用得上的东西。':'休整仍占用行动，也不带来收入。给自己留出这段时间，再决定别的安排。',needsReference&&!references.length?'先看看还缺什么材料和同意':needsReference&&!reference?'挑一份这次要一起看的材料':'把这段时间留出来',terms,needsReference&&!references.length?'查看所需材料与相识条件':needsReference&&!reference?'选择材料后安排这次活动':label,{command,referenceRequired:needsReference&&!reference&&references.length>0})
}
