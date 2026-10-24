import type {CommandEnvelope} from '../core/run-types.ts'
import type {VideoProjection} from '../core/video-projection.ts'
import {moneyText} from './game-text.ts'
import {VideoPublicationTerms} from './VideoPublicationTerms.tsx'

/** Terms belong to the committed snapshot captured when this choice was opened. */
export function VideoCommandDetails({command,video,date}:{command:CommandEnvelope;video:VideoProjection;date?:string}){
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
