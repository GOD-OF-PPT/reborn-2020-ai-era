import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {OpportunityAtlas,type RouteId} from './OpportunityAtlas.tsx'
import {Dialog} from './Dialog.tsx'
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
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children)]:[]
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
const registry=createCampaignRegistry(),run=createCampaignRun({runId:'route-atlas-ui',actorId:'player',commandId:'create',seed:'route-atlas-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function driver(change?:(p:GamePanelProps)=>GamePanelProps){
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures,view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const request=vi.fn(),p0:GamePanelProps={view,features,request,accountId:'personal',controller:{snapshot:{view,busy:false}} as unknown as GamePanelProps['controller']},p=change?.(p0)??p0,onRoute=vi.fn()
 const render=()=>{hooks.index=0;return elements(OpportunityAtlas({...p,onRoute}))}
 const click=(label:string)=>{const node=render().find(n=>n.type==='button'&&n.props['aria-label']===label);if(!node||typeof node.props.onClick!=='function')throw Error('BUTTON_REQUIRED:'+label);node.props.onClick()}
 const route=(id:RouteId)=>p.features.workbench.routes.find(r=>r.id===id)!
 const select=(id:RouteId)=>click('聚焦'+route(id).name)
 return {p,request,onRoute,render,click,select,route,text:()=>render().map(n=>n.type==='section'||n.type==='aside'?words(n):'').join(' ')}
}

it('makes all five gameplay loops distinct while selection only changes the displayed route',()=>{
 const ui=driver(),before=JSON.stringify(ui.p.features)
 const expected:Record<RouteId,readonly string[]>={a_share:['看看公开资料','写下买卖条件','等成交，再等交收'],ai_video:['挑一份作品或需求','制作、交付或发布','看真实反馈与回款'],ai_course:['备好案例与样课','招生，兑现每堂课','答疑支持，逐步结算'],api_relay:['看供应，谈客户','安排服务与支持','看用量，核账收款'],deepseek_opportunity:['挑一份合作需求','按约交付与支持','核对结算与旧约']}
 for(const id of Object.keys(expected) as RouteId[]){
  ui.select(id);const rows=ui.render(),path=rows.find(n=>n.type==='aside')!
  expect(path.props['aria-label']).toBe(ui.route(id).name+'的玩法过程')
  expect(elements(path).filter(n=>n.type==='li').map(n=>words(n.props.children).slice(2))).toEqual(expected[id])
  expect(rows.filter(n=>n.type==='button'&&n.props['aria-pressed']===true).map(n=>n.props['aria-label'])).toEqual(['聚焦'+ui.route(id).name])
  expect(rows.some(n=>n.props.role==='progressbar'||'aria-valuenow' in n.props)).toBe(false)
 }
 expect(ui.onRoute).not.toHaveBeenCalled();expect(ui.request).not.toHaveBeenCalled();expect(JSON.stringify(ui.p.features)).toBe(before)
})

it('each concrete entry uses the exact original route id without starting a business or issuing a command',()=>{
 const ui=driver(),labels:Record<RouteId,string>={a_share:'看看行情与委托',ai_video:'看看作品与需求',ai_course:'看看课程与学员',api_relay:'看看客户与服务',deepseek_opportunity:'看看合作与原协议'}
 for(const id of Object.keys(labels) as RouteId[]){ui.select(id);ui.click(labels[id]+' · '+ui.route(id).name);expect(ui.onRoute).toHaveBeenLastCalledWith(id)}
 expect(ui.onRoute).toHaveBeenCalledTimes(5);expect(ui.request).not.toHaveBeenCalled()
})

it('both arrow controls wrap through the same five choices without navigating',()=>{
 const ui=driver(),selected=()=>ui.render().find(n=>n.type==='button'&&n.props['aria-pressed']===true)?.props['aria-label']
 ui.click('上一条人生路线');expect(selected()).toBe('聚焦'+ui.route('deepseek_opportunity').name)
 ui.click('下一条人生路线');expect(selected()).toBe('聚焦'+ui.route('a_share').name)
 for(let n=0;n<5;n++)ui.click('下一条人生路线')
 expect(selected()).toBe('聚焦'+ui.route('a_share').name);expect(ui.onRoute).not.toHaveBeenCalled();expect(ui.request).not.toHaveBeenCalled()
})

it('keeps every original preparation, money, feedback and refusal reason in the original condition dialog',()=>{
 const ui=driver()
 for(const route of ui.p.features.workbench.routes){
  ui.select(route.id);ui.click('查看'+route.name+'的准备条件');const dialog=ui.render().find(n=>n.type===Dialog)!,text=words(dialog)
  for(const value of [route.preparation,route.feedback,moneyText(route.requirements.minimumCashFen),moneyText(route.requirements.availableCashFen),...route.requirements.reasons.map(r=>reasonText(r.reason))])expect(text).toContain(value)
  if(route.id==='ai_video')for(const reason of route.futureTool)expect(text).toContain(reasonText(reason))
  if(route.id==='deepseek_opportunity')expect(text).toContain('现实公开申购未提供')
  ;(dialog.props.onClose as ()=>void)();expect(ui.render().some(n=>n.type===Dialog)).toBe(false)
 }
 expect(ui.onRoute).not.toHaveBeenCalled();expect(ui.request).not.toHaveBeenCalled()
})

it('keeps manual 2020 production and separate fictional equity boundaries explicit',()=>{
 const ui=driver();ui.select('ai_video');expect(ui.text()).toContain('2020年可以从手工剪辑开始。')
 ui.select('deepseek_opportunity');expect(ui.text()).toContain('技术合作怎样走');expect(ui.text()).not.toContain('架空股权另有资格与协议。');expect(ui.text()).toContain('技术合作与明确架空股权分别核条件、另立协议')
 ui.select('a_share');expect(ui.text()).toContain('虚构个股模拟 · 判断不保证收益')
})

it('read-only and original unmet conditions allow browsing without granting execution',()=>{
 const ui=driver(p=>({...p,view:{...p.view,readOnly:true,readOnlyReason:'ANOTHER_WRITER'},features:{...p.features,workbench:{...p.features.workbench,routes:p.features.workbench.routes.map(r=>({...r,requirements:{...r.requirements,availableCashFen:0,preparationReady:false}}))}}}))
 expect(ui.text()).toContain('还要准备什么');ui.select('api_relay');ui.click('查看'+ui.route('api_relay').name+'的准备条件');expect(ui.render().some(n=>n.type===Dialog)).toBe(true)
 expect(ui.request).not.toHaveBeenCalled();expect(ui.onRoute).not.toHaveBeenCalled()
})

it('epilogue reads old records and never presents an unstarted gameplay track as the next opportunity',()=>{
 const ui=driver(p=>({...p,view:{...p.view,phase:'epilogue'}}))
 for(const route of ui.p.features.workbench.routes){ui.select(route.id);expect(ui.render().some(n=>n.type==='aside')).toBe(false);expect(ui.text()).toContain('回看'+route.name);expect(ui.text()).not.toContain('可能的人生');ui.click('翻看原记录 · '+route.name);expect(ui.onRoute).toHaveBeenLastCalledWith(route.id)}
 expect(ui.request).not.toHaveBeenCalled()
})

it('text-only and failed artwork retain all five destinations and the same gameplay information',()=>{
 const ui=driver(),picture=ui.render().find(n=>n.type==='img')!;(picture.props.onError as ()=>void)();expect(ui.render().some(n=>n.type==='img')).toBe(false);expect(ui.text()).toContain('等成交，再等交收')
 Object.assign(ui.p,{textOnly:true});ui.select('ai_video');expect(ui.render().some(n=>n.type==='img')).toBe(false);expect(ui.render().filter(n=>n.type==='button'&&String(n.props['aria-label']).startsWith('聚焦'))).toHaveLength(5)
 expect(ui.text()).toContain('制作、交付或发布');expect(ui.request).not.toHaveBeenCalled()
})
