import type {GamePanelProps,SceneTarget} from './game-types.ts'
import {routePreparationReading,type PreparationRoute} from './route-preparation-reading.ts'

/** Public starting conditions describe a choice; they never authorize a command. */
export function routeCurrentChoice(route:PreparationRoute){
 const reading=routePreparationReading(route)
 const labels:Record<string,string>={discovered:'已经发现，尚未开业',preparing:'准备仍在进行',operating:'这里已有一份经营',paused:'经营已暂停',winding_down:'正在收尾'}
 const continuation:Record<string,string>={discovered:'已经记下这项经营；准备与开业仍由你决定。',preparing:'先接回这份准备，再决定下一步。',operating:'继续已有经营，或为下一次尝试核对条件。',paused:'经营已经暂停；先看原来的记录与责任。',winding_down:'这份经营正在收尾；旧约和款项分别处理。'}
 const established=route.businessId!==null&&Object.hasOwn(labels,route.lifecycle)
 const known=reading!==null&&(established||route.businessId===null&&route.lifecycle==='not_started')
 return {
  known,established,
  continuation:established?continuation[route.lifecycle]!:null,
  caption:!known?'先核对这份条件':established?labels[route.lifecycle]!:'这一次想走的路',
  capitalLabel:established?'原起步资金门槛':'起步资金门槛',
  fundsShort:known&&!established&&reading?.fundsShort===true,
  material:route.requirements.preparationKey===null?'本段无需材料':route.requirements.preparationReady?'准备材料已具备':'准备材料尚未完成',
  barriers:reading?.barriers??[],
  note:established?'起步门槛供回看；旧事项按各自条件继续。':'门槛不是本次付款，具体投入下一步核对。',
 }
}

/** Enter the selected route's public account, never an unrelated previously viewed account. */
export function routeChoiceTarget(p:Pick<GamePanelProps,'view'|'features'>,id:PreparationRoute['id']):SceneTarget|null{
 const matches=p.features.workbench.routes.filter(row=>row.id===id)
 if(matches.length!==1)return null
 const route=matches[0]!,accounts=p.view.accounts.filter(a=>a.accountId===route.accountId)
 if(accounts.length!==1)return null
 if(route.businessId===null)return route.accountId==='personal'?{accountId:'personal'}:null
 const originals=p.view.operations?.businesses.filter(b=>b.id===route.businessId)??[]
 if(originals.length!==1)return null
 const original=originals[0]!
 if(original.accountId!==route.accountId||original.definitionId!==route.definitionId||original.route!==route.id||original.lifecycle==='closed')return null
 const accountId=route.accountId,businessId=original.id
 if(id==='ai_course'){
  const rows=p.features.course?.businesses.filter(b=>b.id===businessId&&b.accountId===accountId)??[]
  return rows.length===1?{accountId,courseTarget:{kind:'studio',businessId}}:null
 }
 if(id==='deepseek_opportunity'){
  const rows=p.features.deepseek?.businesses.filter(b=>b.id===businessId&&b.accountId===accountId)??[]
  return rows.length===1?{accountId,deepseekPane:'ecosystem',ecosystemTarget:{kind:'business',runId:p.view.runId,accountId,businessId}}:null
 }
 if(id==='api_relay'){
  const rows=p.features.relay?.stations.filter(s=>s.businessId===businessId)??[]
  if(rows.length===1)return {accountId,relayTarget:{kind:'business',runId:p.view.runId,accountId,businessId,stationId:rows[0]!.id}}
 }
 return {accountId}
}
