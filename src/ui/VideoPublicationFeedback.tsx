import type {VideoPublicationFeedbackReading} from './video-publication-feedback.ts'
import './video-publication-feedback.css'

/** The same small feedback note belongs in the room and on the street. */
export function VideoPublicationFeedback({value}:{value:VideoPublicationFeedbackReading}){
 return <section className="video-publication-feedback" aria-label="这一份发布的实际反馈">
  <div className="video-feedback-measures"><dl><div><dt>实际播放</dt><dd>{value.views.toLocaleString('zh-CN')}<small>次</small></dd></div><div><dt>合格询价</dt><dd>{value.inquiries.toLocaleString('zh-CN')}<small>名</small></dd></div></dl><p className="video-feedback-source">{value.measuredAt}<br/>实际反馈</p></div>
  <p className="video-feedback-money">询价还不是订单。{value.moneyLine}</p>
 </section>
}
