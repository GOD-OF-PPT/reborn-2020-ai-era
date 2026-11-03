import type {PublicFeedback} from '../application/public-feedback.ts'
import type {PlayFeatures} from './game-types.ts'
import {activityText} from './game-text.ts'
import {sceneTimeNarrative} from './SceneEcho.tsx'

const genericSuccess='已保存你的安排。详情以当前状态和账本为准。'

/** Successful decisions already have a scoped scene echo. A controller's old,
 * fact-free acknowledgement must not reappear when that echo is dismissed. */
export function sceneStatusNotice(notice:string|null):string|null {
 if(notice===null)return null
 if(notice===genericSuccess||notice==='事件选择已处理'||/^(经营|模拟市场)指令已处理：[A-Za-z]+$/.test(notice))return null
 const text=activityText(notice)
 // Preserve an unfamiliar or richer message rather than hiding it merely
 // because the older formatter recognizes an implementation phrase inside it.
 return text===genericSuccess?notice:text
}

const first=(text:string)=>text.includes('。')?text.slice(0,text.indexOf('。')+1):text

/** Describe an actual public feedback, never infer a future stop or income. */
export function waitCauseBrief(date:string,cause:string,feedback:readonly PublicFeedback[],before:PlayFeatures['firstOrder'],after:PlayFeatures['firstOrder']):string {
 const original=first(cause)
 if(original!==date+'。')return original
 const paused=feedback.filter(row=>row.attention==='pause')
 if(paused.length===1){
  const row=paused[0]!
  if(row.kind==='result'&&row.sourceId===after.offerId&&before.offerId===after.offerId&&before.status!==after.status&&after.status==='expired')return '委托答复期限已过。'
  if(row.label.trim())return row.label
 }
 // Several changes retain their full original narration; do not invent a
 // single cause or a priority based on a hidden event queue.
 return first(sceneTimeNarrative(date,cause))
}
