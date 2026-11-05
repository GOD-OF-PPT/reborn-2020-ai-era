import type {GamePanelProps} from './game-types.ts'

export type PreparationRoute=GamePanelProps['features']['workbench']['routes'][number]
export type RoutePreparationReading={readonly barriers:readonly string[];readonly fundsShort:boolean;readonly boundary:string;readonly futureTools:boolean}
const boundaries:Record<PreparationRoute['id'],string>={
 a_share:'虚构个股模拟；行情、委托与交收分别记录，判断不保证收益。',
 ai_video:'制作、提交、验收和回款，各有自己的时刻。',
 ai_course:'预售款对应交付义务；教学和支持仍要亲自兑现。',
 api_relay:'供应预付是资产，客户充值需要保护，不能直接当利润。',
 deepseek_opportunity:'技术合作按约结算；明确架空股权另核资格与协议。',
}

/** Summarizes only publicly known blocker categories. Unknown reasons retain
 * the original complete reader rather than being guessed or silently omitted. */
export function routePreparationReading(route:PreparationRoute):RoutePreparationReading|null{
 const r=route.requirements
 if(!Number.isSafeInteger(r.minimumCashFen)||r.minimumCashFen<0||!Number.isSafeInteger(r.availableCashFen)||typeof r.preparationReady!=='boolean'||r.preparationKey===null&&!r.preparationReady)return null
 const known=(reason:string)=>reason==='CAPABILITY_NOT_YET_AVAILABLE'||reason==='WORLD_RELEASE_NOT_OCCURRED'||reason.startsWith('MISSING_ENTITLEMENT:')&&reason.length>'MISSING_ENTITLEMENT:'.length
 if(r.reasons.some(item=>!known(item.reason))||route.id==='ai_video'&&route.futureTool.some(reason=>!known(reason)))return null
 const barriers:string[]=[]
 if(r.reasons.some(item=>item.reason==='CAPABILITY_NOT_YET_AVAILABLE'||item.reason==='WORLD_RELEASE_NOT_OCCURRED'))barriers.push('需要的工具还在等待开放。')
 if(r.reasons.some(item=>item.reason.startsWith('MISSING_ENTITLEMENT:')))barriers.push('所需的访问或经营资格尚未取得。')
 return {barriers,fundsShort:r.availableCashFen<r.minimumCashFen,boundary:boundaries[route.id],futureTools:route.id==='ai_video'&&route.futureTool.length>0}
}
