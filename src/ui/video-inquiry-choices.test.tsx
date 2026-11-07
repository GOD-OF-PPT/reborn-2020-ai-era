import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {VideoSceneChoice,type VideoChoiceAction} from './VideoSceneChoice.tsx'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import {VideoInquiryChoices} from './VideoInquiryChoices.tsx'
import {CommandButton} from './CommandButton.tsx'
import {Dialog} from './Dialog.tsx'
// Normal gameplay evaluated in memory; no storage/codec/import/export/replay/fault tests.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=> 'first-video-ui'}
})
afterEach(()=>{hooks.values=[];hooks.index=0;vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
function elements(v:unknown):Element[]{
 if(Array.isArray(v))return v.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(v))return []
 const rows=[v,...elements(v.props.children),...elements(v.props.footer)]
 if(v.type===VideoInquiryChoices)rows.push(...elements(VideoInquiryChoices(v.props as unknown as ComponentProps<typeof VideoInquiryChoices>)))

 return rows
}
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'first-video-ui',actorId:'player',commandId:'create',seed:'first-video-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:Record<string,unknown>){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'first-video-'+run.revision,expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind);return result.nextRun}
const one=act(initial,'OpenVideoChannel',{name:'本地日常',segment:'local_merchants'})
function input(run=initial):GamePanelProps{
 const projected=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 return {view,features:projected as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}
}
function driver(run=initial,initialTarget?:VideoSceneTarget,change?:(p:GamePanelProps)=>GamePanelProps){
 const base=input(run),p=change?.(base)??base;Object.assign(p.controller.snapshot,{view:p.view})
 let target=initialTarget
 let activate:((intent?:VideoChoiceAction)=>void)|undefined
 const onTarget=vi.fn((next:VideoSceneTarget)=>{target=next}),inspect=vi.fn()
 const render=()=>{hooks.index=0;return elements(VideoSceneChoice({p,...(target?{target}:{}),onTargetChange:onTarget,onInspect:inspect,children:fn=>{activate=fn;return null}}))}
 const click=(label:string)=>{const rows=render(),dialog=rows.find(n=>n.type===Dialog),scope=dialog?elements(dialog):rows,node=scope.find(n=>n.type==='button'&&words(n.props.children)===label);if(!node||node.props.disabled||typeof node.props.onClick!=='function')throw Error('ENABLED_BUTTON_REQUIRED:'+label);node.props.onClick()}
 const fill=(value:string)=>{const node=render().find(n=>n.type==='input'&&!n.props.type)!;if(!node||typeof node.props.onChange!=='function')throw Error('NAME_FIELD_REQUIRED');node.props.onChange({target:{value}})}
 const audience=(index:number)=>{const node=render().filter(n=>n.type==='input'&&String(n.props.name).endsWith('segment'))[index]!;(node.props.onChange as ()=>void)()}
 const select=(suffix:string,label:string)=>{const wrap=render().find(n=>n.type==='label'&&words(n).startsWith(label)&&elements(n).some(e=>e.type==='input'&&String(e.props.name).endsWith(suffix)));const node=elements(wrap).find(n=>n.type==='input'&&n.props.type==='radio');if(!node||typeof node.props.onChange!=='function')throw Error('RADIO_REQUIRED:'+suffix+':'+label);node.props.onChange()}
 const set=(type:string,value:string)=>{const node=render().find(n=>n.type===type||(n.type==='input'&&n.props.type===type));if(!node||typeof node.props.onChange!=='function')throw Error('FIELD_REQUIRED:'+type);node.props.onChange({target:{value}})}
 render();return {p,onTarget,inspect,render,click,fill,audience,select,set,open:(intent?:VideoChoiceAction)=>{render();activate!(intent)},dialog:()=>render().find(n=>n.type===Dialog)}
}



const channelId=input(one).features.video!.channels[0]!.id
const production=act(one,'StartVideoWork',{channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'})
const workId=input(production).features.video!.works[0]!.id,target={channelId,workId}
function advanceTo(run:GameRun,date:string){for(let n=0;input(run).view.date<date&&n<5;n++)run=act(run,'AdvanceTime',{date});expect(input(run).view.date).toBe(date);return run}
const completed=advanceTo(production,'2020-01-08'),reviewed=act(completed,'ReviewVideoOutput',{workId,disclosure:'manual'}),published=act(reviewed,'PublishVideo',{workId,monetization:'none',label:false}),measured=advanceTo(published,'2020-01-15')

const readyLeads=input(measured).features.video!.channels[0]!.leads
const inquiryNode=(ui:ReturnType<typeof driver>)=>ui.render().find(n=>n.type===VideoInquiryChoices)!
const continuation=(ui:ReturnType<typeof driver>)=>ui.render().find(n=>n.type==='button'&&words(n)==='继续核对制作方式 →')!
function pick(ui:ReturnType<typeof driver>){const node=ui.render().find(n=>n.type==='input'&&String(n.props.name).endsWith('client'))!;if(!node||node.props.disabled)throw Error('INQUIRY_PICK_REQUIRED');(node.props.onChange as ()=>void)()}
function prepare(ui:ReturnType<typeof driver>){pick(ui);ui.click('继续核对制作方式 →');ui.select('mode','手工剪辑');ui.click('继续核对素材来源 →');ui.select('material','自行制作并保留来源');ui.click('继续核对资源与日历 →')}
const steps=(ui:ReturnType<typeof driver>)=>ui.render().filter(n=>n.type==='li'&&n.props['aria-current']==='step').map(words)

it('opens one preview paper with no chosen client, original money terms and no command',()=>{
 const ui=driver(measured,target);ui.open('commission');expect(readyLeads.length).toBeGreaterThan(1);expect(ui.dialog()?.props.layout).toBe('direct');expect(steps(ui)).toEqual(['1询价选择']);expect(inquiryNode(ui).props.preview).toEqual(readyLeads[0]);expect(inquiryNode(ui).props.selected).toBeNull();expect(continuation(ui).props.disabled).toBe(true);expect(words(ui.render())).toContain('保护预款');expect(words(ui.render())).toContain('当期收入仍为¥0');expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onTarget).not.toHaveBeenCalled()
})
it('flips through every actual inquiry without selecting, losing candidates or wrapping to another person',()=>{
 const ui=driver(measured,target);ui.open('commission');const visited=[];for(let n=0;n<readyLeads.length;n++){visited.push(inquiryNode(ui).props.preview);expect(inquiryNode(ui).props.selected).toBeNull();if(n+1<readyLeads.length)ui.click('下一份询价 →')};expect(visited).toEqual(readyLeads);const next=ui.render().find(n=>n.type==='button'&&words(n)==='下一份询价 →')!;expect(next.props.disabled).toBe(true);expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onTarget).not.toHaveBeenCalled()
})
it('looking at B keeps explicit A but cannot continue A while B is on the desk',()=>{
 const ui=driver(measured,target);ui.open('commission');pick(ui);expect(inquiryNode(ui).props.selected).toEqual(readyLeads[0]);expect(continuation(ui).props.disabled).toBe(false);ui.click('下一份询价 →');expect(inquiryNode(ui).props.preview).toEqual(readyLeads[1]);expect(inquiryNode(ui).props.selected).toEqual(readyLeads[0]);expect(continuation(ui).props.disabled).toBe(true);expect(words(ui.render())).toContain('已选第1份');ui.click('回到已选询价');expect(continuation(ui).props.disabled).toBe(false);expect(ui.p.request).not.toHaveBeenCalled()
})
it('uses four direct semantic steps while preserving the original explicit payload and independent confirmation',()=>{
 const ui=driver(measured,target);ui.open('commission');pick(ui);ui.click('继续核对制作方式 →');expect(steps(ui)).toEqual(['2制作方式']);expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').map(n=>n.props.checked)).toEqual([false,false,false]);ui.select('mode','手工剪辑');ui.click('继续核对素材来源 →');expect(steps(ui)).toEqual(['3素材来源']);ui.select('material','自行制作并保留来源');ui.click('继续核对资源与日历 →');expect(steps(ui)).toEqual(['4资源与日历']);expect(ui.dialog()?.props.layout).toBe('direct');expect(ui.render().find(n=>n.type==='select')?.props.value).toBe('');expect(ui.render().find(n=>n.type==='input'&&n.props.type==='date')?.props.value).toBe('');ui.set('select','player-production');ui.click('明确从今天 2020-01-15 开始');const command=ui.render().find(n=>n.type===CommandButton)!;expect(command.props).toMatchObject({kind:'AcceptVideoCommission',payload:{channelId,clientId:readyLeads[0]!.personId,cohortId:readyLeads[0]!.cohortId,modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-15'},confirm:true});expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onTarget).toHaveBeenCalledExactlyOnceWith({channelId,section:'leads'})
})
it('returns one step at a time and keeps the same explicit client, mode, material, resource and future date',()=>{
 const ui=driver(measured,target);ui.open('commission');prepare(ui);ui.set('select','player-production');ui.set('date','2020-01-16');ui.click('← 调整素材来源');ui.click('← 调整制作方式');ui.click('← 调整询价选择');expect(steps(ui)).toEqual(['1询价选择']);expect(inquiryNode(ui).props.selected).toEqual(readyLeads[0]);expect(inquiryNode(ui).props.preview).toEqual(readyLeads[0]);ui.click('先合上，保留草稿');expect(ui.dialog()).toBeUndefined();ui.open('commission');expect(inquiryNode(ui).props.selected).toEqual(readyLeads[0]);ui.click('继续核对制作方式 →');ui.click('继续核对素材来源 →');ui.click('继续核对资源与日历 →');expect(ui.render().find(n=>n.type===CommandButton)?.props.payload).toMatchObject({clientId:readyLeads[0]!.personId,startAt:'2020-01-16',modeId:'manual',materialId:'original',resources:['player-production']});expect(ui.p.request).not.toHaveBeenCalled()
})
it('a duplicate identity or unknown public mode retains the original complete reading',()=>{
 for(const change of [(p:GamePanelProps)=>({...p,features:{...p.features,video:{...p.features.video!,channels:p.features.video!.channels.map(c=>({...c,leads:[...c.leads,c.leads[0]!]}))}}}),(p:GamePanelProps)=>({...p,features:{...p.features,video:{...p.features.video!,modes:[...p.features.video!.modes,p.features.video!.modes[0]!]}}})]){hooks.values=[];const ui=driver(measured,target,change);ui.open('commission');expect(ui.dialog()?.props.layout).toBe('book');expect(ui.render().some(n=>n.type===VideoInquiryChoices)).toBe(false);expect(ui.p.request).not.toHaveBeenCalled()}
})
it('zero actions can inspect the original preparation but its unchanged command preview refuses a current commitment',()=>{
 let run=act(measured,'WorkQuarter',{});run=act(run,'StartLifeWork',{kind:'rest',personId:null,reference:null});const ui=driver(run,target);expect(ui.p.view.budget.available).toBe(0);ui.open('commission');prepare(ui);ui.set('select','player-production');ui.click('明确从今天 2020-01-15 开始');const node=ui.render().find(n=>n.type===CommandButton)!;expect(node).toBeDefined();const command={runId:run.runId,actorId:run.actorId,commandId:'inspect-zero-ap',expectedRevision:run.revision,kind:String(node.props.kind),payload:node.props.payload};expect(previewCommand(run,command,registry,run.actorId).reasonCodes).toContain('INSUFFICIENT_CAPACITY');expect(ui.p.request).not.toHaveBeenCalled()
})
it('read-only preparation retains its original submission lock rather than getting a write permission',()=>{
 const ui=driver(measured,target,p=>({...p,view:{...p.view,readOnly:true,readOnlyReason:'ANOTHER_WRITER',saveStatus:'read_only'}}));ui.open('commission');prepare(ui);ui.set('select','player-production');ui.click('明确从今天 2020-01-15 开始');expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);expect(words(ui.dialog())).toContain('不能提交视频安排');expect(ui.p.request).not.toHaveBeenCalled()
})
it('the normal explicit selection still creates the original protected prepayment and real production cost through the unchanged command',()=>{
 const ui=driver(measured,target);ui.open('commission');prepare(ui);ui.set('select','player-production');ui.click('明确从今天 2020-01-15 开始');const node=ui.render().find(n=>n.type===CommandButton)!,before=input(measured),next=act(measured,String(node.props.kind),node.props.payload as Record<string,unknown>),after=input(next),contract=after.features.video!.contracts[0]!;expect(contract).toMatchObject({clientId:readyLeads[0]!.personId,cohortId:readyLeads[0]!.cohortId,priceFen:300000,prepaymentFen:90000,status:'production'});expect(after.view.budget.available).toBe(before.view.budget.available-1);expect(after.view.accounts.find(a=>a.accountId==='personal')!.availableFen).toBe(before.view.accounts.find(a=>a.accountId==='personal')!.availableFen-90000);expect(ui.p.request).not.toHaveBeenCalled()
})
function paper(props?:Partial<ComponentProps<typeof VideoInquiryChoices>>){const p=input(measured),browse=vi.fn(),select=vi.fn();return {p,browse,select,props:{p,contextKey:'same-original-scope',name:'inquiry-client',leads:readyLeads,preview:readyLeads[0]!,selected:null,priceFen:300000,prepaymentFen:90000,includedRevisions:1,onBrowse:browse,onSelect:select,...props}}}
it('a missing preview explains the missing identity and only explicit restart opens the first actual candidate',()=>{
 const c=paper({preview:{personId:'missing-person',cohortId:'missing-cohort'}});hooks.index=0;const rows=elements(VideoInquiryChoices(c.props));expect(words(rows)).toContain('已不在当前可接名单');expect(rows.some(n=>n.type==='input')).toBe(false);const restart=rows.find(n=>n.type==='button'&&words(n)==='从第一份重新翻阅')!;(restart.props.onClick as ()=>void)();expect(c.browse).toHaveBeenCalledExactlyOnceWith(readyLeads[0]);expect(c.select).not.toHaveBeenCalled();expect(c.p.request).not.toHaveBeenCalled()
})
it('old browse and choose callbacks retire across A to B to A and changed owners or committed views',()=>{
 const c=paper(),draw=(contextKey='A')=>{hooks.index=0;return elements(VideoInquiryChoices({...c.props,contextKey}))},old=draw(),oldPick=old.find(n=>n.type==='input')!,oldNext=old.find(n=>n.type==='button'&&words(n)==='下一份询价 →')!;draw('B');draw('A');(oldPick.props.onChange as ()=>void)();(oldNext.props.onClick as ()=>void)();expect(c.select).not.toHaveBeenCalled();expect(c.browse).not.toHaveBeenCalled();const current=draw().find(n=>n.type==='input')!;Object.assign(c.p.controller.snapshot,{view:{...c.p.view,revision:c.p.view.revision+1}});(current.props.onChange as ()=>void)();expect(c.select).not.toHaveBeenCalled()
})
