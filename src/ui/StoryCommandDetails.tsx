import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {addDays} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'
const workNames:Record<string,string>={pilot:'早期协作试点',continuity:'支持继续经营',participation:'发布参与权谈判',deployment:'部署',records:'记录整理',drill:'退出演练',investigate:'独立调查',isolate:'撤权拆离',observe:'完整观察',recover:'替代准备',takeover:'外部接管'}
export function StoryCommandDetails({command,confirm,features,view,accountName}:{command:CommandEnvelope;confirm:CommandPreview;features:PlayFeatures;view:PlayingView;accountName:(id:string)=>string}){
 const p=typeof command.payload==='object'&&command.payload!==null?command.payload as Record<string,unknown>:{},v=features.story,incident=v.incidents.find(c=>c.id===p.incidentId),deployment=v.deployments.find(d=>d.id===p.deploymentId),affected=deployment?[deployment]:v.deployments.filter(d=>incident?.deploymentIds.includes(d.id))
 if(!['StartLinzhouWork','ChooseLinzhouPublication','StartHengxingDeployment','SetHengxingAuthority','StopHengxingAuthority','StartAgentPreparation','StartRiskTask','ConfirmRiskAssessment','DeclareRiskLiabilities','ResolveRiskCase','PayUnverifiedProcessingFee','ShareRiskFindings'].includes(command.kind))return null
 return <section className="confirmation-context story-confirmation"><h3>本次明确的范围和结果边界</h3>
 {command.kind==='StartHengxingDeployment'?<><p>由{accountName(view.operations?.businesses.find(b=>b.id===p.businessId)?.accountId??'personal')}支付实际部署成本，7天后才检查完成。初始仅逐项审批，支持累计预算上限{moneyText(Number(p.initialCashLimitFen))}，合同至{String(p.expiresAt)}。</p><p>月服务基准{moneyText(v.catalog.monthlyFeeFen)}按实际活跃日发生；此上限不是预先消费，也不是可花余额。完成部署不会免费完成原支持或允许更大权限。</p></>:null}
 {command.kind==='SetHengxingAuthority'?<><p>未来权限：{p.level==='cross_flow'?'跨流程与外部委托':p.level==='limited'?'有限既有支持自动步骤':'逐项审批'}；本次累计资金上限{moneyText(Number(p.cashLimitFen))}，有效至{String(p.expiresAt)}。</p><p>只允许{(p.scopes as string[]).map(s=>s==='course_support'?'本业务已有课程支持':s==='relay_support'?'本业务已签中转支持':'外部服务委托').join('、')}。不扩展到招生、新签客户、交易、融资或改供应；例行便利不会替代这份授权。</p><p>{p.externalDelegation?'存在单独外部委托。本人停止或系统自报已停，仍不能证明外部权限已经撤回。':'本次不新增外部委托。之前的外部权限仍需独立验证撤回。'}已经逐项确认的支持按原授权继续，不重绑到这份新权限。</p></>:null}
 {command.kind==='StopHengxingAuthority'||command.kind==='StartRiskTask'&&['isolate','takeover'].includes(String(p.kind))?<><p>撤回本人可控新权限并实际中断未完成的代理支持，旧学员/客户责任继续。已用未出账服务费另行结算：</p><ul>{affected.map(d=><li key={d.id}>{accountName(d.accountId)} · {moneyText(d.unbilledServiceFen)}；本账户现金不足部分保留应付，客户保护不可挪用。</li>)}</ul><p>停止请求与自报保留原记录；只有实际拆离、独立撤权核验、完整观察、真实替代或托管能力及旧责任登记全部满足，才可确认本次范围恢复。</p></>:null}
 {command.kind==='StartRiskTask'?<><p>{workNames[String(p.kind)]}需{confirm.actionPoints}点；实际工作成本{moneyText(confirm.upfrontCostFen-(confirm.accruedServiceFeeFen??0))}。使用{v.resources.find(r=>r.id===p.resourceId)?.label??'原选资源'}；同一资源仍受已有任务和工资约束，开始不会提前得到调查结果。</p>{incident&&incident.taskTerms[String(p.kind)]?<p>本项{incident.kind==='agent'?'权限核查':'原合同身份核对'}从{view.date}开工，预计{addDays(view.date,incident.taskTerms[String(p.kind)]!.days)}完成；默认处置{incident.deadline}不因这份委托延后。完成后仍须另行核对独立记录，不能复活已取消的支持。</p>:null}{p.kind==='takeover'?<p className="warning-box">你已明确接受有偿托管。实际完成后，本主体的新增经营管理权交给外部方；旧债、保护款和未交付合同仍然保留，不视为全部自主控制已收回。</p>:null}</>:null}
 {command.kind==='StartLinzhouWork'||command.kind==='StartAgentPreparation'?<p>{workNames[String(p.kind)]}占用真实行动、费用与日期。团队可以拒绝发布参与；记录和演练也不会免费完成风险调查或替代任务。中断保留已投入成本。</p>:null}
 {command.kind==='ChooseLinzhouPublication'?<p>明确选择{p.choice==='open'?'本局独立开放的架空局部分支':'封闭经营 / 不参与的默认路径'}。还需实际前置和团队同意；不会增加股份或现金。局部条件会改变，无关历史不全部重写。</p>:null}
 {command.kind==='DeclareRiskLiabilities'?<p>只登记当前原账：未交付/未收合同{incident?.currentLiabilities.contractIds.length}项、未结义务{incident?.currentLiabilities.obligationIds.length}项、关联任务{incident?.currentLiabilities.jobIds.length}项；本次不付款、不清债。</p>:null}
 {command.kind==='ResolveRiskCase'||command.kind==='ConfirmRiskAssessment'?<p>仅确认已经实际完成的独立证据与本次受控范围。原应收应付、客户保护、旧交付和范围之外的虚构协作网络继续存在。</p>:null}
 {command.kind==='PayUnverifiedProcessingFee'?<p className="warning-box">明确支出500元，可能全部损失；不增加收入、股份或当下的核实结论。需等待三天后可对照原合同的独立回执，原真实应收继续保留。</p>:null}
 {command.kind==='ShareRiskFindings'?<p>只在游戏世界内分享已选的{(p.evidenceIds as string[]).length}条已揭示证据摘要，不向互联网发送，也不附完整存档、私人备注或隐藏事实。外部组织仍有各自资源和选择。</p>:null}
 </section>
}
