import {addDays,quarterOf} from '../core/calendar.ts'
import type {VideoProjection} from '../core/video-projection.ts'

export interface VideoSceneTarget{
 readonly channelId:string
 readonly workId?:string
 readonly contractId?:string
 readonly section?:'publications'|'leads'|'making'
}
export interface VideoSceneProgress{
 readonly title:string
 readonly line:string
 readonly choice:{readonly title:string;readonly line:string;readonly label:string}
 readonly target?:VideoSceneTarget
 readonly command?:{readonly kind:'ReviewVideoOutput'|'SubmitVideoCommission';readonly payload:Record<string,unknown>;readonly confirm:boolean}
}
function detail(title:string,line:string,choiceTitle:string,choiceLine:string,label:string):VideoSceneProgress{
 return {title,line,choice:{title:choiceTitle,line:choiceLine,label}}
}

/** Presentation of committed public facts only; every action keeps its original command guard. */
export function videoSceneProgress(video:VideoProjection,date:string):VideoSceneProgress|null{
 if(!video||!video.channels.length)return null
 const contracts=video.contracts.filter(c=>!['settled','cancelled'].includes(c.status)).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.id.localeCompare(b.id))
 const contract=contracts[0]
 const work=contract?video.works.find(w=>w.id===contract.workId):video.works.find(w=>w.contractId===null&&w.abandonedAt===null&&!video.publications.some(p=>p.workId===w.id))
 const target:VideoSceneTarget|undefined=contract?{channelId:contract.channelId,workId:contract.workId,contractId:contract.id}:work?{channelId:work.channelId,workId:work.id}:undefined
 const selectedDetail=(...args:Parameters<typeof detail>):VideoSceneProgress=>({...detail(...args),...(target?{target}:{})})
 if(contract?.status==='review')return selectedDetail('作品已交，等一个真实的回答。','这一版已经交出，对方还没有最终验收。','看看这次客户复核',`${contract.submittedAt}提交，客户仍按原条款实际复核；这次提交不等于验收或到账。`,'查看客户复核与原条款')
 if(contract?.status==='delivered')return selectedDetail('对方认可了，回款还在路上。','客户已经验收，现金仍要等约定日期。','核对原来的回款约定',`余款约定${contract.paymentAt??'原记录所列日期'}收取，收款与手续费按原账执行；未到账前不作可花资金。`,'查看实际验收与应收')
 if(contract?.status==='negotiating')return selectedDetail('条件已提出，等对方答复。','这一次条款谈判已经按你的安排开始，结果仍待实际反馈。','看看这次条件谈判','原工作、成本与客户义务仍在，不因等待或换页而消失。','查看谈判任务与原义务')
 if(contract?.status==='revision')return selectedDetail('客户回话了，先看清修改。','对方提出了新的修改意见，还需要你决定如何回应。','把范围与代价谈清楚','原约定仍在，可以核对有成本的返工、条款谈判或有限退出；不把再次提交当作已经验收。','查看修改、谈判与退出')
 if(work){
  const ordinal=video.works.filter(w=>w.channelId===work.channelId).findIndex(w=>w.id===work.id)+1
  const channel=video.channels.find(c=>c.id===work.channelId)
  const item=(video.channels.length>1&&channel?channel.name+' / ':'')+'作品'+ordinal
  const jobs=[work.production,...work.corrections]
  const active=jobs.filter(j=>j&&(j.status==='planned'||j.status==='running')).sort((a,b)=>a!.completeAt.localeCompare(b!.completeAt))[0]
  if(active)return selectedDetail(contract?'答应过的作品，正在成形。':'这个念头，已经排进日历。',active.status==='planned'?'已经安排，仍须等到实际开工和完成。':'制作已经开始，做完以后还要认真检查。','把这一份先做好',`${item}安排在${active.startAt}—${active.completeAt}；实际完成、人工核对和回款各有自己的时刻。`,'查看这份作品的制作记录')
  if(!work.production||work.production.status!=='completed'||work.corrections.some(j=>!j||j.status!=='completed'))return selectedDetail('制作停下了，原承诺还在。','没有实际完成的部分，不能当作已经交付。','先把原安排收好','已花成本、原交付与退款责任继续保留；可以查看中断记录和有限收尾。','查看中断与原责任')
  if(work.defectKnown&&work.corrections.length===0)return selectedDetail('有些地方，还要认真修好。','已经公开的素材问题，需要先决定如何处理。','把素材与校正代价看清','校正仍使用真实资金、时间与资源；也可以核对放弃样片或退出原单的后果。','查看素材问题与校正安排')
  if(work.reviewedVersion!==work.version){
   const base=selectedDetail('成片做完了，先由自己看清。','制作已经实际结束，还要由你亲自把关。','亲手核对这一版成片',`${item}第${work.version}版仍待人工复核。记录来源、权利与使用说明，不代表客户认可或回款。`,'人工核对'+item+'与使用说明')
   return {...base,command:{kind:'ReviewVideoOutput',payload:{workId:work.id,disclosure:work.modeId==='manual'?'manual':work.modeId==='image_assisted'?'ai_assisted':'synthetic'},confirm:false}}
  }
  if(contract){
   const base=selectedDetail('现在，把这一版交给客户。','这一版已经由你核对，接着听客户的实际反馈。','交出已经复核的这一版',`${item}最晚${contract.dueAt}前提交；客户仍需复核，提交时不提前增加回款。`,'提交'+item+'的这一版')
   return {...base,command:{kind:'SubmitVideoCommission',payload:{contractId:contract.id},confirm:true}}
  }
  return selectedDetail('给这份作品，选一个去处。','这一版已核对，发布方式仍值得由你决定。','决定怎样让人看见作品','积累受众、平台分成与带货各有资格和结算条件；素材与合成标识仍按实际年代核对。','核对这份作品的发布选择')
 }
 if(contract)return selectedDetail('原来的约定，还要逐项看清。','这份客户责任仍保留在原记录里。','翻看原作品与客户记录','没有取得实际完成、验收和结算依据之前，不把这份责任说成已经结束。','查看原商单与责任')
 const published=video.publications.find(p=>p.measuredAt===null)
 if(published)return {...detail('作品已经发出，回应还在路上。','发布已经完成，实际反馈仍要等日子走到。','回看这一次发布',`${published.measureAt}统计实际反馈；播放、询价和收入分别发生，不把发布当作回款。`,'查看发布与实际反馈'),target:{channelId:published.channelId,workId:published.workId,section:'publications'}}
 const window=video.publications.find(p=>p.measuredAt!==null&&p.monetization==='affiliate'&&p.qualified&&p.settlementId===null&&date<addDays(p.measuredAt,7))
 if(window)return {...detail('有人看见了，仍要等订单留下。','带货的观察窗口还没有结束。','看清退货与佣金的边界',`${addDays(window.measuredAt!,7)}观察窗口结束，佣金只按实际留存订单确认；商品成交额不等于佣金。`,'查看带货观察与结算'),target:{channelId:window.channelId,workId:window.workId,section:'publications'}}
 const settlement=video.settlements.find(s=>s.collectedAt===null)
 if(settlement){
  const publication=video.publications.find(p=>p.id===settlement.publicationId)
  return {...detail('收入已有凭据，现金还在路上。','这一笔已确认，仍要等约定的实际结算。','回看这笔实际应收',`${settlement.dueAt}回款，原手续费另计；还没有收到的钱，不能支持今天的消费。`,'查看平台结算与原费用'),...(publication?{target:{channelId:publication.channelId,workId:publication.workId,section:'publications' as const}}:{})}
 }
 const paid=video.contracts.filter(c=>c.paidCase&&c.settledAt!==null&&quarterOf(c.settledAt)===quarterOf(date)).at(-1)
 if(paid)return {...detail('这笔商单，已经真正结算。',`${paid.settledAt}实际收取了这笔款，原费用也留在账里。`,'再给下一份作品留一点时间','已经发生的回款与成本都保留。下一份作品仍需新投入，不保证同样结果。','安排下一份作品'),target:{channelId:paid.channelId,section:'making'}}
 const leads=new Set(video.channels.filter(c=>c.lifecycle==='operating').flatMap(c=>c.leads.map(l=>l.personId)))
 if(leads.size){
  const channel=video.channels.find(c=>c.lifecycle==='operating'&&c.leads.length)!
  return {...detail('有人，真的需要你的作品。','已有作品带来了具体询价，接下来仍要认真核对。','听听这一次具体需求',`目前有${leads.size}名去重的合格询价者。询价还不是成交，素材、资源、报价与预款都要先看清。`,'核对现有商单与制作安排'),target:{channelId:channel.id,section:'leads'}}
 }
 return null
}
