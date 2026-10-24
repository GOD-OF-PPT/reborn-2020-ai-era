import type {PlayingView,PlayFeatures} from './game-types.ts'
import type {VideoProjection} from '../core/video-projection.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {VIDEO_JOBS} from '../content/video.ts'
import {addDays} from '../core/calendar.ts'
import {videoTargetReason} from './video-scene-progress.ts'
import {moneyText} from './game-text.ts'
import {MONEY_LIMIT} from '../core/money.ts'

type Video=NonNullable<VideoProjection>
const one=<T,>(rows:readonly T[]):T|undefined=>rows.length===1?rows[0]:undefined
const active=(job:ProductionJob|undefined|null)=>job?.status==='planned'||job?.status==='running'
const unique=(rows:readonly {id:string}[])=>new Set(rows.map(row=>row.id)).size===rows.length
const sum=(values:readonly number[]):number|null=>{
 if(values.some(value=>!Number.isSafeInteger(value)||value<0||value>MONEY_LIMIT))return null
 const total=values.reduce((n,value)=>n+BigInt(value),0n)
 return total<=BigInt(MONEY_LIMIT)?Number(total):null
}

/** One saved public transition. It does not preview, command, inspect rolls or infer profit. */
export function videoSceneResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 const receipt=current.receipts.at(-1)
 if(!previous||previous.runId!==current.runId||current.revision!==previous.revision+1||current.saveStatus!=='saved'||current.hasCandidate||current.readOnly||current.busy||receipt?.kind!==kind||receipt.revisionAfter!==current.revision)return null
 const beforeFeatures=previous.features as unknown as PlayFeatures,features=current.features as unknown as PlayFeatures,a=beforeFeatures.video,b=features.video
 if(!a||!b||[a,b].some(v=>![v.channels,v.works,v.contracts,v.marketing,v.publications,v.settlements,v.applications].every(unique)))return null
 const context=(channelId:string,workId?:string,contractId?:string)=>{
  if(videoTargetReason(b,{channelId,...(workId?{workId}:{}),...(contractId?{contractId}:{})}))return null
  const channel=one(b.channels.filter(row=>row.id===channelId)),business=one(current.operations?.businesses.filter(row=>row.id===channel?.businessId&&row.accountId===channel?.accountId&&row.route==='ai_video')??[])
  if(!channel||!business||!current.accounts.some(row=>row.accountId===channel.accountId))return null
  const old=one(a.channels.filter(row=>row.id===channel.id))
  if(old&&(old.businessId!==channel.businessId||old.accountId!==channel.accountId))return null
  const finance=one(features.workbench.finance.filter(row=>row.accountId===channel.accountId)),oldFinance=one(beforeFeatures.workbench.finance.filter(row=>row.accountId===channel.accountId))
  if(!finance||!oldFinance)return null
  const work=workId?one(b.works.filter(row=>row.id===workId&&row.channelId===channel.id)):undefined
  return {channel,finance,oldFinance,label:`「${channel.name}」${work?' · 作品'+(b.works.filter(row=>row.channelId===channel.id).findIndex(row=>row.id===work.id)+1)+' / 第'+work.version+'版':''}`}
 }
 const schedule=(job:ProductionJob|undefined,label:string,channelId:string)=>{
  const c=context(channelId),term=job?one(VIDEO_JOBS.filter(row=>row.id===job.definitionId)):undefined
  if(!c||!job||!term||job.businessId!==c.channel.businessId||!active(job))return null
  const paid=sum(c.finance.metrics.filter(row=>row.kind==='cost'&&row.referenceId===job.actionId).map(row=>row.deltaFen)),reserved=sum(c.finance.reservations.filter(row=>row.kind==='plan'&&row.originId===job.actionId&&row.status==='active').map(row=>row.amountFen))
  if(job.status==='planned'&&(paid!==0||reserved!==term.costFen)||job.status==='running'&&(job.startAt>current.date||paid!==term.costFen||reserved!==0))return null
  return `${label}${job.status==='planned'?`已安排，${job.startAt}开工；预留${moneyText(reserved)}与开工季度${term.actionPoints}点，尚未实际支付`:`已于${job.startAt}开工，实际直接成本${moneyText(paid)}、使用${term.actionPoints}点`}；${job.completeAt}才到原任务反馈日，实际完成后再核对下一步。`
 }
 const contractContext=(contract:Video['contracts'][number])=>context(contract.channelId,contract.workId,contract.id)
 const settled=(contract:Video['contracts'][number])=>{
  const c=contractContext(contract),old=one(a.contracts.filter(row=>row.id===contract.id&&row.channelId===contract.channelId&&row.workId===contract.workId))
  if(!c||!old||old.status==='settled'||contract.status!=='settled'||!contract.settledAt||contract.settledAt>current.date)return null
  const expected=contract.priceFen-contract.prepaymentFen,received=sum(c.finance.transactions.filter(row=>row.sourceId===contract.id&&row.amountFen>0&&!c.oldFinance.transactions.some(prior=>prior.id===row.id)).map(row=>row.amountFen))
  if(received!==expected)return null
  const fee=Number(BigInt(contract.priceFen)*BigInt(contract.feeBps)/10000n),owed=sum(c.finance.obligations.filter(row=>row.sourceEventId===contract.id&&row.remainingFen>0).map(row=>row.remainingFen))
  if(owed===null)return null
  return `${c.label}已于${contract.settledAt}实际结算：此前原预款${moneyText(contract.prepaymentFen)}，本次原余款${moneyText(received)}${contract.feePosted?`；原费用${moneyText(fee)}已记账`:'；原费用仍须核对'}${owed>0?`，原应付仍有${moneyText(owed)}未清`:''}。制作成本仍保留，回款不再重复算新收入。`
 }
 const collected=(row:Video['settlements'][number])=>{
  const pub=one(b.publications.filter(pub=>pub.id===row.publicationId&&pub.channelId===row.channelId&&pub.settlementId===row.id)),c=pub?context(row.channelId,pub.workId):null,old=one(a.settlements.filter(prior=>prior.id===row.id&&prior.publicationId===row.publicationId&&prior.channelId===row.channelId))
  if(!c||old&&old.collectedAt!==null||!old&&!a.publications.some(prior=>prior.id===row.publicationId&&prior.channelId===row.channelId)||!row.collectedAt||row.collectedAt>current.date)return null
  const received=sum(c.finance.transactions.filter(tx=>tx.sourceId===row.id&&tx.amountFen>0&&!c.oldFinance.transactions.some(prior=>prior.id===tx.id)).map(tx=>tx.amountFen)),owed=sum(c.finance.obligations.filter(o=>o.sourceEventId===row.id&&o.remainingFen>0).map(o=>o.remainingFen))
  if(received!==row.amountFen||owed===null)return null
  return `${c.label}的原${row.kind==='ads'?'平台分成':'带货佣金'}于${row.collectedAt}实际收款${moneyText(received)}；原费用${moneyText(row.feeFen)}另记${owed>0?`，原应付仍有${moneyText(owed)}未清`:''}。${row.kind==='affiliate'?'商品成交额不是本号收入。':'播放量不等于现金。'}`
 }
 if(kind==='OpenVideoChannel'){
  const row=one(b.channels.filter(row=>!a.channels.some(old=>old.id===row.id)&&row.createdAt===current.date)),c=row?context(row.id):null
  return c?`${c.label}已在${current.date}建立。先为这批受众选择一件具体作品或了解需求；这一步没有制作、客户验收或视频收入。`:null
 }
 if(kind==='StartVideoWork'||kind==='AcceptVideoCommission'){
  const work=one(b.works.filter(row=>!a.works.some(old=>old.id===row.id))),contract=kind==='AcceptVideoCommission'?one(b.contracts.filter(row=>!a.contracts.some(old=>old.id===row.id)&&row.workId===work?.id)):undefined
  const c=work?context(work.channelId,work.id,contract?.id):null,line=c&&work?schedule(work.production,c.label+'的这次制作',work.channelId):null
  if(!line||kind==='AcceptVideoCommission'&&!contract)return null
  return contract?`${line} 原客户约定报价${moneyText(contract.priceFen)}，收到的预款${moneyText(contract.prepaymentFen)}仍受保护；最迟${contract.dueAt}提交，当前没有验收收入。`:line
 }
 if(kind==='StartVideoMarketing'){
  const row=one(b.marketing.filter(row=>!a.marketing.some(old=>old.id===row.id))),c=row?context(row.channelId):null
  return row&&c?schedule(row.job,c.label+' · 这次受众调研与推广',row.channelId):null
 }
 if(kind==='ReviewVideoOutput'){
  const work=one(b.works.filter(row=>row.reviewedVersion===row.version&&a.works.some(old=>old.id===row.id&&old.channelId===row.channelId&&old.version===row.version&&old.reviewedVersion!==row.reviewedVersion))),c=work?context(work.channelId,work.id,work.contractId??undefined):null
  return c?`${c.label}已由你人工核对，素材与使用说明留在原记录。${work!.contractId?'仍须亲手提交客户复核；核对不等于交付或收款。':'发布方式仍由你明确选择；核对没有产生播放或收入。'}`:null
 }
 if(kind==='SubmitVideoCommission'){
  const row=one(b.contracts.filter(row=>row.status==='review'&&row.submittedAt===current.date&&a.contracts.some(old=>old.id===row.id&&old.workId===row.workId&&(old.status!=='review'||old.reviewSequence!==row.reviewSequence)))),c=row?contractContext(row):null
  return row&&c?`${c.label}已交给原客户，${addDays(row.submittedAt!,b.catalog.commercial.reviewDays)}等待原复核反馈。现在尚未验收，余款也没有到账。`:null
 }
 if(kind==='ReworkVideo'){
  const work=one(b.works.filter(row=>a.works.some(old=>old.id===row.id&&old.channelId===row.channelId&&row.version===old.version+1))),old=work?a.works.find(row=>row.id===work.id):undefined,job=work&&old?one(work.corrections.filter((row):row is ProductionJob=>!!row&&!old.corrections.some(prior=>prior?.id===row.id))):undefined,c=work?context(work.channelId,work.id,work.contractId??undefined):null
  const line=work&&c?schedule(job,c.label+'的这次校正或返工',work.channelId):null
  return line?line+' 做完仍须重新核对本版；原费用、提交期限和客户义务不因此消失。':null
 }
 if(kind==='NegotiateVideoCommission'){
  const row=one(b.contracts.filter(row=>row.status==='negotiating'&&row.negotiationJobId!==null&&a.contracts.some(old=>old.id===row.id&&old.workId===row.workId&&old.negotiationJobId!==row.negotiationJobId))),c=row?contractContext(row):null,job=row?one(current.operations?.jobs.filter(job=>job.id===row.negotiationJobId)??[]):undefined
  const line=row&&c?schedule(job,c.label+(row.negotiation==='price'?'的原报价谈判':'的原范围谈判'),row.channelId):null
  return line?line+' 条件尚未获客户接受；原期限与已耗成本继续保留。':null
 }
 if(kind==='PublishVideo'){
  const row=one(b.publications.filter(row=>!a.publications.some(old=>old.id===row.id)&&row.publishedAt===current.date&&row.measuredAt===null)),c=row?context(row.channelId,row.workId):null
  return row&&c?`${c.label}已于${row.publishedAt}发布，${row.measureAt}才统计这次真实反馈。播放、询价、原收益资格和现金分别核对，发布没有提前加钱。`:null
 }
 if(kind==='ExitVideoCommission'){
  const row=one(b.contracts.filter(row=>row.status==='cancelled'&&a.contracts.some(old=>old.id===row.id&&old.workId===row.workId&&old.status!=='cancelled'))),c=row?contractContext(row):null
  return c?`${c.label}的原客户约定已退出。未完成部分没有记作交付；已耗制作成本、原预款退款与尚欠义务继续按原账处理，没有开启另一单。`:null
 }
 if(kind==='AbandonVideoWork'){
  const work=one(b.works.filter(row=>row.abandonedAt===current.date&&a.works.some(old=>old.id===row.id&&old.channelId===row.channelId&&old.abandonedAt===null))),c=work?context(work.channelId,work.id):null
  return c?`${c.label}已收起。原已耗成本与行动保留，未开工预留按原账处理；没有发布、收入或免费重做。`:null
 }
 if(kind==='CollectVideoSettlement'){
  const rows=[...b.contracts.flatMap(row=>{const text=settled(row);return text?[text]:[]}),...b.settlements.flatMap(row=>{const text=collected(row);return text?[text]:[]})]
  return one(rows)??null
 }
 if(kind!=='AdvanceTime')return null
 const facts:string[]=[]
 for(const work of b.works){
  const old=one(a.works.filter(row=>row.id===work.id&&row.channelId===work.channelId)),c=context(work.channelId,work.id,work.contractId??undefined)
  if(!old||!c)continue
  for(const job of [work.production,...work.corrections]){
   const prior=job?one([old.production,...old.corrections].filter((row):row is ProductionJob=>!!row&&row.id===job.id)):undefined
   if(!job||!active(prior))continue
   if(job.status==='completed'&&job.completeAt<=current.date)facts.push(`${c.label}的${job.id===work.production?.id?'制作':'本次校正或返工'}已于${job.completeAt}实际完成；仍须核对本版${work.contractId?'并亲手提交客户':'，再决定发布'}，没有因此收到款`)
   if(job.status==='running'&&prior?.status==='planned'){const text=schedule(job,c.label+(job.id===work.production?.id?'的这次制作':'的这次校正或返工'),work.channelId);if(text)facts.push(text)}
  }
 }
 for(const row of b.marketing){
  const old=one(a.marketing.filter(prior=>prior.id===row.id&&prior.channelId===row.channelId)),c=context(row.channelId)
  if(c&&old?.completedAt===null&&row.completedAt!==null&&row.completedAt<=current.date&&active(old.job)&&row.job?.id===old.job?.id&&row.job?.status==='completed'){
   const leads=c.channel.leads.filter(lead=>lead.cohortId===row.cohortId),oldChannel=a.channels.find(channel=>channel.id===row.channelId),added=leads.filter(lead=>!oldChannel?.leads.some(prior=>prior.personId===lead.personId&&prior.cohortId===lead.cohortId))
   facts.push(`${c.label}的这次推广已于${row.completedAt}实际完成；该来源新增${added.length}份合格询价，当前${leads.length}份尚未转化。下一步可明确选择回应哪位客户；询价还不是订单或收入`)
  }
  if(c&&old?.job?.id===row.job?.id&&old?.job?.status==='planned'&&row.job?.status==='running'){const text=schedule(row.job,c.label+' · 这次原推广',row.channelId);if(text)facts.push(text)}
 }
 for(const row of b.contracts){
  const old=one(a.contracts.filter(prior=>prior.id===row.id&&prior.channelId===row.channelId&&prior.workId===row.workId)),c=contractContext(row)
  if(!old||!c)continue
  const paid=settled(row);if(paid){facts.push(paid);continue}
  if(row.status==='delivered'&&old.status!=='delivered'&&row.reviewedAt!==null&&row.reviewedAt<=current.date&&row.paymentAt)facts.push(`${c.label}已于${row.reviewedAt}获原客户验收。原预款${moneyText(row.prepaymentFen)}按原交付处理，原余款应收${moneyText(row.priceFen-row.prepaymentFen)}仍等${row.paymentAt}回款；验收没有把应收变现金`)
  if(row.status==='revision'&&old.status==='review'&&row.reviewedAt!==null&&row.reviewedAt<=current.date&&row.reviewedAt!==old.reviewedAt)facts.push(`${c.label}的原客户已于${row.reviewedAt}提出修改，尚未验收。你可核对原版本与条款，再决定返工、原谈判或退出`)
  if(old.negotiationOutcome===null&&row.negotiationOutcome!==null&&row.negotiationJobId===old.negotiationJobId){const job=one(current.operations?.jobs.filter(job=>job.id===row.negotiationJobId)??[]);if(job&&job.completeAt<=current.date&&job.status==='completed')facts.push(`${c.label}的原谈判已有实际回信：${row.negotiationOutcome==='accepted'?'本次条件获接受，仍须核对原版本并亲手提交':'本次条件未获接受，原约定保留'}；没有自动验收或付款`)}
  if(row.status==='cancelled'&&old.status!=='cancelled')facts.push(`${c.label}的原约定已停止，未完成部分没有记作交付；原预款退款、已耗成本与尚欠义务继续保留`)
 }
 for(const row of b.publications){
  const old=one(a.publications.filter(prior=>prior.id===row.id&&prior.channelId===row.channelId&&prior.workId===row.workId)),c=context(row.channelId,row.workId)
  if(!old||!c||old.measuredAt!==null||row.measuredAt===null||row.measuredAt>current.date)continue
  const through=addDays(row.measuredAt,7),affiliateWindow=row.monetization==='affiliate'&&row.qualified&&row.cohortId!==null
  facts.push(`${c.label}于${row.measuredAt}留下实际统计：播放${row.views}、合格询价${row.qualifiedInquiries}；这些不是现金${row.monetization!=='none'&&!row.qualified?'，本次发布没有对应收益资格，统计不会补发收入':''}${affiliateWindow?current.date<through?`，原订单观察仍需等到${through}`:`，原订单观察止于${through}，款项另按原结算核对`:''}`)
 }
 for(const row of b.settlements){
  const text=collected(row);if(text){facts.push(text);continue}
  if(a.settlements.some(old=>old.id===row.id))continue
  const pub=one(b.publications.filter(pub=>pub.id===row.publicationId&&pub.channelId===row.channelId&&pub.settlementId===row.id)),c=pub?context(row.channelId,pub.workId):null
  if(c&&row.confirmedAt<=current.date)facts.push(`${c.label}按原记录新增${row.kind==='ads'?'平台分成':'带货佣金'}应收${moneyText(row.amountFen)}，${row.dueAt}到期；原费用${moneyText(row.feeFen)}另核，还没有实际到账`)
 }
 return facts.length?facts.join('；')+'。':null
}
