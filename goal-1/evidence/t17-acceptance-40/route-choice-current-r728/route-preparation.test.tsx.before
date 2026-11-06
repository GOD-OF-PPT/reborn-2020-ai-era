import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {OpportunityAtlas,type RouteId} from './OpportunityAtlas.tsx'
import {Dialog} from './Dialog.tsx'
import {routePreparationReading} from './route-preparation-reading.ts'
import {RoutePreparationSummary} from './RoutePreparationSummary.tsx'
import {moneyText,reasonText} from './game-text.ts'

// A local component callback driver over normal in-memory Create projections.
// No controller submission, store, codec, import/export or reload checks.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 return {...actual,useState:<T,>(initial:T|(()=>T))=>{const index=hooks.index++;if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[index] as T,(next:T|((old:T)=>T))=>{hooks.values[index]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[index] as T):next}] as const}}
})
afterEach(()=>{hooks.values=[];hooks.index=0;vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
const registry=createCampaignRegistry(),run=createCampaignRun({runId:'route-atlas-ui',actorId:'player',commandId:'create',seed:'route-atlas-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function driver(change?:(p:GamePanelProps)=>GamePanelProps){
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures,view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const request=vi.fn(),p0:GamePanelProps={view,features,request,accountId:'personal',controller:{snapshot:{view,busy:false}} as unknown as GamePanelProps['controller']},p=change?.(p0)??p0,onRoute=vi.fn()
 const render=()=>{hooks.index=0;return elements(OpportunityAtlas({...p,onRoute}))}
 const click=(label:string)=>{const rows=render(),dialog=rows.find(n=>n.type===Dialog),scope=dialog?elements(dialog):rows;const node=scope.find(n=>n.type==='button'&&(n.props['aria-label']===label||words(n.props.children)===label));if(!node||typeof node.props.onClick!=='function')throw Error('BUTTON_REQUIRED:'+label);node.props.onClick()}
 const route=(id:RouteId)=>p.features.workbench.routes.find(r=>r.id===id)!
 const select=(id:RouteId)=>click('聚焦'+route(id).name)
 return {p,request,onRoute,render,click,select,route,dialog:()=>render().find(n=>n.type===Dialog),text:()=>render().map(n=>n.type==='section'||n.type==='aside'?words(n):'').join(' ')}
}

it('summarizes normal five-route public conditions without losing funding, materials or money boundaries',()=>{
 const ui=driver()
 for(const route of ui.p.features.workbench.routes){
  const reading=routePreparationReading(route)!;expect(reading).not.toBeNull()
  const rows=elements(RoutePreparationSummary({route,reading})),text=words(rows[0])
  expect(text).toContain(route.preparation);expect(text).toContain(moneyText(route.requirements.minimumCashFen));expect(text).toContain(moneyText(route.requirements.availableCashFen));expect(text).toContain('门槛，不是本次付款')
  if(route.requirements.preparationKey!==null&&!route.requirements.preparationReady)expect(text).toContain('尚待完成')
  expect(text).not.toContain('WORLD_RELEASE_NOT_OCCURRED');expect(reading.barriers.length).toBeLessThanOrEqual(2)
 }
 expect(routePreparationReading(ui.route('ai_video'))!.futureTools).toBe(true)
 expect(routePreparationReading(ui.route('api_relay'))!.boundary).toContain('客户充值需要保护')
 expect(routePreparationReading(ui.route('ai_course'))!.boundary).toContain('交付义务')
 expect(routePreparationReading(ui.route('deepseek_opportunity'))!.boundary).toContain('明确架空股权')
 expect(ui.request).not.toHaveBeenCalled()
})

it('keeps actual insufficient and negative available money rather than replacing it with zero or a fabricated cost',()=>{
 const ui=driver(),route=ui.route('ai_video')
 for(const availableCashFen of [100,-100]){
  const current={...route,requirements:{...route.requirements,availableCashFen}},reading=routePreparationReading(current)!
  expect(reading.fundsShort).toBe(true);const text=words(RoutePreparationSummary({route:current,reading}))
  expect(text).toContain(moneyText(availableCashFen));expect(text).toContain('还未达到起步门槛');expect(text).toContain('本段无需')
 }
})

it('groups only known blocker categories while unknown or uncertain values retain the original full reader',()=>{
 const ui=driver(),route=ui.route('deepseek_opportunity'),original=route.requirements.reasons[0]!
 const current={...route,requirements:{...route.requirements,reasons:[{...original,reason:'CAPABILITY_NOT_YET_AVAILABLE'},{...original,reason:'WORLD_RELEASE_NOT_OCCURRED'},{...original,reason:'MISSING_ENTITLEMENT:one'},{...original,reason:'MISSING_ENTITLEMENT:two'}]}}
 expect(routePreparationReading(current)!.barriers).toEqual(['需要的工具还在等待开放。','所需的访问或经营资格尚未取得。'])
 for(const changed of [
  {...route,requirements:{...route.requirements,reasons:[{...original,reason:'UNRECOGNIZED_PUBLIC_REQUIREMENT'}]}},
  {...route,requirements:{...route.requirements,minimumCashFen:NaN}},
  {...route,requirements:{...route.requirements,availableCashFen:Number.MAX_SAFE_INTEGER+1}},
  {...route,requirements:{...route.requirements,minimumCashFen:-1}},
  {...ui.route('ai_video'),futureTool:['UNKNOWN_FUTURE_QUALIFICATION']},
  {...ui.route('a_share'),requirements:{...ui.route('a_share').requirements,preparationReady:false}},
 ])expect(routePreparationReading(changed)).toBeNull()
})

it('opens a direct comparison, expands the same original full conditions and returns without navigating or creating a command',()=>{
 const ui=driver();ui.select('ai_video');ui.click('查看'+ui.route('ai_video').name+'的准备条件')
 expect(ui.dialog()?.props.layout).toBe('direct');const first=ui.render().find(n=>n.type===RoutePreparationSummary)!
 expect(first.props.route).toBe(ui.route('ai_video'));expect(words(ui.dialog()?.props.footer)).toContain('看看作品与需求')
 ui.click('翻阅完整条件 ↗');expect(ui.dialog()?.props.layout).toBe('book');let text=words(ui.dialog())
 for(const value of [ui.route('ai_video').preparation,ui.route('ai_video').feedback,...ui.route('ai_video').futureTool.map(reasonText)])expect(text).toContain(value)
 ui.click('返回简明条件');expect(ui.dialog()?.props.layout).toBe('direct');expect(ui.render().find(n=>n.type===RoutePreparationSummary)?.props.route).toBe(first.props.route)
 ui.click('再想一想');expect(ui.dialog()).toBeUndefined();expect(ui.request).not.toHaveBeenCalled();expect(ui.onRoute).not.toHaveBeenCalled()
})

it('the brief view retains the exact original route navigation and never grants execution to a missing-condition route',()=>{
 const ui=driver();ui.select('deepseek_opportunity');ui.click('查看'+ui.route('deepseek_opportunity').name+'的准备条件')
 expect(ui.dialog()?.props.layout).toBe('direct');expect((ui.render().find(n=>n.type===RoutePreparationSummary)!.props.reading as {barriers:readonly string[]}).barriers.length).toBeGreaterThan(0)
 ui.click('看看合作与原协议 ↗');expect(ui.onRoute).toHaveBeenCalledExactlyOnceWith('deepseek_opportunity');expect(ui.dialog()).toBeUndefined();expect(ui.request).not.toHaveBeenCalled()
})

it('unknown conditions and epilogue start with the full original reader and all original actions',()=>{
 for(const closing of [false,true]){
  hooks.values=[];const ui=driver(p=>({...p,view:{...p.view,phase:closing?'epilogue':'playing'},features:{...p.features,workbench:{...p.features.workbench,routes:p.features.workbench.routes.map(r=>r.id==='ai_video'?{...r,futureTool:['UNKNOWN_FUTURE_QUALIFICATION']}:r)}}}))
  ui.select('ai_video');ui.click('查看'+ui.route('ai_video').name+'的准备条件');expect(ui.dialog()?.props.layout).toBe('book');expect(ui.render().some(n=>n.type===RoutePreparationSummary)).toBe(false)
  expect(words(ui.dialog())).toContain(reasonText('UNKNOWN_FUTURE_QUALIFICATION'));ui.click('走进'+ui.route('ai_video').name);expect(ui.onRoute).toHaveBeenCalledExactlyOnceWith('ai_video');expect(ui.request).not.toHaveBeenCalled()
 }
})
