import type {PlayFeatures} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {moneyText} from './game-text.ts'

export interface SceneThread {id:string;screen:Screen;title:string;detail:string;personId?:LifePerson}
type KnownRisk=Pick<PlayFeatures['story']['incidents'][number],'id'|'kind'|'stage'|'deadline'|'resolvedAt'|'businessIds'|'knownCostFen'|'paidWorkCostFen'|'unverifiedFeePaidFen'|'unpaidKnownCostFen'>
const stages:Record<string,string>={signal:'有信号，仍待核实',investigating:'独立调查中',confirmed:'已确认范围外行为',containing:'部分隔离，等待验证',recovering:'替代准备中',residual:'仍有残余',takeover:'托管后仍待验证',unresolved:'暂缓，仍未解决'}

/** These are already public facts. Never infer a hidden verdict from a warning. */
export function riskThreads(incidents:readonly KnownRisk[],businessName:(id:string)=>string=id=>'原业务 · '+id.slice(-6)):SceneThread[]{
 return incidents.filter(i=>i.resolvedAt===null&&i.stage!=='normal').map(i=>({id:'risk:'+i.id,screen:'story',title:(i.kind==='agent'?'衡星权限与控制核查':'原合同身份核对')+' · '+i.businessIds.map(businessName).join(' / ')+' · '+(stages[i.stage]??'仍需核对'),detail:`期限${i.deadline} · 已记费用${moneyText(i.knownCostFen+i.paidWorkCostFen+i.unverifiedFeePaidFen)}，其中未付${moneyText(i.unpaidKnownCostFen)}。暂停自报不代表独立恢复。`}))
}

/** No highlight budget: every accepted promise and continuing business responsibility is retained. */
export function sceneThreads(f:PlayFeatures):SceneThread[]{
 return [
  ...f.life.queued.map(p=>({id:'life:'+p.id,screen:'life' as const,personId:p.personId,title:p.title,detail:`${p.deadline}前实际完成 · ${p.jobId?'已安排工作':'仍需另行工作'} · 个人${moneyText(p.costFen)} / ${p.actionPoints}点 / ${p.days}日。接受约定没有代替兑现。`})),
  ...riskThreads(f.story.incidents,id=>{const business=f.story.businesses.find(b=>b.id===id);return (business?.route==='ai_course'?'课程工作室':business?.route==='api_relay'?'API中转站':'原业务')+' · '+id.slice(-6)}),
  ...(f.course?.updates??[]).filter(u=>u.resolvedAt===null).map(u=>({id:'update:'+u.id,screen:'course' as const,title:'课程里的工具变了',detail:`${u.dueAt}前更新或停售，旧学员的承诺仍在。`})),
  ...(f.course?.cohorts??[]).filter(c=>c.closedAt===null).map(c=>({id:'cohort:'+c.id,screen:'course' as const,title:c.startAt+'开班的课，还在等你',detail:`教学至${c.endAt} · 支持至${c.supportCompleteAt} · 退款窗口至${c.refundUntil}。`})),
  ...(f.relay?.businesses??[]).filter(b=>b.lifecycle!=='closed').map(b=>({id:'relay:'+b.id,screen:'relay' as const,title:'线路那头，还有人在使用服务',detail:`客户保护${moneyText(b.funds.prepaidLiabilityFen)} · 应付${moneyText(b.funds.payableFen)} · 应收${moneyText(b.funds.receivableFen)}。`})),
  ...(f.deepseek?.contracts??[]).filter(c=>!['completed','cancelled'].includes(c.status)).map(c=>({id:'eco:'+c.id,screen:'deepseek' as const,title:'一次生态合作，还在履约途中',detail:`客户保护${moneyText(c.balance?.prepaidFen)} · 应收${moneyText(c.balance?.receivableFen)}。旧合同不会因离开页面消失。`})),
  ...(f.deepseek?.agreements??[]).map(a=>({id:'equity:'+a.id,screen:'deepseek' as const,title:'架空股权的原约，仍要看清',detail:`${a.shares}/${a.totalShares}股 · 锁定至${a.lockUntil} · ${a.followDecision==='pending'?'跟投待决定，默认不付款':'估值不是可花现金'}。`})),
  ...(f.routines?.plans??[]).filter(r=>r.status==='paused'||r.status==='confirmed').map(r=>({id:'routine:'+r.id,screen:'routines' as const,title:r.name,detail:r.status==='paused'?'条件变了，未来安排已暂停；已经发生的费用与履约保留。':'已确认的范围仍待逐项执行，不包含新的交易、招生或代理扩权。'})),
 ]
}
