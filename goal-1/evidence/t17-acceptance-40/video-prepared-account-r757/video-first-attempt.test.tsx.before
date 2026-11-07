import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {videoFirstAttemptReading} from './video-first-attempt.ts'
import {VideoFirstAttemptAction} from './VideoFirstAttemptAction.tsx'
import {VideoFirstAttemptOptions} from './VideoFirstAttemptOptions.tsx'
import {videoDraftCommand} from './VideoSceneChoice.tsx'
import {VideoFirstAccountForm} from './VideoFirstAccountForm.tsx'
import {VideoEncounter} from './VideoEncounter.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {videoMarketingResultCoversLine} from './video-marketing-result-reading.ts'
import {videoSceneResult} from './video-scene-result.ts'
import {committedEcho} from './SceneEcho.tsx'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {openingFocusFor,playerThread} from './player-thread.ts'

// Normal in-memory gameplay and local React callbacks; no store, codec,
// controller submission, import/export, failure injection or reload checks.
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
 if(v.type===VideoFirstAttemptOptions)rows.push(...elements(VideoFirstAttemptOptions(v.props as unknown as Parameters<typeof VideoFirstAttemptOptions>[0])))
 if(v.type===VideoFirstAccountForm)rows.push(...elements(v.props.audience),...elements(v.props.nameField),...elements(v.props.terms))
 return rows
}
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'first-video-ui',actorId:'player',commandId:'create',seed:'first-video-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:Record<string,unknown>){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'first-video-'+run.revision,expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind);return result.nextRun}
const one=act(initial,'OpenVideoChannel',{name:'本地日常',segment:'local_merchants'}),two=act(one,'OpenVideoChannel',{name:'另一份生活',segment:'lifestyle'})
function input(run=initial):GamePanelProps{
 const projected=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 return {view,features:projected as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}
}
function context(run=one,index=0){const p=input(run),channel=p.features.video!.channels[index]!,focus=openingFocusFor(p,'video',{videoTarget:{channelId:channel.id},accountId:channel.accountId})!;if(focus.kind!=='video')throw Error('VIDEO_FOCUS_REQUIRED');return {p,focus,thread:playerThread(p,focus),channel}}
function primary(c:ReturnType<typeof context>,choose=vi.fn()){
 const reading=videoFirstAttemptReading(c.p,c.focus);if(!reading)throw Error('CLEAN_READING_REQUIRED')
 hooks.index=0;let result:Parameters<Parameters<typeof VideoFirstAttemptAction>[0]['children']>[0]|undefined
 VideoFirstAttemptAction({p:c.p,focus:c.focus,reading,onChoose:choose,children:value=>{result=value;return null}})
 if(!result)throw Error('FIRST_ATTEMPT_PRIMARY_REQUIRED');return result
}

it('compares two original jobs only for the same clean selected current account',()=>{
 const c=context(),v=videoFirstAttemptReading(c.p,c.focus)!
 expect(v).toMatchObject({channelId:c.channel.id,title:'先做作品，还是先认识观众？',sample:{costFen:60000,points:1,days:7},marketing:{costFen:60000,points:1,days:7}});expect(v.line).toContain(c.channel.name)
 expect(c.thread.stage).toBe('video-channel');expect(c.p.request).not.toHaveBeenCalled()
})

it('preserves the original complete route for existing work, promotion, uncertain identity, costs or obligations',()=>{
 const c=context(),p=c.p,v=p.features.video!
 const marketing=act(one,'StartVideoMarketing',{channelId:c.channel.id,resources:['player-production'],startAt:'2020-01-01'}),work=act(one,'StartVideoWork',{channelId:c.channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'})
 for(const run of [marketing,work]){const current=context(run);expect(videoFirstAttemptReading(current.p,current.focus)).toBeNull()}
 for(const changed of [
  {...p,view:{...p.view,readOnly:true}}, {...p,view:{...p.view,hasCandidate:true}}, {...p,view:{...p.view,busy:true}}, {...p,view:{...p.view,phase:'epilogue' as const}},
  {...p,features:{...p.features,workbench:{...p.features.workbench,quarter:'2021-Q1'}}},
  {...p,features:{...p.features,video:{...v,channels:[c.channel,c.channel]}}},
  {...p,features:{...p.features,video:{...v,channels:[{...c.channel,lifecycle:'paused' as const}]}}},
  {...p,features:{...p.features,video:{...v,channels:[{...c.channel,audience:1}]}}},
  {...p,features:{...p.features,video:{...v,channels:[{...c.channel,metrics:{...c.channel.metrics,costFen:1}}]}}},
  {...p,features:{...p.features,video:{...v,channels:[{...c.channel,leads:[{personId:'ui-public-inquiry',cohortId:'ui-public-cohort'}]}]}}},
  {...p,features:{...p.features,workbench:{...p.features.workbench,finance:p.features.workbench.finance.map(a=>({...a,protectionShortfallFen:1}))}}},
 ])expect(videoFirstAttemptReading(changed,c.focus)).toBeNull()
 for(const focus of [{...c.focus,runId:'another-life'},{...c.focus,accountId:'another-account'},{...c.focus,entityId:'missing'},{...c.focus,videoTarget:{channelId:c.channel.id,section:'publications' as const}}])expect(videoFirstAttemptReading(p,focus)).toBeNull()
})

it('opens the original sample, marketing and overview intents without issuing any game command',()=>{
 const c=context(),choose=vi.fn(),v=primary(c,choose)
 v.binding.activate();expect(choose).toHaveBeenLastCalledWith('sample')
 v.firstAttempt.marketing.activate();expect(choose).toHaveBeenLastCalledWith('marketing')
 v.firstAttempt.overview.activate();expect(choose).toHaveBeenLastCalledWith(undefined)
 expect(choose).toHaveBeenCalledTimes(3);expect(c.p.request).not.toHaveBeenCalled()
 const rows=elements(VideoFirstAttemptOptions({value:v.firstAttempt}));expect(words(rows)).toContain('完成后才看实际询价');expect(words(rows)).toContain('¥600')
})

it('retires old selection handlers across A to B to A, owner callbacks and committed sources',()=>{
 const a=context(two,0),b={...context(two,1),p:a.p},choose=vi.fn(),old=primary(a,choose)
 primary(b,choose);old.binding.activate();expect(choose).not.toHaveBeenCalled()
 const current=primary(a,choose);old.firstAttempt.marketing.activate();expect(choose).not.toHaveBeenCalled();current.binding.activate();expect(choose).toHaveBeenCalledExactlyOnceWith('sample')
 primary(a,vi.fn());current.firstAttempt.overview.activate();expect(choose).toHaveBeenCalledTimes(1)
 Object.assign(a.p.controller.snapshot,{view:{...a.p.view,revision:a.p.view.revision+1}});primary(a,choose).binding.activate();expect(choose).toHaveBeenCalledTimes(1)
})

it('keeps the physical object on the same original sample binding and removes only the proven empty-channel duplicate',()=>{
 const c=context(),choose=vi.fn(),element=VideoEncounter({p:c.p,thread:c.thread,date:null,waitLabel:'',onChoose:choose,onResult:vi.fn(),onToday:vi.fn()})
 if(!isValidElement<ComponentProps<typeof VideoThreadAction>>(element))throw Error('ORIGINAL_ACTION_REQUIRED')
 const action=VideoThreadAction(element.props)
 if(!isValidElement<ComponentProps<typeof VideoFirstAttemptAction>>(action)||action.type!==VideoFirstAttemptAction)throw Error('FIRST_ACCOUNT_ACTION_REQUIRED')
 hooks.index=0;const rows=elements(VideoFirstAttemptAction(action.props)),main=rows.find(n=>n.type==='button')!,paper=rows.find(n=>n.type===OpeningObject)!
 expect(paper.props.onActivate).toBe(main.props.onClick);expect(paper.props.copyMode).toBe('tableau');expect(rows.some(n=>n.type==='p'&&words(n)===c.thread.detail)).toBe(false)
 ;(main.props.onClick as ()=>void)();(paper.props.onActivate as ()=>void)();expect(choose).toHaveBeenNthCalledWith(1,'sample');expect(choose).toHaveBeenNthCalledWith(2,'sample');expect(c.p.request).not.toHaveBeenCalled()
})

it('zero remaining actions can inspect choices while the original production preview still refuses the commitment',()=>{
 let run=act(one,'WorkQuarter',{});run=act(run,'StartLifeWork',{kind:'rest',personId:null,reference:null});run=act(run,'ResearchMarket',{definitionId:'market-overview'})
 const c=context(run);expect(c.p.view.budget.available).toBe(0);expect(videoFirstAttemptReading(c.p,c.focus)).not.toBeNull()
 const command={runId:run.runId,actorId:run.actorId,commandId:'sample-preview',expectedRevision:run.revision,kind:'StartVideoWork',payload:{channelId:c.channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'}}
 expect(previewCommand(run,command,registry,run.actorId)).toMatchObject({allowed:false});expect(previewCommand(run,command,registry,run.actorId).reasonCodes).toContain('INSUFFICIENT_CAPACITY');expect(c.p.request).not.toHaveBeenCalled()
})

it('leaves the original sample command construction explicit and independent of displayed reference prices',()=>{
 const c=context(),draft={channelId:c.channel.id,clientId:'',cohortId:'',modeId:'',materialId:'',resource:'',startAt:'',productId:'',name:'',segment:'',monetization:'',label:false}
 expect(videoDraftCommand(c.p,draft,'sample',{channelId:c.channel.id})).toBeNull()
 expect(videoDraftCommand(c.p,{...draft,productId:'hotspot',modeId:'manual',materialId:'original',resource:'player-production',startAt:'2020-01-01'},'sample',{channelId:c.channel.id})).toMatchObject({kind:'StartVideoWork',confirm:true,payload:{channelId:c.channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'}})
})

it('keeps an unknown thread stage on the original complete choice despite otherwise clean account data',()=>{
 const c=context(),unknown={...c.thread,stage:'video-future-unknown'},choose=vi.fn()
 const result=VideoThreadAction({p:c.p,thread:unknown,active:true,date:null,waitLabel:'',onChoose:choose,onResult:vi.fn(),onToday:vi.fn(),children:value=>value?.main??null})
 expect(isValidElement(result)&&result.type===VideoFirstAttemptAction).toBe(false)
 const button=elements(result).find(n=>n.type==='button')!;(button.props.onClick as ()=>void)();expect(choose).toHaveBeenCalledExactlyOnceWith();expect(c.p.request).not.toHaveBeenCalled()
})

it('places the clean first comparison directly on the game stage while existing work retains the original book',()=>{
 for(const run of [one,act(one,'StartVideoMarketing',{channelId:input(one).features.video!.channels[0]!.id,resources:['player-production'],startAt:'2020-01-01'})]){
  hooks.values=[];hooks.index=0;const c=context(run),tree=NarrativeScene({...c.p,screen:'video',headingRef:null,personId:'tang-ying',onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null,videoTarget:{channelId:c.channel.id}}),surface=elements(tree).find(n=>typeof n.type==='function'&&n.type.name==='SceneChoiceSurface')!
  expect(surface).toBeDefined();expect(surface.props.direct).toBe(run===one);expect(surface.props.video).toBe(run===one);expect(c.p.request).not.toHaveBeenCalled()
 }
})

function completedMarketing(){let before=act(one,'StartVideoMarketing',{channelId:input(one).features.video!.channels[0]!.id,resources:['player-production'],startAt:'2020-01-01'}),run=act(before,'AdvanceTime',{date:'2020-01-08'});if(input(run).features.video!.marketing[0]!.completedAt===null){before=run;run=act(run,'AdvanceTime',{date:'2020-01-08'})}const p=input(run),m=p.features.video!.marketing[0]!,focus=openingFocusFor(p,'video',{videoTarget:{channelId:m.channelId,marketingId:m.id}})!,thread=playerThread(p,focus),text=videoSceneResult('AdvanceTime',input(before).view,p.view);if(!text)throw Error('ORIGINAL_MARKETING_RESULT_REQUIRED');return {p,thread,notice:{date:p.view.date,text:text+'\n原账号的需求研究，有了实际反馈。',brief:text.slice(0,text.indexOf('。')+1),frame:committedEcho(input(before).view,p.view)}}}

it('covers only the exact current marketing line already visible in its original result, preserving all raw text and frame',()=>{
 const c=completedMarketing(),text=c.notice.text,frame=c.notice.frame
 expect(videoMarketingResultCoversLine(c.p,c.thread,c.notice,c.thread.line)).toBe(true);expect(c.notice.text).toBe(text);expect(c.notice.frame).toBe(frame)
 expect(videoMarketingResultCoversLine(c.p,c.thread,c.notice,c.thread.line+'另有未核费用')).toBe(false)
})

it('retains the full original fact for wrong dates, target, published text, frame or extra money/action changes',()=>{
 const c=completedMarketing(),n=c.notice,f=n.frame!
 for(const notice of [{...n,date:'2020-01-07'},{...n,text:'另一个结果。'+n.text},{...n,brief:n.brief+'其它费用'},{...n,frame:null},{...n,frame:{...f,pointsBefore:f.pointsBefore+1}},{...n,frame:{...f,accounts:f.accounts.map(a=>({...a,before:a.after+1}))}},{...n,frame:{...f,quarterChanged:true}}])expect(videoMarketingResultCoversLine(c.p,c.thread,notice,c.thread.line)).toBe(false)
 expect(videoMarketingResultCoversLine(c.p,{...c.thread,stage:'video-unknown'},n,c.thread.line)).toBe(false)
 expect(videoMarketingResultCoversLine(c.p,{...c.thread,focus:{...c.thread.focus,runId:'other-life'}},n,c.thread.line)).toBe(false)
})
