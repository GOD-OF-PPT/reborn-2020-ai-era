import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {VideoSceneChoice,type VideoChoiceAction} from './VideoSceneChoice.tsx'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import {videoWorkStage,videoWorkCanReturnToday,videoPublicationPreparation} from './video-work-stage.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {VideoEncounter} from './VideoEncounter.tsx'
import {VideoPublicationTerms} from './VideoPublicationTerms.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {Dialog} from './Dialog.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {videoFirstAttemptReading} from './video-first-attempt.ts'
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
function context(run:GameRun,t:VideoSceneTarget=target){const p=input(run),focus=openingFocusFor(p,'video',{accountId:'personal',videoTarget:t})!;return {p,focus,thread:playerThread(p,focus)}}
function surface(run:GameRun,t:VideoSceneTarget=target){const c=context(run,t);hooks.index=0;const tree=NarrativeScene({...c.p,screen:'video',headingRef:null,personId:'tang-ying',onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null,videoTarget:t});return elements(tree).find(n=>typeof n.type==='function'&&n.type.name==='SceneChoiceSurface')!}
function encounter(run:GameRun){const c=context(run);return {c,node:VideoEncounter({...c,p:c.p,thread:c.thread,date:c.thread.wait?.date??null,waitLabel:c.thread.wait?.label??'',onChoose:vi.fn(),onResult:vi.fn(),onToday:vi.fn()})}}
const terms=(ui:ReturnType<typeof driver>)=>{const node=ui.render().find(n=>n.type===VideoPublicationTerms);if(!node)throw Error('ORIGINAL_TERMS_REQUIRED');return VideoPublicationTerms(node.props as unknown as ComponentProps<typeof VideoPublicationTerms>)}

it('keeps the complete normal sample lifecycle on one direct stage while the original stages remain distinct',()=>{
 for(const [run,stage] of [[production,'video-running'],[completed,'video-self-review'],[reviewed,'video-ready-to-publish'],[published,'video-published'],[measured,'video-published']] as const){hooks.values=[];const c=context(run);expect(c.thread.stage).toBe(stage);expect(videoWorkStage(c.p,c.thread)).toBe(true);const node=surface(run);expect(node.props).toMatchObject({direct:true,video:true,work:true});expect(c.p.request).not.toHaveBeenCalled()}
 expect(context(published).thread.outcome).toBe('pending');expect(context(measured).thread.outcome).toBe('actual');expect(videoWorkCanReturnToday(context(published).p,context(published).thread)).toBe(false);expect(videoWorkCanReturnToday(context(measured).p,context(measured).thread)).toBe(true)
})
it('keeps planned work and original dates separate from real starting and completing',()=>{
 const planned=act(one,'StartVideoWork',{channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-10'}),t={channelId,workId:input(planned).features.video!.works[0]!.id},c=context(planned,t);expect(c.thread.stage).toBe('video-planned');expect(c.thread.wait?.date).toBe('2020-01-10');expect(videoWorkStage(c.p,c.thread)).toBe(true);expect(c.p.view.budget.reserved).toBe(1);expect(c.p.request).not.toHaveBeenCalled()
})
it('keeps the original Clock and review command, binding each paper to the same supplied action',()=>{
 for(const run of [production,completed]){hooks.values=[];const e=encounter(run);if(!isValidElement<ComponentProps<typeof VideoThreadAction>>(e.node))throw Error('THREAD_ACTION_REQUIRED');const result=VideoThreadAction(e.node.props);expect(isValidElement(result)).toBe(true)
  const node=result as ReactElement<Record<string,unknown>>,activate=vi.fn(),binding={label:run===production?e.c.thread.wait!.label+' · '+e.c.thread.wait!.date:'人工核对这一版',disabled:false,reason:null,activate}
  expect(node.type).toBe(run===production?ClockAdvance:CommandButton);if(run===production)expect(node.props.date).toBe(e.c.thread.wait!.date);else expect(node.props).toMatchObject({kind:'ReviewVideoOutput',payload:{workId,disclosure:'manual'},confirm:false})
  const render=node.props.renderAction as (value:typeof binding,main?:unknown)=>unknown;const rows=elements(render(binding,<div/>)),paper=rows.find(n=>n.type===OpeningObject)!;expect(paper.props.onActivate).toBe(activate);expect(paper.props.copyMode).toBe('tableau');expect(rows.some(n=>n.type==='span'&&n.props.className==='scene-choice-overline')).toBe(false);if(run===production)expect(paper.props.detail).toBe('');(paper.props.onActivate as ()=>void)();expect(activate).toHaveBeenCalledOnce();expect(e.c.p.request).not.toHaveBeenCalled()
 }
})
it('publishing first requires an explicit mode and then reads the complete original terms before the original confirm command',()=>{
 const ui=driver(reviewed,target);ui.open('publish');expect(ui.dialog()?.props.layout).toBe('direct');expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').map(n=>n.props.checked)).toEqual([false,false,false]);expect(ui.render().find(n=>n.type==='input'&&n.props.type==='checkbox')?.props.checked).toBe(false);expect(ui.render().some(n=>n.type===CommandButton)).toBe(false)
 ui.select('publish','积累受众');expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);ui.click('核对本次反馈与资格 →');expect(ui.dialog()?.props.layout).toBe('direct');expect(ui.dialog()?.props.title).toBe('这一份发布，会得到什么反馈？');expect(words(terms(ui))).toContain('2020-01-15统计实际曝光与询价。发布本身不增加现金。');expect(words(terms(ui))).toContain('这次只积累受众，不申请平台分成或带货变现。')
 expect(ui.render().find(n=>n.type===CommandButton)?.props).toMatchObject({kind:'PublishVideo',payload:{workId,monetization:'none',label:false},confirm:true});expect(ui.p.request).not.toHaveBeenCalled()
})
it('changing publishing mode preserves the original synthetic label and retains all qualification and affiliate limits',()=>{
 const ui=driver(reviewed,target);ui.open('publish');ui.select('publish','带货');const label=ui.render().find(n=>n.type==='input'&&n.props.type==='checkbox')!;(label.props.onChange as (e:unknown)=>void)({target:{checked:true}});ui.click('核对本次反馈与资格 →');expect(words(terms(ui))).toContain('以后取得资格也不会给这次发布补计收入。');expect(words(terms(ui))).toContain('只有本次资格覆盖、且统计时实际形成受众，才有后续订单观察');ui.click('← 调整发布方式');expect(ui.render().find(n=>n.type==='input'&&n.props.type==='checkbox')?.props.checked).toBe(true);expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').map(n=>n.props.checked)).toEqual([false,false,true]);ui.select('publish','平台分成');ui.click('核对本次反馈与资格 →');expect(words(terms(ui))).toContain('当前账号没有覆盖本次统计日的平台分成资格。');expect(ui.render().find(n=>n.type===CommandButton)?.props.payload).toEqual({workId,monetization:'ads',label:true});expect(ui.p.request).not.toHaveBeenCalled()
})
it('connects actual feedback directly to an explicit inquiry choice or Today while keeping other account choices available',()=>{
 const c=context(measured),today=vi.fn(),result=vi.fn(),choose=vi.fn();hooks.index=0;const rows=elements(VideoThreadAction({p:c.p,thread:c.thread,active:true,date:null,waitLabel:'',onChoose:choose,onToday:today,onResult:result,children:primary=>primary?.main})),buttons=rows.filter(n=>n.type==='button'),hasLeads=c.p.features.video!.channels[0]!.leads.length>0;
 const returnButton=buttons.find(n=>words(n).includes(hasLeads?'先回到今天':'合上这份作品，回到今天'))!;(returnButton.props.onClick as ()=>void)();expect(today).toHaveBeenCalledOnce();expect(result).not.toHaveBeenCalled();if(hasLeads){expect(words(buttons[0])).toContain('挑一位询价者');(buttons[0]!.props.onClick as ()=>void)();expect(choose).toHaveBeenCalledExactlyOnceWith('commission')}
 const more=buttons.find(n=>words(n).includes('看看这个账号的其他选择'))!;(more.props.onClick as ()=>void)();expect(result).toHaveBeenCalledOnce();expect(c.p.request).not.toHaveBeenCalled();expect(c.p.view.date).toBe('2020-01-15')
})
it('retains the original book for another account, history, unknown stage, absent target and unrelated marketing',()=>{
 const c=context(completed);for(const thread of [{...c.thread,stage:'video-unknown'},{...c.thread,focusScope:'history' as const},{...c.thread,responsibilityOverrideNeeded:true},{...c.thread,legacyFallbackRequired:true}])expect(videoWorkStage(c.p,thread)).toBe(false);expect(videoWorkStage({...c.p,accountId:'missing'},c.thread)).toBe(false);expect(videoPublicationPreparation(c.p,target)).toBe(false);expect(videoPublicationPreparation(input(reviewed),{channelId})).toBe(false)
 const marketing=act(one,'StartVideoMarketing',{channelId,resources:['player-production'],startAt:'2020-01-01'}),mt={channelId,marketingId:input(marketing).features.video!.marketing[0]!.id},m=context(marketing,mt);expect(videoWorkStage(m.p,m.thread)).toBe(false);expect(surface(marketing,mt).props.direct).toBe(false);expect(c.p.request).not.toHaveBeenCalled()
})
it('cumulatively keeps the first account comparison and all four explicit sample preparation steps connected to this same lifecycle',()=>{
 const c=context(one,{channelId});if(c.focus.kind!=='video')throw Error('VIDEO_FOCUS_REQUIRED');expect(videoFirstAttemptReading(c.p,c.focus)?.title).toBe('先做作品，还是先认识观众？');expect(surface(one,{channelId}).props).toMatchObject({direct:true,video:true,work:false});hooks.values=[]
 const ui=driver(one,{channelId});ui.open('sample');ui.select('product','热点样片');ui.click('继续核对制作方式 →');ui.select('mode','手工剪辑');ui.click('继续核对素材来源 →');ui.select('material','自行制作并保留来源');ui.click('继续核对资源与日历 →');expect(ui.render().find(n=>n.type==='select')?.props.value).toBe('');ui.set('select','player-production');ui.click('明确从今天 2020-01-01 开始');expect(ui.render().find(n=>n.type===CommandButton)?.props).toMatchObject({kind:'StartVideoWork',payload:{channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'},confirm:true});expect(words(ui.dialog())).toContain('¥600 · 1点 · 7日，预计2020-01-08完成。');expect(ui.p.request).not.toHaveBeenCalled()
})
