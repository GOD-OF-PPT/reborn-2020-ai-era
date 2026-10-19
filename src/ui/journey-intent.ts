import type {PlayingView,PlayFeatures} from './game-types.ts'

/** A task's far deadline cannot skip the intervening costs of finite closing. */
export function journeyIntent(view:PlayingView,kind:string,payload:unknown,label:string,confirm=false){
 const next=(view.features as unknown as PlayFeatures).journey?.nextTailDate
 if(view.phase==='epilogue'&&kind==='AdvanceTime'&&next){
  const target=typeof payload==='object'&&payload!==null&&'date' in payload?String(payload.date):null
  return {kind:'AdvanceEpilogueTime',payload:{date:next},label:'沿原事项继续至'+next+(target&&target!==next?' · 原事项目标'+target:''),confirm:true}
 }
 return {kind,payload,label,confirm}
}
