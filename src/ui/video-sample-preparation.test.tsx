import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {VideoSceneChoice,videoScheduleCaption,type VideoChoiceAction} from './VideoSceneChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {Dialog} from './Dialog.tsx'
import type {VideoSceneTarget} from './video-scene-progress.ts'

// Normal in-memory choices only. No controller submission or persistence tests.
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
const sample=()=>{const ui=driver(one,{channelId});ui.open('sample');return ui}
const current=(ui:ReturnType<typeof driver>)=>ui.render().filter(n=>n.type==='li'&&n.props['aria-current']==='step').map(words)
function chooseThree(ui:ReturnType<typeof driver>,product='热点样片',material='自行制作并保留来源'){
 ui.select('product',product);ui.click('继续核对制作方式 →');ui.select('mode','手工剪辑');ui.click('继续核对素材来源 →');ui.select('material',material);ui.click('继续核对资源与日历 →')
}
it('uses four semantic direct pages, keeps all original options, and never fills a choice automatically',()=>{
 const ui=sample();expect(ui.dialog()?.props.layout).toBe('direct');expect(current(ui)).toEqual(['1作品方向']);expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').map(n=>n.props.checked)).toEqual([false,false,false]);expect(ui.render().some(n=>n.type===CommandButton)).toBe(false)
 ui.select('product','热点样片');ui.click('继续核对制作方式 →');expect(current(ui)).toEqual(['2制作方式']);expect(ui.dialog()?.props.layout).toBe('direct');expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').every(n=>!n.props.checked)).toBe(true)
 expect(words(ui.dialog())).toContain('2022-08-22起；这项工具在当前年代尚未开放');expect(words(ui.dialog())).toContain('使用前需先取得对应访问资格')
 ui.select('mode','手工剪辑');ui.click('继续核对素材来源 →');expect(current(ui)).toEqual(['3素材来源']);expect(words(ui.dialog())).toContain('额外¥300；不赠与其他作品或未来用途授权。');expect(words(ui.dialog())).toContain('完成后仍须人工核对本版素材、权利与使用说明。')
 ui.select('material','自行制作并保留来源');ui.click('继续核对资源与日历 →');expect(current(ui)).toEqual(['4资源与日历']);expect(ui.dialog()?.props.layout).toBe('direct');expect(ui.render().find(n=>n.type==='select')?.props.value).toBe('');expect(ui.render().find(n=>n.type==='input'&&n.props.type==='date')?.props.value).toBe('');expect(ui.p.request).not.toHaveBeenCalled()
})
it('uses the exact original payload and independent confirmation after explicit resource and date selection',()=>{
 const ui=sample();chooseThree(ui);ui.set('select','player-production');expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);ui.click('明确从今天 2020-01-01 开始')
 const command=ui.render().find(n=>n.type===CommandButton)!;expect(command.props).toMatchObject({kind:'StartVideoWork',payload:{channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'},confirm:true});expect(words(ui.dialog())).toContain('直接成本¥600 · 1点 · 7日，预计2020-01-08完成。');expect(words(ui.dialog())).toContain('做完仍须人工核对');expect(ui.p.request).not.toHaveBeenCalled()
})
it('keeps the selected choices when stepping back and changing one material, with the original licensed cost',()=>{
 const ui=sample();chooseThree(ui,'商家样片');ui.set('select','player-production');ui.set('date','2020-01-03');ui.click('← 调整素材来源');expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').map(n=>n.props.checked)).toEqual([true,false]);ui.select('material','购买本单授权素材');ui.click('继续核对资源与日历 →')
 const command=ui.render().find(n=>n.type===CommandButton)!;expect(command.props.payload).toEqual({channelId,productId:'commercial',modeId:'manual',materialId:'licensed',resources:['player-production'],startAt:'2020-01-03'});expect(words(ui.dialog())).toContain('直接成本¥1,200 · 1点 · 14日，预计2020-01-17完成。已含本单授权素材费用。');expect(ui.p.request).not.toHaveBeenCalled()
})
it('returns to the immediately previous preparation page without losing explicit product, mode, resource or date',()=>{
 const ui=sample();chooseThree(ui,'原创系列');ui.set('select','player-production');ui.set('date','2020-01-02');ui.click('← 调整素材来源');ui.click('← 调整制作方式');expect(current(ui)).toEqual(['2制作方式']);expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').map(n=>n.props.checked)).toEqual([true,false,false]);ui.click('← 调整作品方向');expect(current(ui)).toEqual(['1作品方向']);expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').map(n=>n.props.checked)).toEqual([false,true,false]);ui.click('继续核对制作方式 →');ui.click('继续核对素材来源 →');ui.click('继续核对资源与日历 →');expect(ui.render().find(n=>n.type==='select')?.props.value).toBe('player-production');expect(ui.render().find(n=>n.type==='input'&&n.props.type==='date')?.props.value).toBe('2020-01-02');expect(ui.p.request).not.toHaveBeenCalled()
})
it('keeps marketing, account selection and the full-record reading on their original paths',()=>{
 const ui=driver(one,{channelId});ui.open('marketing');expect(ui.dialog()?.props.layout).toBe('book');expect(current(ui)).toEqual([]);ui.click('返回调整');ui.click('先认真做一份样片选择作品方向、制作方式与真实投入。');expect(ui.dialog()?.props.layout).toBe('direct');ui.click('翻看作品与客户的完整记录 ↗');expect(ui.inspect).toHaveBeenCalledExactlyOnceWith({channelId,section:'making'});expect(ui.dialog()).toBeUndefined();expect(ui.p.request).not.toHaveBeenCalled()
})
it('keeps an unexpected number of public modes in the original reading instead of forcing a dense direct page',()=>{
 const ui=driver(one,{channelId},p=>({...p,features:{...p.features,video:{...p.features.video!,modes:[...p.features.video!.modes,p.features.video!.modes[0]!]}}}));ui.open('sample');expect(ui.dialog()?.props.layout).toBe('book');expect(current(ui)).toEqual([]);ui.select('product','热点样片');ui.click('继续核对制作方式 →');expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio')).toHaveLength(4);expect(ui.p.request).not.toHaveBeenCalled()
})
it('keeps mismatched targets on the original selection and a past date cannot form a valid production command',()=>{
 const invalid=driver(one,{channelId:'missing'});invalid.open('sample');expect(invalid.dialog()?.props.layout).toBe('book');expect(invalid.render().some(n=>n.type===CommandButton)).toBe(false);hooks.values=[]
 const ui=sample();chooseThree(ui);ui.set('select','player-production');ui.set('date','2019-12-31');expect(words(ui.dialog())).toContain('开工日已经过去');expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);expect(ui.p.request).not.toHaveBeenCalled()
})
it('reads known production budgets from the original jobs for each explicit sample purpose',()=>{
 const base={channelId,clientId:'',cohortId:'',modeId:'manual',materialId:'original',resource:'player-production',startAt:'2020-01-01',productId:'hotspot',name:'',segment:'',monetization:'',label:false}
 expect(videoScheduleCaption(base,'sample','2020-01-01')).toContain('¥600 · 1点 · 7日');expect(videoScheduleCaption({...base,productId:'original_series'},'sample','2020-01-01')).toContain('¥900 · 1点 · 14日');expect(videoScheduleCaption({...base,materialId:'licensed'},'sample','2020-01-01')).toContain('¥900 · 1点 · 7日');expect(videoScheduleCaption({...base,resource:''},'sample','2020-01-01')).toContain('先选择本次实际资源与开工日')
})
