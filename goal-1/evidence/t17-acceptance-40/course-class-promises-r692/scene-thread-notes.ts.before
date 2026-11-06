import type {PlayFeatures} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {moneyText} from './game-text.ts'
import {addDays} from '../core/calendar.ts'
import type {VideoProjection} from '../core/video-projection.ts'

export interface SceneThread {id:string;screen:Screen;title:string;detail:string;personId?:LifePerson;incidentId?:string}
type KnownRisk=Pick<PlayFeatures['story']['incidents'][number],'id'|'kind'|'stage'|'deadline'|'resolvedAt'|'businessIds'|'knownCostFen'|'paidWorkCostFen'|'unverifiedFeePaidFen'|'unpaidKnownCostFen'>
const stages:Record<string,string>={signal:'有信号，仍待核实',investigating:'独立调查中',confirmed:'已确认范围外行为',containing:'部分隔离，等待验证',recovering:'替代准备中',residual:'仍有残余',takeover:'托管后仍待验证',unresolved:'暂缓，仍未解决'}

/** These are already public facts. Never infer a hidden verdict from a warning. */
export function riskThreads(incidents:readonly KnownRisk[],businessName:(id:string)=>string=id=>'原业务 · '+id.slice(-6)):SceneThread[]{
 return incidents.filter(i=>i.resolvedAt===null&&i.stage!=='normal').map(i=>({id:'risk:'+i.id,screen:'story',incidentId:i.id,title:(i.kind==='agent'?'衡星权限与控制核查':'原合同身份核对')+' · '+i.businessIds.map(businessName).join(' / ')+' · '+(stages[i.stage]??'仍需核对'),detail:`期限${i.deadline} · 已记费用${moneyText(i.knownCostFen+i.paidWorkCostFen+i.unverifiedFeePaidFen)}，其中未付${moneyText(i.unpaidKnownCostFen)}。暂停自报不代表独立恢复。`}))
}

/** No highlight budget: every accepted promise and continuing business responsibility is retained. */
export function videoThreads(video:VideoProjection,date:string):SceneThread[]{
 if(!video)return []
 const name=(channelId:string)=>video.channels.find(c=>c.id===channelId)?.name??'原视频账号'
 const stages:Record<string,string>={production:'仍待制作与交付',review:'客户复核中',revision:'修改意见待处理',negotiating:'条款谈判中',delivered:'已验收，仍待回款',settled:'原费用仍待结清'}
 return [
  ...video.contracts.filter(c=>c.status!=='cancelled'&&(c.status!=='settled'||!c.paidCase)).map(c=>({id:'video-contract:'+c.id,screen:'video' as const,title:name(c.channelId)+' · '+(stages[c.status]??'原商单仍在'),detail:`约定报价${moneyText(c.priceFen)} · ${c.status==='delivered'?`回款日${c.paymentAt??'待原记录确认'}`:c.status==='settled'?'款项已结算，仍须处理原账未付费用':`${c.dueAt}前交付`}。原预款${moneyText(c.prepaymentFen)}不是利润；当前保护与欠款以原账为准。`})),
  ...video.publications.filter(p=>p.measuredAt===null).map(p=>({id:'video-publication:'+p.id,screen:'video' as const,title:name(p.channelId)+' · 发布后的观察',detail:`${p.publishedAt}发布，${p.measureAt}统计实际反馈。播放、询价与收入分别核对；下架不抹去原结算安排。`})),
  ...video.publications.filter(p=>p.measuredAt!==null&&p.monetization==='affiliate'&&p.qualified&&p.settlementId===null&&date<addDays(p.measuredAt,7)).map(p=>({id:'video-window:'+p.id,screen:'video' as const,title:name(p.channelId)+' · 带货观察窗口',detail:`退货观察至${addDays(p.measuredAt!,7)}。佣金以实际留存订单为准；商品成交额不是佣金，也不是到账。`})),
  ...video.settlements.filter(s=>s.collectedAt===null).map(s=>({id:'video-settlement:'+s.id,screen:'video' as const,title:name(s.channelId)+' · '+(s.kind==='ads'?'平台分成':'带货佣金')+'待到账',detail:`已确认${moneyText(s.amountFen)} · 原手续费${moneyText(s.feeFen)} · ${s.dueAt}回款。确认收入不等于可花现金${s.kind==='affiliate'?'，商品成交额不计为佣金':''}。`})),
 ]
}

export function sceneThreads(f:PlayFeatures,date:string):SceneThread[]{
 return [
  ...f.life.queued.map(p=>({id:'life:'+p.id,screen:'life' as const,personId:p.personId,title:p.title,detail:`${p.deadline}前实际完成 · ${p.jobId?'已安排工作':'仍需另行工作'} · 个人${moneyText(p.costFen)} / ${p.actionPoints}点 / ${p.days}日。接受约定没有代替兑现。`})),
  ...riskThreads(f.story.incidents,id=>{const business=f.story.businesses.find(b=>b.id===id);return (business?.route==='ai_course'?'课程工作室':business?.route==='api_relay'?'API中转站':'原业务')+' · '+id.slice(-6)}),
  ...videoThreads(f.video,date),
  ...(f.course?.updates??[]).filter(u=>u.resolvedAt===null).map(u=>({id:'update:'+u.id,screen:'course' as const,title:'课程里的工具变了',detail:`${u.dueAt}前更新或停售，旧学员的承诺仍在。`})),
  ...(f.course?.cohorts??[]).filter(c=>c.closedAt===null).map(c=>({id:'cohort:'+c.id,screen:'course' as const,title:c.startAt+'开班的课，还在等你',detail:`教学至${c.endAt} · 支持至${c.supportCompleteAt} · 退款窗口至${c.refundUntil}。`})),
  ...(f.relay?.businesses??[]).filter(b=>b.lifecycle!=='closed').map(b=>({id:'relay:'+b.id,screen:'relay' as const,title:b.lifecycle==='preparing'?'开门前的准备，仍要一步步核对':'本站的原约定与余额，仍需核对',detail:`客户保护${moneyText(b.funds.prepaidLiabilityFen)} · 应付${moneyText(b.funds.payableFen)} · 应收${moneyText(b.funds.receivableFen)}。`})),
  ...(f.deepseek?.contracts??[]).filter(c=>!['completed','cancelled'].includes(c.status)).map(c=>({id:'eco:'+c.id,screen:'deepseek' as const,title:'一次生态合作，还在履约途中',detail:`客户保护${moneyText(c.balance?.prepaidFen)} · 应收${moneyText(c.balance?.receivableFen)}。旧合同不会因离开页面消失。`})),
  ...(f.deepseek?.agreements??[]).map(a=>({id:'equity:'+a.id,screen:'deepseek' as const,title:'架空股权的原约，仍要看清',detail:`${a.shares}/${a.totalShares}股 · 锁定至${a.lockUntil} · ${a.followDecision==='pending'?'跟投待决定，默认不付款':'估值不是可花现金'}。`})),
  ...(f.routines?.plans??[]).filter(r=>r.status==='paused'||r.status==='confirmed').map(r=>({id:'routine:'+r.id,screen:'routines' as const,title:r.name,detail:r.status==='paused'?'条件变了，未来安排已暂停；已经发生的费用与履约保留。':'已确认的范围仍待逐项执行，不包含新的交易、招生或代理扩权。'})),
 ]
}
