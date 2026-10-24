import type {CommandEnvelope} from '../core/run-types.ts'
import type {VideoProjection} from '../core/video-projection.ts'
import {moneyText} from './game-text.ts'
import {VideoPublicationTerms} from './VideoPublicationTerms.tsx'
import type {PlayFeatures,PlayingView} from './game-types.ts'

/** Terms belong to the committed snapshot captured when this choice was opened. */
export function VideoCommandDetails({command,video,date,view,finance}:{command:CommandEnvelope;video:VideoProjection;date?:string;view?:PlayingView;finance?:PlayFeatures['workbench']['finance']}){
 if(command.kind==='ExitVideoCommission'){
  const recheck=<section className="confirmation-context video-contract"><p className="warning-box">这份退出确认的商单、作品或退款原账已无法对应，请返回重新核对；没有换到另一单。</p></section>
  if(!video||!view||!finance||command.runId!==view.runId||command.expectedRevision!==view.revision)return recheck
  const payload=typeof command.payload==='object'&&command.payload!==null?command.payload as Record<string,unknown>:{}
  const contracts=video.contracts.filter(contract=>contract.id===payload.contractId)
  if(contracts.length!==1)return recheck
  const contract=contracts[0]!
  const channels=video.channels.filter(channel=>channel.id===contract.channelId),works=video.works.filter(work=>work.id===contract.workId)
  if(channels.length!==1||works.length!==1||['delivered','settled','cancelled'].includes(contract.status))return recheck
  const channel=channels[0]!,work=works[0]!
  if(work.channelId!==channel.id||work.contractId!==contract.id)return recheck
  const businesses=view.operations?.businesses.filter(business=>business.id===channel.businessId)??[]
  const accounts=finance.filter(account=>account.accountId===channel.accountId)
  const balances=finance.flatMap(account=>account.contracts.filter(balance=>balance.id===contract.id).map(balance=>({owner:account.accountId,balance})))
  if(businesses.length!==1||businesses[0]!.route!=='ai_video'||businesses[0]!.accountId!==channel.accountId||view.accounts.filter(account=>account.accountId===channel.accountId).length!==1||accounts.length!==1||balances.length!==1)return recheck
  const {owner,balance}=balances[0]!
  if(owner!==channel.accountId||balance.accountId!==channel.accountId||balance.businessId!==channel.businessId||!Number.isSafeInteger(balance.prepaidFen)||balance.prepaidFen<0)return recheck
  return <section className="confirmation-context video-contract">
   <p>{channel.name} · 作品第{work.version}版 · 原报价{moneyText(contract.priceFen)}。本次将退还未履约预款<strong>{moneyText(balance.prepaidFen)}</strong>，不是收入；尚未执行这次退款。</p>
   <p>若实际可付资金不足，未付部分仍保留为本单退款欠款，不会因退出清除。已经实际消耗的制作、返工、谈判成本和行动不会退回。</p>
   <p>尚未开工的原计划将取消并释放对应预留；仍在进行的原任务会中断。退出还会按原规则影响本账号声誉，退款实付与欠款须在保存后的原账核对。</p>
  </section>
 }
 if(command.kind==='PublishVideo'){
  const payload=typeof command.payload==='object'&&command.payload!==null?command.payload as Record<string,unknown>:{}
  return <VideoPublicationTerms video={video} date={date??''} workId={typeof payload.workId==='string'?payload.workId:''} monetization={typeof payload.monetization==='string'?payload.monetization:''} className="confirmation-context video-contract"/>
 }
 if(command.kind!=='AcceptVideoCommission'||!video)return null
 const terms=video.catalog.commercial
 return <section className="confirmation-context video-contract">
  <p>这笔商单约定报价<strong>{moneyText(terms.priceFen)}</strong>。{terms.prepaymentFen>0?<>收到<strong>{moneyText(terms.prepaymentFen)}</strong>预款时，会同时保护这笔钱，用于原单交付或退款。</>:'本次不收预款。'}现在的收入仍是<strong>¥0</strong>，制作仍使用上方核对的自有资金。</p>
  <p>先完成制作与人工核对，再由客户用{terms.reviewDays}天复核；验收后形成{moneyText(terms.priceFen-terms.prepaymentFen)}余款应收，{terms.paymentDays}天后才收款。结算费按实际报价的{terms.feeBps/100}%计算，追加修改仍要安排时间与成本。已花成本和原责任不会因退出或翻页消失。</p>
 </section>
}
