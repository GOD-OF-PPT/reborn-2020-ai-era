import {dayPerspectiveCurrent,type DayPerspective} from './day-perspective.ts'
import {savedSceneResult} from './scene-result.ts'
import {waitSceneResult,waitResultAfterRetry,checkpointResultAfterRetry} from './wait-scene-result.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {journeyIntent} from './journey-intent.ts'
import {rememberViewedLife} from './continuation.ts'
import {openingFocusFor,playerThread,type OpeningFocus} from './player-thread.ts'
import {seasonFocusAfterSave} from './season-thread.ts'
import {nextLifeFocusAfterResult} from './next-life-focus.ts'
import {videoFocusFromSaved} from './video-player-thread.ts'
import {createVideoSceneDraftMemory} from './video-scene-draft.ts'
import {createCourseSceneDraftMemory} from './course-scene-draft.ts'
import {createCourseTeachingDraftMemory} from './course-teaching-draft.ts'
import {courseFocusFromSaved} from './course-player-thread.ts'
import {relayFocusFromSaved} from './relay-player-thread.ts'
import {createRelaySceneDraftMemory} from './relay-scene-draft.ts'
import {createRelayPreparationDraftMemory} from './relay-preparation-draft.ts'
import {createRelayResponseDraftMemory} from './relay-response-draft.ts'
import {createRelayRecordMemory} from './relay-record-memory.ts'
import {relayTargetReason} from './relay-scene-target.ts'
import {createEcosystemDraftMemory} from './ecosystem-draft.ts'
import {EcosystemMoment} from './EcosystemMoment.tsx'
import {EquityMoment} from './EquityMoment.tsx'
import {createEquityDraftMemory} from './equity-draft.ts'
import {equityFocusFor,equityFocusFromSaved,resolveEquityFocus} from './equity-player-thread.ts'
import {EquityDecisionFacts,EQUITY_PLANNING_COMMANDS,EQUITY_INVITATION_DECISIONS} from './EquityDecisionFacts.tsx'
import {EquitySharedCommandDetails} from './EquitySharedCommandDetails.tsx'
import {equitySharedCommandBusinessId} from './equity-business-continuity.ts'
import {equityInvitationBrief} from './equity-invitation-result.ts'
import {OperatingJobRecord,type OperatingJobDraft} from './OperatingJobRecord.tsx'
import {isOperatingJobTarget,operatingJobKey,resolveOperatingJob} from './operating-job-target.ts'
import {makeSharedAction} from './shared-action.ts'
import {captureLifeDecision,LifeDecisionFacts} from './LifeDecisionFacts.tsx'
import {ecosystemFocusFor,ecosystemFocusFromSaved,resolveEcosystemFocus} from './ecosystem-player-thread.ts'
import {loadSeasonFocusPreference,saveSeasonFocusPreference,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'
import type {ReactNode,SetStateAction} from 'react'
import {CommandDetails} from './CommandDetails.tsx'
import {confirmationMoney} from './confirmation-money.ts'
import type {CommandPreview} from '../core/commands.ts'
import { useEffect,useMemo,useRef,useState,useSyncExternalStore,lazy,Suspense } from 'react'
import type { GameControllerPort as GameController } from '../application/game-controller-port.ts'
import { INITIAL_GAME_SNAPSHOT } from '../application/game-snapshot.ts'
import {useUiIntent} from './use-ui-intent.ts'
import {RuntimeReadStatus} from './RuntimeReadStatus.tsx'
import type { ConfirmIntent,PlayFeatures,PlayingView,RequestCommand,SceneTarget,OperatingReaderContext } from './game-types.ts'
import { intentAccount } from './intent-account.ts'
import type {LifePerson} from '../core/life-schema.ts'
import {SafetyNotice} from './SafetyNotice.tsx'
import { Home } from './Home.tsx'
import { Dialog } from './Dialog.tsx'
import {ClockConfirmationFacts} from './ClockConfirmationFacts.tsx'
import {WaitStopControl} from './WaitStopControl.tsx'
import { StoragePanel } from './StoragePanel.tsx'
import {QuarterPanel} from './QuarterPanel.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {ChapterBackdrop} from './ChapterBackdrop.tsx'
import {NarrativeScene,SceneAttention} from './NarrativeScene.tsx'
import {SceneThreads} from './SceneThreads.tsx'
import {SceneEcho,SceneTimeNotice,committedEcho,type EchoFrame} from './SceneEcho.tsx'
import { backgroundNames,wishes,moneyText,reasonText,activityText } from './game-text.ts'
import {MainNavigation,SectionNavigation,screens,screenForRoute,type Screen} from './Navigation.tsx'
const EndingStage=lazy(()=>import('./EndingStage.tsx').then(m=>({default:m.EndingStage})))
const JourneyPanel=lazy(()=>import('./JourneyPanel.tsx').then(m=>({default:m.JourneyPanel})))
const RoutesPanel=lazy(()=>import('./Workbench.tsx').then(m=>({default:m.RoutesPanel})))
const MemoryPanel=lazy(()=>import('./Workbench.tsx').then(m=>({default:m.MemoryPanel})))
const FinancePanel=lazy(()=>import('./Workbench.tsx').then(m=>({default:m.FinancePanel})))
const MarketPanel=lazy(()=>import('./MarketPanel.tsx').then(m=>({default:m.MarketPanel})))
const VideoPanel=lazy(()=>import('./VideoPanel.tsx').then(m=>({default:m.VideoPanel})))
const CoursePanel=lazy(()=>import('./CoursePanel.tsx').then(m=>({default:m.CoursePanel})))
const DeepseekPanel=lazy(()=>import('./DeepseekPanel.tsx'))
const RelayPanel=lazy(()=>import('./RelayPanel.tsx'))
const StoryPanel=lazy(()=>import('./StoryPanel.tsx'))
const LifePanel=lazy(()=>import('./LifePanel.tsx'))
const RoutinesPanel=lazy(()=>import('./RoutinesPanel.tsx'))
const noSubscribe=()=>()=>{}
type Tab=Screen
export type PreparationWorkspaceContext={readonly runId:string;readonly screen:Screen;readonly accountId:string;readonly open:boolean;readonly epoch:number;readonly relayTargetKey?:string;readonly videoTargetKey?:string;readonly courseTargetKey?:string;readonly ecosystemTargetKey?:string;readonly lifeTargetKey?:string}
type Modal={kind:'command';intent:ConfirmIntent;details:ReactNode;clockFacts:ReactNode;decisionFacts:ReactNode;equityShared:boolean;workspace:PreparationWorkspaceContext;captured?:{view:PlayingView;preview:CommandPreview;session:string}}|{kind:'storage';text:string;source:string}|{kind:'settings'}|{kind:'exit'}|{kind:'reload'}
type LocalSeasonFocus={runId:string;quarter:string;focus:OpeningFocus|null;notice:string|null;requiresChoice:boolean}
// Access can fail even before getItem. The preference boundary catches both reads and writes.
const seasonFocusStorage:SeasonFocusPreferenceStorage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)}
const focusIdentity=(focus:OpeningFocus|null)=>focus===null?null:JSON.stringify([focus.runId,focus.kind,focus.accountId,focus.entityId,focus.businessId??null,focus.kind==='market'?focus.entityKind??null:null,focus.kind==='life'?focus.selection:null,focus.kind==='video'?focus.videoTarget:null,focus.kind==='course'?focus.courseTarget:null,focus.kind==='relay'?focus.relayTarget:null,focus.kind==='ecosystem'?focus.ecosystemTarget:null,focus.kind==='equity'?focus.equityTarget:null])
function relayWorkspaceTargetKey(target:SceneTarget['relayTarget'],slot:SceneTarget['relayDraftSlot'],recordId:string|null):string{
 const object=target===undefined?'legacy':target===null?'entry':[target.runId,target.accountId,target.businessId,target.stationId,target.kind,target.kind==='period'?target.periodId:target.kind==='customer'?target.customerId:target.kind==='audience'?target.audienceId:target.kind==='application'?target.applicationId:null,target.kind==='period'?target.jobId??null:null,target.kind==='period'?target.meterId??null:null]
 return JSON.stringify([object,slot??null,recordId])
}
function sameRelayWorkspace(origin:PreparationWorkspaceContext,active:PreparationWorkspaceContext):boolean{
 return origin.runId===active.runId&&origin.screen===active.screen&&origin.accountId===active.accountId&&origin.open===active.open&&origin.epoch===active.epoch&&origin.relayTargetKey===active.relayTargetKey
}
function videoWorkspaceTargetKey(target:SceneTarget['videoTarget']):string{
 if(target===undefined)return 'legacy'
 return JSON.stringify([target.channelId,target.workId??null,target.contractId??null,target.marketingId??null,target.section??null])
}
function sameVideoWorkspace(origin:PreparationWorkspaceContext,active:PreparationWorkspaceContext):boolean{
 return origin.runId===active.runId&&origin.screen===active.screen&&origin.accountId===active.accountId&&origin.open===active.open&&origin.epoch===active.epoch&&origin.videoTargetKey===active.videoTargetKey
}
function courseWorkspaceTargetKey(target:SceneTarget['courseTarget'],draftSlot:SceneTarget['courseDraftSlot'],teachingSlot:SceneTarget['courseTeachingSlot'],recordId:string|null):string{
 const object=target===undefined?'legacy':target===null?'entry':target.kind==='studio'?[target.kind,target.businessId]:target.kind==='outline'?[target.kind,target.businessId,target.outlineId]:target.kind==='license'?[target.kind,target.businessId,target.licenseId]:target.kind==='course'?[target.kind,target.businessId,target.courseId,target.sampleJobId??null]:target.kind==='audience'?[target.kind,target.businessId,target.courseId,target.audienceId]:[target.kind,target.businessId,target.courseId,target.cohortId,target.jobId??null]
 return JSON.stringify([object,draftSlot??null,teachingSlot??null,recordId])
}
function sameCourseWorkspace(origin:PreparationWorkspaceContext,active:PreparationWorkspaceContext):boolean{
 return origin.runId===active.runId&&origin.screen===active.screen&&origin.accountId===active.accountId&&origin.open===active.open&&origin.epoch===active.epoch&&origin.courseTargetKey===active.courseTargetKey
}
function sameLifeWorkspace(origin:PreparationWorkspaceContext,active:PreparationWorkspaceContext):boolean{
 return origin.lifeTargetKey!==undefined&&origin.runId===active.runId&&origin.screen===active.screen&&origin.accountId===active.accountId&&origin.open===active.open&&origin.epoch===active.epoch&&origin.lifeTargetKey===active.lifeTargetKey
}
/** Retaining a draft never submits the next step or treats a planned licence as completed. */
export function keepPreparationWorkspace(status:string,kind:string,previous:PlayingView|null,current:PlayingView,origin:PreparationWorkspaceContext,active:PreparationWorkspaceContext){
 return status==='saved'&&kind==='LicenseCourseMaterials'&&origin.screen==='course'&&origin.open&&active.open
  &&origin.runId===current.runId&&active.runId===origin.runId&&active.screen===origin.screen
  &&sameCourseWorkspace(origin,active)
  &&current.accounts.some(account=>account.accountId===origin.accountId)&&!current.readOnly
  &&committedEcho(previous,current)!==null
}
function savedLabel(status:string){return ({saved:'已保存',saving:'正在保存…',unsaved:'未保存',conflict:'存档冲突',read_only:'只读',closed:'已关闭'} as Record<string,string>)[status]??status}
function readSettings(){try{const value=JSON.parse(localStorage.getItem('reborn-2020-display')??'{}') as Record<string,unknown>;return {textOnly:value.textOnly===true,reducedMotion:value.reducedMotion===true,hiddenGuides:Array.isArray(value.hiddenGuides)?value.hiddenGuides.filter((id):id is string=>typeof id==='string'):[]}}catch{return {textOnly:false,reducedMotion:false,hiddenGuides:[] as string[]}}}
export default function App({controller=null,startupError=null,diagnostics=null,focusPreferenceStorage=seasonFocusStorage}:{controller?:GameController|null;startupError?:string|null;diagnostics?:{name:string;trace:{writeSucceeded:boolean;abortIssued:boolean}}|null;focusPreferenceStorage?:SeasonFocusPreferenceStorage}){
 const state=useSyncExternalStore(controller?.subscribe??noSubscribe,()=>controller?.snapshot??INITIAL_GAME_SNAPSHOT,()=>INITIAL_GAME_SNAPSHOT),view=state.view
 const videoDraftMemory=useMemo(()=>createVideoSceneDraftMemory(view?.runId??''),[view?.runId])
 const courseDraftMemory=useMemo(()=>createCourseSceneDraftMemory(view?.runId??''),[view?.runId])
 const courseTeachingDraftMemory=useMemo(()=>createCourseTeachingDraftMemory(view?.runId??''),[view?.runId])
 const relayDraftMemory=useMemo(()=>createRelaySceneDraftMemory(view?.runId??''),[view?.runId])
 const relayPreparationDraftMemory=useMemo(()=>createRelayPreparationDraftMemory(view?.runId??''),[view?.runId])
 const relayResponseDraftMemory=useMemo(()=>createRelayResponseDraftMemory(view?.runId??''),[view?.runId])
 const relayRecordMemory=useMemo(()=>createRelayRecordMemory(view?.runId??''),[view?.runId])
 const ecosystemDraftMemory=useMemo(()=>createEcosystemDraftMemory(),[view?.runId])
 const equityDraftMemory=useMemo(()=>createEquityDraftMemory(),[view?.runId])
 const operatingJobDrafts=useRef(new Map<string,OperatingJobDraft>())
 const [operatingJobReader,setOperatingJobReader]=useState<{target:unknown;key:string}|null>(null)
 const currentOperatingJobReader=useRef<typeof operatingJobReader>(null)
 const operatingReaderEpoch=useRef(0)
 const closeOperatingJobReader=()=>{if(currentOperatingJobReader.current)operatingReaderEpoch.current++;currentOperatingJobReader.current=null;setOperatingJobReader(null)}
 const [entryKey,setEntryKey]=useState(0)
 const [requestedRoomToday,setRequestedRoomToday]=useState<DayPerspective|null>(null)
 const [storyIncidentId,setStoryIncidentId]=useState<string|null>(null)
 const [journeyOpen,setJourneyOpen]=useState(false),[lifeYear,setLifeYear]=useState<number|null>(null)
 const [lifePane,setLifePane]=useState<'today'|'people'|'year'>('today')
 const [lifePerson,setLifePerson]=useState<LifePerson>('tang-ying')
 const [lifeSceneMode,setLifeSceneMode]=useState<'person'|'rest'|'workspace'>('person')
 const [deepseekTarget,setDeepseekTarget]=useState<{pane:'ecosystem'|'equity';recordId?:string}>({pane:'ecosystem'})
 const [ecosystemTarget,setEcosystemTarget]=useState<SceneTarget['ecosystemTarget']>(null)
 const [equityTarget,setEquityTarget]=useState<SceneTarget['equityTarget']>(null)
 const [videoTarget,setVideoTarget]=useState<SceneTarget['videoTarget']>(undefined),[courseRecordId,setCourseRecordId]=useState<string|null>(null)
 const [courseTarget,setCourseTarget]=useState<SceneTarget['courseTarget']>(undefined)
 const [courseDraftSlot,setCourseDraftSlot]=useState<SceneTarget['courseDraftSlot']>(undefined)
 const [courseTeachingSlot,setCourseTeachingSlot]=useState<SceneTarget['courseTeachingSlot']>(undefined)
 const [relayTarget,setRelayTarget]=useState<SceneTarget['relayTarget']>(undefined)
 const [relayDraftSlot,setRelayDraftSlot]=useState<SceneTarget['relayDraftSlot']>(undefined)
 const [relayRecordId,setRelayRecordId]=useState<string|null>(null)
 const [focusChoice,setFocusChoice]=useState<LocalSeasonFocus|null>(null)
 const currentFocus=useRef<LocalSeasonFocus|null>(null)
 const [marketRecordId,setMarketRecordId]=useState<string|null>(null),[quarterRecordId,setQuarterRecordId]=useState<string|null>(null),[lifeRecordId,setLifeRecordId]=useState<string|null>(null)
 const [workspaceOpen,setWorkspaceOpen]=useState(false),[sceneReceipt,setSceneReceipt]=useState<{runId:string;screen:Screen;revision:number;kind:string;text:string;brief?:string;frame:EchoFrame|null;workspace:PreparationWorkspaceContext|null}|null>(null)
 const failedScene=useRef<{runId:string;screen:Screen;label:string;kind:string;payload:unknown;workspace:PreparationWorkspaceContext;wait?:PublicWaitResult;operatingReader?:OperatingReaderContext}|null>(null)
 const readerReturn=useRef<{runId:string;revision:number;accountId:string;focusKey:string;today:DayPerspective|null;receipt:typeof sceneReceipt}|null>(null)
 const navigate=(screen:Screen,open=false)=>{closeOperatingJobReader();if(!open)readerReturn.current=null;setRequestedRoomToday(null);if(screen==='life'){setLifePane('today');setLifeSceneMode('person')}setSceneReceipt(receipt=>{const current=controller?.snapshot.view,back=readerReturn.current;if(open&&back&&current&&back.runId===current.runId&&back.revision===current.revision)return receipt;return current&&screen==='room'&&receipt?.kind==='AdvanceTime'&&receipt.runId===current.runId&&receipt.revision===current.revision?{...receipt,screen:'room',workspace:null}:null});setVideoTarget(undefined);setCourseTarget(screen==='course'?null:undefined);setCourseRecordId(null);setCourseDraftSlot(undefined);setCourseTeachingSlot(undefined);setRelayTarget(screen==='relay'?null:undefined);setRelayDraftSlot(undefined);setRelayRecordId(null);setEcosystemTarget(null);setEquityTarget(null);if(screen==='deepseek'){setDeepseekTarget({pane:'ecosystem'});setAccountId('personal')}setMarketRecordId(null);setQuarterRecordId(null);setLifeRecordId(null);setWorkspaceOpen(open&&screen!=='room'&&screen!=='routes');setTab(screen)}
 const [pendingSubmission,setPendingSubmission]=useState<{commandId:string;preview:CommandPreview}|null>(null)
 const [tab,setTab]=useState<Tab>('room'),[selectedAccountId,setAccountId]=useState('personal'),[modal,writeModal]=useState<Modal|null>(null),[localError,setLocalError]=useState<string|null>(null),[settings,setSettings]=useState(readSettings),[settingsNotice,setSettingsNotice]=useState('')
 const modalEpoch=useRef(0),setModal=(change:SetStateAction<Modal|null>)=>{modalEpoch.current++;writeModal(change)}
 const activeTab=useRef<Screen>('room');activeTab.current=tab
 const viewedAccountExists=view?.accounts.some(account=>account.accountId===selectedAccountId)??false
 const accountId=viewedAccountExists||tab==='video'||tab==='course'||tab==='relay'||tab==='deepseek'?selectedAccountId:'personal'
 const activeWorkspace=useRef<PreparationWorkspaceContext>({runId:'',screen:'room',accountId:'personal',open:false,epoch:0})
 const lastWorkspace=activeWorkspace.current
 const relayTargetKey=tab==='relay'?relayWorkspaceTargetKey(relayTarget,relayDraftSlot,relayRecordId):undefined
 const videoTargetKey=tab==='video'?videoWorkspaceTargetKey(videoTarget):undefined
 const ecosystemTargetKey=tab==='deepseek'?JSON.stringify([deepseekTarget.pane,ecosystemTarget??null,equityTarget===undefined?'legacy':equityTarget,deepseekTarget.recordId??null]):undefined
 const courseTargetKey=tab==='course'?courseWorkspaceTargetKey(courseTarget,courseDraftSlot,courseTeachingSlot,courseRecordId):undefined
 const lifeTargetKey=tab==='life'?JSON.stringify([lifePane,lifeSceneMode,lifePerson,lifeRecordId,lifeYear]):undefined
 if(lastWorkspace.runId!==(view?.runId??'')||lastWorkspace.screen!==tab||lastWorkspace.accountId!==accountId||lastWorkspace.open!==workspaceOpen||lastWorkspace.relayTargetKey!==relayTargetKey||lastWorkspace.videoTargetKey!==videoTargetKey||lastWorkspace.courseTargetKey!==courseTargetKey||lastWorkspace.ecosystemTargetKey!==ecosystemTargetKey||lastWorkspace.lifeTargetKey!==lifeTargetKey)activeWorkspace.current={runId:view?.runId??'',screen:tab,accountId,open:workspaceOpen,epoch:lastWorkspace.epoch+1,...(relayTargetKey===undefined?{}:{relayTargetKey}),...(videoTargetKey===undefined?{}:{videoTargetKey}),...(courseTargetKey===undefined?{}:{courseTargetKey}),...(ecosystemTargetKey===undefined?{}:{ecosystemTargetKey}),...(lifeTargetKey===undefined?{}:{lifeTargetKey})}
 const uiIntent=useUiIntent(controller,()=>activeWorkspace.current,()=>modalEpoch.current)
 const restoreOperatingReader=(source:OperatingReaderContext|undefined)=>{
  const current=controller?.snapshot.view
  if(!source?.recovering||!current||currentOperatingJobReader.current!==null||operatingReaderEpoch.current!==source.epoch+1||current.runId!==source.target.runId||current.revision!==source.sourceRevision+1||current.hasCandidate||current.readOnly||current.saveStatus!=='saved'||!['playing','epilogue'].includes(current.phase))return
  const last=current.receipts.at(-1),features=current.features as unknown as PlayFeatures
  if(!last||last.commandId!==source.commandId||last.revisionAfter!==current.revision||features.workbench.pause!==null||resolveOperatingJob({view:current,features},source.target).status!=='valid')return
  const reader={target:source.target,key:operatingJobKey(source.target)}
  operatingReaderEpoch.current++;currentOperatingJobReader.current=reader;setOperatingJobReader(reader)
 }
 const onSubmission=(status:string,runId:string,screen:Screen,label:string,kind:string,workspace:PreparationWorkspaceContext,payload:unknown,operatingReader?:OperatingReaderContext)=>{
  const current=controller?.snapshot.view
  if(!current||current.runId!==runId)return
  // A successful original command may finish after the player has moved to another sheet.
  const relayWorkspaceCurrent=screen!=='relay'||sameRelayWorkspace(workspace,activeWorkspace.current)
  const videoWorkspaceCurrent=screen!=='video'||sameVideoWorkspace(workspace,activeWorkspace.current)
  const courseWorkspaceCurrent=screen!=='course'||sameCourseWorkspace(workspace,activeWorkspace.current)
  const lifeWorkspaceCurrent=screen!=='life'||sameLifeWorkspace(workspace,activeWorkspace.current)
  const ecosystemWorkspaceCurrent=screen!=='deepseek'||workspace.runId===activeWorkspace.current.runId&&workspace.accountId===activeWorkspace.current.accountId&&workspace.open===activeWorkspace.current.open&&workspace.epoch===activeWorkspace.current.epoch&&workspace.ecosystemTargetKey===activeWorkspace.current.ecosystemTargetKey
  let savedCourseWorkspaceKey:string|undefined
  if(status==='saved'&&view&&view.runId===runId){
   if(screen==='video'&&activeTab.current===screen&&videoWorkspaceCurrent){
    const body=typeof payload==='object'&&payload!==null?payload as Record<string,unknown>:{}
    const savedVideo=videoFocusFromSaved({view,features:view.features as unknown as PlayFeatures},{view:current,features:current.features as unknown as PlayFeatures},kind,body)
    if(savedVideo?.videoTarget){setVideoTarget(savedVideo.videoTarget);setAccountId(savedVideo.accountId)}
   }
   if(screen==='course'&&activeTab.current===screen&&courseWorkspaceCurrent){
    const body=typeof payload==='object'&&payload!==null?payload as Record<string,unknown>:{}
    const priorCourse=courseTarget!==undefined?openingFocusFor({view,features:view.features as unknown as PlayFeatures},'course',{courseTarget,accountId}):null
    const savedCourse=courseFocusFromSaved({view,features:view.features as unknown as PlayFeatures},{view:current,features:current.features as unknown as PlayFeatures},kind,body,priorCourse?.kind==='course'?priorCourse:null)
    const retainLegacyPreparation=courseTarget===undefined&&keepPreparationWorkspace(status,kind,view,current,workspace,activeWorkspace.current)
    if(savedCourse?.kind==='course'&&!retainLegacyPreparation){
     const targetChanged=courseWorkspaceTargetKey(courseTarget,undefined,undefined,null)!==courseWorkspaceTargetKey(savedCourse.courseTarget,undefined,undefined,null)
     const nextRecordId=targetChanged?null:courseRecordId,nextDraftSlot=kind==='LicenseCourseMaterials'?courseDraftSlot:undefined
     setCourseTarget(savedCourse.courseTarget);setAccountId(savedCourse.accountId);if(targetChanged)setCourseRecordId(null);if(kind!=='LicenseCourseMaterials')setCourseDraftSlot(undefined);setCourseTeachingSlot(undefined)
     savedCourseWorkspaceKey=courseWorkspaceTargetKey(savedCourse.courseTarget,nextDraftSlot,undefined,nextRecordId)
    }
   }
   if(screen==='relay'&&activeTab.current===screen&&relayWorkspaceCurrent){
    const body=typeof payload==='object'&&payload!==null?payload as Record<string,unknown>:{}
    const priorRelay=relayTarget!==undefined?openingFocusFor({view,features:view.features as unknown as PlayFeatures},'relay',{relayTarget,accountId}):null
    const savedRelay=relayFocusFromSaved({view,features:view.features as unknown as PlayFeatures},{view:current,features:current.features as unknown as PlayFeatures},kind,body,priorRelay?.kind==='relay'?priorRelay:null)
    if(savedRelay?.kind==='relay'){setRelayTarget(savedRelay.relayTarget);setAccountId(savedRelay.accountId);setRelayDraftSlot(undefined);setRelayRecordId(null)}
   }
   if(screen==='deepseek'&&activeTab.current===screen&&ecosystemWorkspaceCurrent&&deepseekTarget.pane==='ecosystem'){
    const body=typeof payload==='object'&&payload!==null&&!Array.isArray(payload)?payload as Record<string,unknown>:{}
    const prior=ecosystemFocusFor({view,features:view.features as unknown as PlayFeatures},ecosystemTarget??null,ecosystemTarget?.accountId??'personal')
    const saved=ecosystemFocusFromSaved({view,features:view.features as unknown as PlayFeatures},{view:current,features:current.features as unknown as PlayFeatures},kind,body,prior)
    if(saved){setEcosystemTarget(saved.ecosystemTarget);setAccountId(saved.accountId);setDeepseekTarget({pane:'ecosystem'})}
   }
   if(screen==='deepseek'&&activeTab.current===screen&&ecosystemWorkspaceCurrent&&deepseekTarget.pane==='equity'){
    const body=typeof payload==='object'&&payload!==null&&!Array.isArray(payload)?payload as Record<string,unknown>:{}
    const prior=equityFocusFor({view,features:view.features as unknown as PlayFeatures},equityTarget??null,equityTarget?.accountId??accountId)
    const saved=equityFocusFromSaved({view,features:view.features as unknown as PlayFeatures},{view:current,features:current.features as unknown as PlayFeatures},kind,body,resolveEquityFocus({view,features:view.features as unknown as PlayFeatures},prior).reason?null:prior)
    if(saved){setEquityTarget(saved.equityTarget);setAccountId(saved.accountId);setDeepseekTarget({pane:'equity'});if(current.phase==='epilogue')rememberFocus(saved,current)}
   }
   if(!focusRequiresChoice&&(screen!=='life'||activeTab.current===screen&&lifeWorkspaceCurrent)){
    const remembered=currentFocus.current?.runId===runId?currentFocus.current:null
    const before={view,features:view.features as unknown as PlayFeatures},after={view:current,features:current.features as unknown as PlayFeatures}
    const continuation=screen==='life'?nextLifeFocusAfterResult(before,after,kind,payload,remembered?.focus??null,remembered?.quarter):null
    const next=continuation??seasonFocusAfterSave(before,after,kind,payload,remembered?.focus??null,remembered!==null)
    const previousTarget=remembered?.focus?playerThread({view,features:view.features as unknown as PlayFeatures},remembered.focus,remembered.quarter):null
    if(next!==null&&next!==remembered?.focus&&focusIdentity(next)!==focusIdentity(previousTarget?.focus??remembered?.focus??null))rememberFocus(next,current)
   }
   failedScene.current=null
  }
  if(status==='unsaved'||status==='conflict')failedScene.current={runId,screen,label,kind,payload,workspace,...(operatingReader?{operatingReader:{...operatingReader,recovering:true}}:{})}
  if(activeTab.current!==screen||!relayWorkspaceCurrent||!videoWorkspaceCurrent||!courseWorkspaceCurrent||!ecosystemWorkspaceCurrent||!lifeWorkspaceCurrent)return
  if(status==='saved'||status==='duplicate')restoreOperatingReader(operatingReader)
  if(status==='saved'){
   const active=activeWorkspace.current,frame=committedEcho(view,current)
   if(!frame)return
   failedScene.current=null
   const keep=keepPreparationWorkspace(status,kind,view,current,workspace,active)
   // A real saved auxiliary task may follow its own newly created licence.
   // Bind its retained feedback to that committed transition, without changing
   // the live reading ref or granting a later viewing context this exception.
   const keptWorkspace=keep?savedCourseWorkspaceKey===undefined?workspace:{...workspace,courseTargetKey:savedCourseWorkspaceKey,epoch:active.epoch+(active.courseTargetKey===savedCourseWorkspaceKey?0:1)}:null
   setWorkspaceOpen(open=>keep&&open)
   setSceneReceipt({runId,screen,revision:current.revision,kind,text:savedSceneResult(kind,label,view,current),...(equityInvitationBrief(kind,view,current)?{brief:equityInvitationBrief(kind,view,current)!}:{}),frame,workspace:keptWorkspace})
  }else if(status==='unsaved'||status==='conflict'){setWorkspaceOpen(false);setSceneReceipt(null)}
 }
 const heading=useRef<HTMLHeadingElement>(null),unsavedHeading=useRef<HTMLElement>(null)
 useEffect(()=>{if(!modal&&(view?.saveStatus==='unsaved'||view?.saveStatus==='conflict'))unsavedHeading.current?.focus()},[view?.saveStatus,modal?.kind])
 useEffect(()=>{if(view?.readOnly||view?.saveStatus==='conflict'||view?.saveStatus==='unsaved')setWorkspaceOpen(false)},[view?.readOnly,view?.saveStatus])
 useEffect(()=>{currentOperatingJobReader.current=null;setOperatingJobReader(null);operatingJobDrafts.current.clear();readerReturn.current=null;failedScene.current=null;setJourneyOpen(false);setLifeYear(null);setWorkspaceOpen(false);setSceneReceipt(null);setTab('room');setAccountId('personal');setLifePane('today');setLifePerson('tang-ying');setLifeSceneMode('person');setDeepseekTarget({pane:'ecosystem'});setEcosystemTarget(null);setEquityTarget(null);setVideoTarget(undefined);setRelayTarget(undefined);setRelayDraftSlot(undefined);setCourseTarget(undefined);setCourseRecordId(null);setCourseDraftSlot(undefined);setCourseTeachingSlot(undefined);setMarketRecordId(null);setQuarterRecordId(null);setLifeRecordId(null);setFocusChoice(null);setStoryIncidentId(null);if(view?.runId)rememberViewedLife(view.runId)},[view?.runId])
 useEffect(()=>{if(view?.runId){heading.current?.focus({preventScroll:true});window.scrollTo(0,0)}},[tab,view?.runId])
 useEffect(()=>{if(!view)return;queueMicrotask(()=>{if(document.querySelector('dialog[open]'))return;const active=document.activeElement;if(active===document.body||active===document.getElementById('main-content'))heading.current?.focus({preventScroll:true})})},[view?.runId,view?.revision,modal?.kind,sceneReceipt,workspaceOpen,journeyOpen,tab])
 const fail=(error:unknown)=>setLocalError(reasonText(error instanceof Error?error.message:'LOCAL_STORAGE_FAILED'))
 const openStorage=(text='',source='import')=>{setLocalError(null);setModal({kind:'storage',text,source})}
 const exportCurrent=async(candidate=false)=>{
  if(!controller)return
  if(!controller.asynchronous){try{openStorage(candidate?controller.exportCandidate():controller.exportSaved(),candidate?'candidate':'saved')}catch(error){fail(error)}return}
  const frame=uiIntent.begin('正在翻开这份记录…','record')
  try{if(!await frame.ready||!frame.owns())return;const text=await(candidate?controller.exportCandidateAsync!():controller.exportSavedAsync!());if(frame.owns()){frame.finish();openStorage(text,candidate?'candidate':'saved')}}catch(error){if(frame.owns())fail(error)}finally{frame.finish()}
 }
 const exportOriginal=async(runId:string,backup=false)=>{
  if(!controller)return
  if(!controller.asynchronous){void controller.exportStored(runId,backup).then(text=>openStorage(text,backup?'backup':'raw')).catch(fail);return}
  const frame=uiIntent.begin('正在翻开这份记录…','record')
  try{if(!await frame.ready||!frame.owns())return;const text=await controller.exportStored(runId,backup);if(frame.owns()){frame.finish();openStorage(text,backup?'backup':'raw')}}catch(error){if(frame.owns())fail(error)}finally{frame.finish()}
 }
 const onWaitSubmission=(result:PublicWaitResult,workspace:PreparationWorkspaceContext,label:string,operatingReader?:OperatingReaderContext)=>{
  const current=controller?.snapshot.view
  if(!current||current.runId!==result.before.runId)return
  if((result.status==='unsaved'||result.status==='conflict')&&result.failed)failedScene.current={runId:current.runId,screen:workspace.screen,label,kind:'AdvanceTime',payload:result.failed.command.payload,workspace,wait:result,...(operatingReader?{operatingReader:{...operatingReader,recovering:true,commandId:result.failed.command.commandId,sourceRevision:result.failed.command.expectedRevision}}:{})}
  else if(!current.hasCandidate)failedScene.current=null
  const active=activeWorkspace.current
  if(activeTab.current!==workspace.screen||(['runId','screen','accountId','open','epoch','relayTargetKey','videoTargetKey','courseTargetKey','ecosystemTargetKey','lifeTargetKey'] as const).some(key=>active[key]!==workspace[key]))return
  restoreOperatingReader(operatingReader)
  const saved=waitSceneResult(result,current)
  if(saved){setWorkspaceOpen(false);setSceneReceipt({runId:current.runId,screen:workspace.screen,revision:current.revision,kind:'AdvanceTime',text:saved.text,brief:saved.brief,frame:saved.frame,workspace:null})}
  const issue=result.reasonCodes.find(code=>!['WAIT_STOP_REQUESTED','WAIT_ALREADY_HANDLED','WAIT_NO_PUBLIC_PROGRESS','WAIT_STEP_LIMIT'].includes(code));if(issue&&(result.status==='rejected'||result.status==='stopped'))setLocalError(reasonText(issue))
 }
 const dispatch=(intent:ConfirmIntent,workspace:PreparationWorkspaceContext)=>{
  if(!controller)return Promise.resolve()
  const session=controller.runtimeSession
  if(intent.wait){const before=controller.snapshot.view;return controller.waitForFeedback(intent.command).then(result=>{if(session===controller.runtimeSession){const scoped=before?.runId===intent.command.runId&&before.revision===intent.command.expectedRevision&&result.before.runId===before.runId&&result.before.revision===before.revision?{...result,before}:result;onWaitSubmission(scoped,workspace,intent.label,intent.operatingReader)}return result.status}).catch(error=>{if(session===controller.runtimeSession)throw error})}
  return controller.submit(intent.command).then(result=>{if(session===controller.runtimeSession)onSubmission(result.status,intent.command.runId,workspace.screen,intent.label,intent.command.kind,workspace,intent.command.payload,intent.operatingReader);return result.status}).catch(error=>{if(session===controller.runtimeSession)throw error})
 }
 const requestCommand=async(kind:string,payload:unknown,label:string,force=false,wait=false)=>{
  if(!controller)return
  setLocalError(null);setSceneReceipt(null)
  const frame=controller.asynchronous?uiIntent.begin('先把这一步看清…'):null
  try{
   const context=controller.snapshot.view;if(!context)throw Error('RUN_NOT_PLAYING')
   const workspace=frame?await frame.ready:{...activeWorkspace.current};if(!workspace||frame&&!frame.owns())return
   const choice=journeyIntent(context,kind,payload,label,force),command=controller.prepare(choice.kind,choice.payload),preview=controller.asynchronous?await controller.previewAsync!(command):controller.preview(command)
   if(frame&&!frame.owns())return
   if(!preview.allowed){setLocalError(reasonText(preview.reasonCodes[0]??'INVALID_PAYLOAD'));return}
   const reader=currentOperatingJobReader.current,body=payload!==null&&typeof payload==='object'&&!Array.isArray(payload)?payload as Record<string,unknown>:{},jobSource=reader&&isOperatingJobTarget(reader.target)?resolveOperatingJob({view:context,features:context.features as unknown as PlayFeatures},reader.target):null
   const related=jobSource?.status==='valid'&&(['InterruptJob','RescheduleJob'].includes(kind)&&body.jobId===jobSource.job.id||kind==='AdvanceTime'&&(body.date===jobSource.job.startAt||body.date===jobSource.job.completeAt))
   const operatingReader:OperatingReaderContext|null=related&&reader&&isOperatingJobTarget(reader.target)?{target:{...reader.target},epoch:operatingReaderEpoch.current,commandId:command.commandId,sourceRevision:command.expectedRevision}:null
   const semantic=wait&&command.kind==='AdvanceTime'&&context.phase==='playing',intent:ConfirmIntent={command,label:choice.label,...(semantic?{wait:true}:{}),...(operatingReader?{operatingReader}:{})}
   if(choice.confirm||preview.actionPoints>0||preview.upfrontCostFen>0){
    const contextFeatures=context.features as unknown as PlayFeatures,clock=['AdvanceTime','AdvanceEpilogueTime'].includes(command.kind)?controller.asynchronous?await controller.clockCommitmentsAsync!(command):controller.clockCommitments(command):null
    if(frame&&!frame.owns())return
    const reviewAccountName=(id:string)=>id==='personal'?'个人账户':(contextFeatures.workbench.routes.find(r=>r.accountId===id)?.name??'企业账户')+' · '+id.slice(-6)
    const lifeDecision=captureLifeDecision(command,preview,context,contextFeatures)
    frame?.finish();setModal({kind:'command',workspace,intent,...(controller.asynchronous?{captured:{view:context,preview,session:controller.runtimeSession??''}}:{}),equityShared:equitySharedCommandBusinessId(command,{view:context,features:contextFeatures})!==null,decisionFacts:lifeDecision?<LifeDecisionFacts value={lifeDecision}/>:equitySharedCommandBusinessId(command,{view:context,features:contextFeatures})!==null?<EquitySharedCommandDetails command={command} preview={preview} view={context} features={contextFeatures}/>:(EQUITY_INVITATION_DECISIONS.has(command.kind)||EQUITY_PLANNING_COMMANDS.has(command.kind)||['StartEquityNegotiation','SignEquityAgreement','DeclineEquityTerms','FollowEquityRound','ProposeEquityGovernance','AcceptEquityExit','CollectEquityExit'].includes(command.kind))?<EquityDecisionFacts command={command} preview={preview} view={context} features={contextFeatures} accountName={reviewAccountName}/>:null,clockFacts:clock?<ClockConfirmationFacts clock={clock} newCostFen={preview.upfrontCostFen} newActionPoints={preview.actionPoints} accountName={id=>id==='personal'?'个人账户':(contextFeatures.workbench.routes.find(r=>r.accountId===id)?.name??'企业账户')+' · '+id.slice(-6)}/>:null,details:<><CommandDetails command={command} confirm={preview} features={contextFeatures} view={context} clock={clock} accountName={id=>id==='personal'?'个人账户':(contextFeatures.workbench.routes.find(r=>r.accountId===id)?.name??'企业账户')+' · '+id.slice(-6)}/>{semantic?<p>日子沿原安排前进；收到可回应的反馈会先停下，原费用照常结算。已经发生的日子保留。</p>:null}</>})
   }else{frame?.finish();void dispatch(intent,workspace).catch(fail)}
  }catch(error){if(!frame||frame.owns())fail(error)}finally{frame?.finish()}
 }
 const request:RequestCommand=(kind,payload,label,force=false)=>requestCommand(kind,payload,label,force)
 const requestWait=(date:string,label:string,confirm:boolean)=>requestCommand('AdvanceTime',{date},label,confirm,true)
 const features=view?.features as PlayFeatures|undefined,props=controller&&view&&features?{controller,view,features,request,requestWait,accountId,textOnly:settings.textOnly,videoDraftMemory,courseDraftMemory,courseTeachingDraftMemory,relayDraftMemory,relayPreparationDraftMemory,relayResponseDraftMemory,relayRecordMemory,ecosystemDraftMemory,equityDraftMemory}:null
 const rememberedFocus=useMemo(()=>view?.phase==='playing'&&features?loadSeasonFocusPreference(focusPreferenceStorage,{runId:view.runId,quarter:features.workbench.quarter}):null,[view?.runId,view?.phase,features?.workbench.quarter,focusPreferenceStorage])
 const loadedChoice=rememberedFocus?.status==='loaded'?{...rememberedFocus.record,notice:rememberedFocus.quarterStatus==='previous'?rememberedFocus.message:null,requiresChoice:false}:null
 const selectedFocus=focusChoice?.runId===view?.runId?focusChoice:loadedChoice
 currentFocus.current=selectedFocus
 const openingFocus=selectedFocus?.focus??null,openingFocusQuarter=selectedFocus?.quarter??null
 const selectedThread=props&&view?.phase==='playing'&&openingFocus?playerThread(props,openingFocus,openingFocusQuarter??undefined):null
 const openingFocusNotice=selectedFocus?selectedFocus.notice:rememberedFocus?.status==='invalid'||rememberedFocus?.status==='unavailable'?rememberedFocus.message:null
 const focusRequiresChoice=selectedThread?.focusStatus==='invalid'||selectedFocus?.requiresChoice===true||!(focusChoice!==null&&focusChoice.runId===view?.runId&&focusChoice.focus!==null)&&(rememberedFocus?.status==='invalid'||rememberedFocus?.status==='unavailable')
 const attachedFocusSource=useRef<{runId:string;revision:number;handled:boolean}|null>(null)
 if(!view)attachedFocusSource.current=null
 else if(attachedFocusSource.current?.runId!==view.runId)attachedFocusSource.current={runId:view.runId,revision:view.revision,handled:false}
 useEffect(()=>{
  const origin=attachedFocusSource.current
  if(!view||!props||!origin||origin.handled||state.busy||view.busy||controller?.snapshot.view!==view)return
  origin.handled=true
  // Anchor only the initially attached public record. Later explicit saves keep
  // their original following/persistence path; this reading anchor never writes a preference.
  if(origin.runId!==view.runId||origin.revision!==view.revision||view.phase!=='playing'||rememberedFocus?.status!=='missing'||focusRequiresChoice||view.hasCandidate||!['saved','read_only'].includes(view.saveStatus)||currentFocus.current?.runId===view.runId&&currentFocus.current.focus!==null)return
  const recovered=playerThread(props)
  if(recovered.focus.kind==='free'||recovered.focus.entityId===null||recovered.focusScope==='entry'||recovered.focusStatus==='invalid'||recovered.stage==='review-choice'||recovered.legacyFallbackRequired)return
  const local:LocalSeasonFocus={runId:view.runId,quarter:props.features.workbench.quarter,focus:recovered.focus,notice:null,requiresChoice:false}
  currentFocus.current=local;setFocusChoice(local)
 },[view,state.busy,rememberedFocus,focusRequiresChoice,props])
 const rememberFocus=(focus:OpeningFocus|null,source:PlayingView|null=controller?.snapshot.view??null)=>{
  if(!source)return
  if(source.phase==='epilogue'){
   if(focus?.kind!=='equity'||source.busy||source.hasCandidate||!['saved','read_only'].includes(source.saveStatus))return
   const matched=playerThread({view:source,features:source.features as unknown as PlayFeatures},focus)
   if(matched.focusStatus==='invalid')return
   // Closing remembers only this window's explicitly chosen old object. It
   // never writes a post-2025 quarter into the normal season preference.
   const next:LocalSeasonFocus={runId:source.runId,quarter:matched.focusQuarter??'2025-Q4',focus:matched.focus,notice:null,requiresChoice:false}
   currentFocus.current=next;setFocusChoice(next);return
  }
  if(source.phase!=='playing')return
  const quarter=(source.features as unknown as PlayFeatures).workbench.quarter
  const chosen=focus??{runId:source.runId,kind:'free' as const,accountId:'personal',entityId:null}
  const matched=playerThread({view:source,features:source.features as unknown as PlayFeatures},chosen,quarter)
  if(matched.focusStatus==='invalid'){
   const previous=currentFocus.current?.runId===source.runId?currentFocus.current:null
   setFocusChoice({runId:source.runId,quarter:previous?.quarter??quarter,focus:previous?.focus??null,notice:matched.invalidReason??'原关注已不可达，请重新选择。',requiresChoice:previous===null||previous.focus===null||previous.requiresChoice})
   return
  }
  const result=saveSeasonFocusPreference(focusPreferenceStorage,{version:1,runId:source.runId,quarter,focus:matched.focus},{runId:source.runId,quarter,saveStatus:source.saveStatus,hasCandidate:source.hasCandidate,busy:source.busy})
  if(result.status==='blocked'||result.status==='invalid'){
   const previous=currentFocus.current?.runId===source.runId?currentFocus.current:null
   setFocusChoice({runId:source.runId,quarter:previous?.quarter??quarter,focus:previous?.focus??null,notice:result.message,requiresChoice:previous===null||previous.focus===null||previous.requiresChoice})
   return
  }
  const next={runId:source.runId,quarter,focus:matched.focus,notice:result.status==='saved'?null:result.message,requiresChoice:false}
  currentFocus.current=next
  setFocusChoice(next)
 }
 const openingRoom=!!view&&view.phase==='playing'&&tab==='room'
 const openingThread=openingRoom&&props?(selectedThread??playerThread(props,openingFocus,openingFocusQuarter??undefined)):null
 const displayingToday=openingRoom&&view&&dayPerspectiveCurrent(view,requestedRoomToday)&&openingThread&&!focusRequiresChoice&&openingThread.focusStatus!=='invalid'&&!openingThread.responsibilityOverrideNeeded&&!openingThread.legacyFallbackRequired
 const displayAccountId=displayingToday?'personal':openingThread&&!focusRequiresChoice&&openingThread.focusStatus!=='invalid'?openingThread.focus.accountId:accountId
 const closeWorkspace=()=>{
  const back=readerReturn.current,current=controller?.snapshot.view;readerReturn.current=null;setWorkspaceOpen(false)
  if(back&&current&&current.runId===back.runId&&current.revision===back.revision){
   const sameFocus=back.focusKey===JSON.stringify(currentFocus.current?.focus??null)
   setTab('room');setAccountId(sameFocus?back.accountId:currentFocus.current?.focus?.accountId??back.accountId);setRequestedRoomToday(sameFocus?back.today:null)
   setSceneReceipt(receipt=>{const actual=receipt??back.receipt;return sameFocus&&actual?.runId===current.runId&&actual.revision===current.revision?{...actual,screen:'room',workspace:null}:null})
  }
 }
 const openWorkspace=(screen:Screen=tab,target?:SceneTarget)=>{
  if(!workspaceOpen){const current=controller?.snapshot.view;readerReturn.current=tab==='room'&&(screen==='finance'||screen==='deepseek')&&current&&current.runId===view?.runId?{runId:current.runId,revision:current.revision,accountId:selectedAccountId,focusKey:JSON.stringify(currentFocus.current?.focus??null),today:requestedRoomToday,receipt:sceneReceipt}:null}
  const lifeMode=target?.lifeSelection??(screen===tab?lifeSceneMode:'person')
  const recordId=target?.recordId??(screen===tab?(screen==='market'?marketRecordId:screen==='quarter'?quarterRecordId:screen==='life'?lifeRecordId:null):null)
  const requestedVideo=target?.videoTarget??(screen===tab&&target===undefined?videoTarget:undefined)
  const requestedCourse=target?.courseTarget!==undefined?target.courseTarget:screen===tab&&target===undefined?courseTarget:undefined
  const requestedCourseDraftSlot=target?.courseDraftSlot??(screen===tab&&target===undefined?courseDraftSlot:undefined)
  const requestedCourseTeachingSlot=target?.courseTeachingSlot??(screen===tab&&target===undefined?courseTeachingSlot:undefined)
  const requestedRelay=target?.relayTarget!==undefined?target.relayTarget:screen===tab&&target===undefined?relayTarget:undefined
  const requestedRelayDraftSlot=target?.relayDraftSlot??(screen===tab&&target===undefined?relayDraftSlot:undefined)
  const requestedRelayRecordId=target?.recordId??(screen===tab&&target===undefined?relayRecordId:null)
  navigate(screen,true)
  if(screen==='market')setMarketRecordId(recordId)
  if(screen==='quarter')setQuarterRecordId(recordId)
  if(screen==='life')setLifeRecordId(recordId)
  if(target?.accountId)setAccountId(target.accountId)
  if(target?.personId)setLifePerson(target.personId)
  if(screen==='deepseek'){setDeepseekTarget({pane:target?.deepseekPane??'ecosystem',...(target?.recordId?{recordId:target.recordId}:{})});setEcosystemTarget(target?.ecosystemTarget??null);setEquityTarget(target?.equityTarget!==undefined?target.equityTarget:target?.recordId?undefined:null);if(target?.ecosystemTarget)setAccountId(target.ecosystemTarget.accountId);if(target?.equityTarget&&target.accountId===undefined)setAccountId(target.equityTarget.accountId)}
  if(screen==='course'){
   setCourseRecordId(target?.recordId??(screen===tab&&target===undefined?courseRecordId:null));setCourseTarget(requestedCourse);setCourseDraftSlot(requestedCourseDraftSlot);setCourseTeachingSlot(requestedCourseTeachingSlot)
   const owner=features?.course?.businesses.find(b=>b.id===requestedCourse?.businessId)
   if(owner&&target?.accountId===undefined)setAccountId(owner.accountId)
  }
  if(screen==='video'){
   setVideoTarget(requestedVideo)
   const channel=features?.video?.channels.find(c=>c.id===requestedVideo?.channelId)
   if(channel&&target?.accountId===undefined)setAccountId(channel.accountId)
  }
  if(screen==='relay'){
   setRelayTarget(requestedRelay);setRelayDraftSlot(requestedRelayDraftSlot);setRelayRecordId(requestedRelayRecordId)
   if(requestedRelay&&target?.accountId===undefined)setAccountId(requestedRelay.accountId)
  }
  if(screen==='life'){setLifeSceneMode(lifeMode);setLifePane(lifeMode==='person'?'people':'today')}
 }
 const navigateScene=(screen:Screen,target?:SceneTarget)=>{
  if(target?.operatingJobTarget){
   if(!view||controller?.snapshot.view!==view||state.busy||view.busy)return
   const originalTarget=isOperatingJobTarget(target.operatingJobTarget)?{...target.operatingJobTarget}:target.operatingJobTarget,reader={target:originalTarget,key:isOperatingJobTarget(originalTarget)?operatingJobKey(originalTarget):''}
   operatingReaderEpoch.current++;currentOperatingJobReader.current=reader;setOperatingJobReader(reader);return
  }
  if(target?.openRecord||((screen==='quarter'||screen==='life')&&target?.recordId)){openWorkspace(screen,target);return}
  navigate(screen)
  if(screen==='room'&&target?.roomView==='today'&&view?.phase==='playing')setRequestedRoomToday({runId:view.runId,revision:view.revision})
  if(target?.accountId)setAccountId(target.accountId)
  if(target?.personId)setLifePerson(target.personId)
  if(screen==='market')setMarketRecordId(target?.recordId??null)
  if(screen==='video'){
   setVideoTarget(target?.videoTarget)
   const channel=features?.video?.channels.find(c=>c.id===target?.videoTarget?.channelId)
   if(channel&&target?.accountId===undefined)setAccountId(channel.accountId)
  }
  if(screen==='course'){
   setCourseTarget(target?.courseTarget===undefined?null:target.courseTarget);setCourseRecordId(target?.recordId??null);setCourseDraftSlot(target?.courseDraftSlot);setCourseTeachingSlot(target?.courseTeachingSlot)
   const owner=features?.course?.businesses.find(b=>b.id===target?.courseTarget?.businessId)
   if(owner&&target?.accountId===undefined)setAccountId(owner.accountId)
  }
  if(screen==='relay'){
   setRelayTarget(target?.relayTarget===undefined?null:target.relayTarget);setRelayDraftSlot(target?.relayDraftSlot);setRelayRecordId(target?.recordId??null)
   if(target?.relayTarget&&target.accountId===undefined)setAccountId(target.relayTarget.accountId)
  }
  if(screen==='deepseek'){setDeepseekTarget({pane:target?.deepseekPane??'ecosystem',...(target?.recordId?{recordId:target.recordId}:{})});setEcosystemTarget(target?.ecosystemTarget??null);setEquityTarget(target?.equityTarget!==undefined?target.equityTarget:target?.recordId?undefined:null);setAccountId(target?.accountId??target?.equityTarget?.accountId??target?.ecosystemTarget?.accountId??'personal')}
  if(target?.lifeSelection)setLifeSceneMode(target.lifeSelection)
 }
 const selectEcosystemRecord=(focus:OpeningFocus)=>{
  if(focus.kind!=='ecosystem')return
  const current=controller?.snapshot.view
  if(!current||current.busy||controller?.snapshot.busy||current.hasCandidate||current.saveStatus==='conflict'||current.saveStatus==='unsaved')return
  const input={view:current,features:current.features as unknown as PlayFeatures},checked=resolveEcosystemFocus(input,focus)
  if(checked.reason){setLocalError(checked.reason);return}
  setEcosystemTarget(focus.ecosystemTarget);setAccountId(focus.accountId);setDeepseekTarget({pane:'ecosystem'});setSceneReceipt(null)
  const old=currentFocus.current?.runId===current.runId?currentFocus.current.focus:null
  if(!old||old.kind!=='ecosystem'||old.runId!==focus.runId||old.accountId!==focus.accountId||old.businessId!==focus.businessId||old.entityId!==focus.entityId||old.ecosystemTarget?.kind!==focus.ecosystemTarget?.kind)rememberFocus(focus,current)
 }
 const selectEquityRecord=(focus:OpeningFocus)=>{
  if(focus.kind!=='equity')return
  const current=controller?.snapshot.view
  if(!current||current.busy||controller?.snapshot.busy||current.hasCandidate||!['saved','read_only'].includes(current.saveStatus))return
  const input={view:current,features:current.features as unknown as PlayFeatures},checked=resolveEquityFocus(input,focus)
  if(checked.reason){setLocalError(checked.reason);return}
  setEquityTarget(focus.equityTarget);setAccountId(focus.accountId);setDeepseekTarget({pane:'equity'});setSceneReceipt(null)
  const old=currentFocus.current?.runId===current.runId?currentFocus.current.focus:null
  if(focusIdentity(old)!==focusIdentity(focus))rememberFocus(focus,current)
 }
 const openClosingEquity=()=>{
  const current=controller?.snapshot.view
  if(!current||current.runId!==view?.runId||current.phase!=='epilogue')return
  const remembered=currentFocus.current,focus=remembered?.runId===current.runId&&remembered.focus?.kind==='equity'?remembered.focus:null
  navigateScene('deepseek',{deepseekPane:'equity',...(focus?.equityTarget!==null||!focus?.entityId?{equityTarget:focus?.equityTarget??null}:{}),accountId:focus?.accountId??'personal',...(focus?.entityId?{recordId:focus.entityId}:{})})
 }
 const selectVideoRecord=(target:NonNullable<SceneTarget['videoTarget']>)=>{
  const current=controller?.snapshot.view
  if(!current||current.busy||controller?.snapshot.busy||current.hasCandidate||current.saveStatus==='conflict')return
  setVideoTarget(target)
  const channel=features?.video?.channels.find(c=>c.id===target.channelId)
  if(channel)setAccountId(channel.accountId)
  if(currentFocus.current?.runId===current.runId&&currentFocus.current.focus?.kind==='video'){
   const focus=openingFocusFor({view:current,features:current.features as unknown as PlayFeatures},'video',{videoTarget:target})
   if(focus)rememberFocus(focus,current)
  }
 }
 const selectCourseRecord=(target:NonNullable<SceneTarget['courseTarget']>|null)=>{
  const current=controller?.snapshot.view
  if(!current||current.busy||controller?.snapshot.busy||current.hasCandidate||current.saveStatus==='conflict')return
  setCourseTarget(target);setCourseRecordId(null);setCourseDraftSlot(undefined);setCourseTeachingSlot(undefined)
  const owner=(current.features as unknown as PlayFeatures).course?.businesses.find(b=>b.id===target?.businessId)
  setAccountId(owner?.accountId??'personal')
  if(currentFocus.current?.runId===current.runId&&currentFocus.current.focus?.kind==='course'){
   const focus=openingFocusFor({view:current,features:current.features as unknown as PlayFeatures},'course',{courseTarget:target,accountId:owner?.accountId??'personal'})
   if(focus)rememberFocus(focus,current)
  }
 }
 const selectRelayRecord=(target:NonNullable<SceneTarget['relayTarget']>|null,draftSlot?:SceneTarget['relayDraftSlot'],recordId?:string)=>{
  const current=controller?.snapshot.view
  if(!current||current.busy||controller?.snapshot.busy||current.hasCandidate||current.saveStatus==='conflict')return
  const nextAccount=target?.accountId??'personal',currentFeatures=current.features as unknown as PlayFeatures
  const reason=relayTargetReason(currentFeatures.relay,target,{runId:current.runId,accountId:nextAccount,operations:current.operations})
  if(reason){setLocalError(reason);return}
  setRelayTarget(target);setRelayDraftSlot(draftSlot);setRelayRecordId(recordId??null);setAccountId(nextAccount);setSceneReceipt(null)
  if(currentFocus.current?.runId===current.runId&&currentFocus.current.focus?.kind==='relay'){
   const focus=openingFocusFor({view:current,features:currentFeatures},'relay',{relayTarget:target,accountId:nextAccount})
   if(focus)rememberFocus(focus,current)
  }
 }
 const showPeople=(personId:LifePerson=lifePerson,open=false)=>{navigate('life',open);setLifePerson(personId);setLifeSceneMode('person');setLifePane('people')}
 const showYear=(year:number|null=null)=>{navigate('life',true);setLifeYear(year);setLifePane('year')}
 const saveSettings=(next:typeof settings)=>{setSettings(next);try{localStorage.setItem('reborn-2020-display',JSON.stringify(next));setSettingsNotice('显示设置已保存在本机。')}catch{setSettingsNotice('显示设置仅在当前窗口生效，本机设置未保存。')}}
 const stateError=state.error==='SAVE_ABORTED'&&!view?.hasCandidate?'这一步没有保存，已有原档保持完整。请回到原页重新核对并确认；当前没有未保存候选。':state.error?reasonText(state.error):null
 const error=localError??stateError??startupError
 const accountName=(id:string)=>{if(id==='personal')return '个人账户';const b=view?.operations?.businesses.find(b=>b.accountId===id&&b.company);return b?'企业账户 · '+(features?.workbench.routes.find(r=>r.id===b.route)?.name??id.slice(-6))+(b.lifecycle==='closed'?'（已关闭）':''):id}
 const preparationReceipt=workspaceOpen&&view?.saveStatus==='saved'&&!view.hasCandidate&&!view.readOnly&&sceneReceipt?.kind==='LicenseCourseMaterials'&&sceneReceipt.workspace&&sceneReceipt.runId===view.runId&&sceneReceipt.screen===tab&&sceneReceipt.revision===view.revision&&sameCourseWorkspace(sceneReceipt.workspace,activeWorkspace.current)?sceneReceipt:null
 const readOnlyTitle=view?.readOnlyReason==='ANOTHER_WRITER'?'另一标签占有写权限，本页只读':view?.readOnlyReason==='LOCK_API_UNAVAILABLE'?'当前浏览器缺少可靠写锁，本页只读':'写锁申请失败，本页只读'
 const payloadStart=modal?.kind==='command'&&typeof modal.intent.command.payload==='object'&&modal.intent.command.payload!==null&&'startAt' in modal.intent.command.payload&&typeof modal.intent.command.payload.startAt==='string'?modal.intent.command.payload.startAt:null
 const uncertainRuntime=controller?.runtimeFailed&&controller.runtimeWriteUncertain
 const saveLabel=uncertainRuntime?'保存待核对':view?savedLabel(view.saveStatus):''
 const captured=modal?.kind==='command'?modal.captured:null
 const capturedReason=captured&&controller?(controller.runtimeFailed?'RUNTIME_UNAVAILABLE':state.busy?'SAVE_IN_PROGRESS':controller.snapshot.view!==captured.view||controller.runtimeSession!==captured.session?'STALE_REVISION':null):null
 const confirm=modal?.kind==='command'&&controller?(pendingSubmission?.commandId===modal.intent.command.commandId?pendingSubmission.preview:captured?capturedReason?{...captured.preview,allowed:false,reasonCodes:[capturedReason]}:captured.preview:controller.preview(modal.intent.command)):null
 const scheduledStart=confirm?.actionDate??payloadStart
 const money=modal?.kind==='command'&&confirm?confirmationMoney(modal.intent.command,confirm):null
 const clockCommand=modal?.kind==='command'&&['AdvanceTime','AdvanceEpilogueTime'].includes(modal.intent.command.kind)
 const videoCommission=modal?.kind==='command'&&modal.intent.command.kind==='AcceptVideoCommission'
 const courseTeaching=modal?.kind==='command'&&modal.intent.command.kind==='StartCourseStage'
 const ecologyContract=modal?.kind==='command'&&modal.intent.command.kind==='AcceptEcoContract'
 const combinedScheduledDate=(videoCommission||courseTeaching)&&scheduledStart!==null&&scheduledStart===view?.date
 const commandActions=modal?.kind==='command'&&confirm?<div className="button-row dialog-actions"><button type="button" onClick={()=>setModal(null)}>返回调整</button><button type="button" className="primary" disabled={!confirm.allowed||state.busy||pendingSubmission!==null} onClick={()=>{const intent=modal.intent,workspace=modal.workspace;setPendingSubmission({commandId:intent.command.commandId,preview:confirm});if(intent.wait)setModal(null);void dispatch(intent,workspace).then(status=>{if(intent.wait||['saved','duplicate','unsaved','conflict'].includes(status??''))setModal(current=>current?.kind==='command'&&current.intent.command.commandId===intent.command.commandId?null:current)}).catch(fail).finally(()=>setPendingSubmission(current=>current?.commandId===intent.command.commandId?null:current))}}>就这样决定 →</button></div>:null
 const ecosystemFocus=props?ecosystemFocusFor(props,ecosystemTarget??null,ecosystemTarget?.accountId??'personal'):null
 const ecosystemScene=props&&ecosystemFocus&&view?.phase==='playing'&&tab==='deepseek'&&deepseekTarget.pane==='ecosystem'&&!playerThread(props,ecosystemFocus).responsibilityOverrideNeeded
 const equityReadingFocus=props?openingFocusFor(props,'deepseek',{deepseekPane:'equity',accountId,...(equityTarget!==undefined?{equityTarget}:{}),...(deepseekTarget.recordId?{recordId:deepseekTarget.recordId}:{})}):null
 const equityFocus=equityReadingFocus?.kind==='equity'?equityReadingFocus:null
 const equityScene=props&&equityFocus&&(view?.phase==='playing'||view?.phase==='epilogue')&&tab==='deepseek'&&deepseekTarget.pane==='equity'&&!playerThread(props,equityFocus).responsibilityOverrideNeeded
 return <div data-screen={view?tab:'entry'} data-eco-scene={tab==='room'&&(openingFocus?.kind==='ecosystem'||openingFocus?.kind==='equity')||ecosystemScene||equityScene?'true':undefined} className={['game-app','cinema-app',view?'cinema-playing film-play':'cinema-entry',settings.textOnly?'text-mode':'',settings.reducedMotion?'reduced-motion':'',openingRoom?'opening-scene-active':''].join(' ')}>{view&&features&&!settings.textOnly?<ChapterBackdrop key={tab} screen={tab} workspaceCompleted={features.life.scene.workspaceCompleted}/>:null}<a className="skip-link" href="#main-content">跳到主要操作</a><header className="site-header"><a href="#" className="wordmark" onClick={event=>{event.preventDefault();if(!view){setEntryKey(k=>k+1);return}if(!controller)return;if(controller.needsUnsavedWarning)setModal({kind:'exit'});else void controller.home().catch(fail)}}>重生2020 <span>AI时代</span></a><span className="edition">本局模拟 / 架空情境</span>{view&&!openingRoom?<MainNavigation screen={tab} onNavigate={navigate} closing={view.phase!=='playing'}/>:null}<div className="button-row">{view?<button key="pause" type="button" disabled={state.busy} onClick={()=>{if(controller?.needsUnsavedWarning)setModal({kind:'exit'});else void controller?.home().catch(fail)}} aria-label="保存退出到入口" className="scene-pause-control">保存离开</button>:null}{view&&controller?<WaitStopControl key={view.runId} active={controller.timeWait!==null} stopping={controller.timeWait?.stopRequested??false} interrupted={controller.runtimeFailed===true} onStop={()=>controller.stopWaiting()}/>:null}<button type="button" onClick={()=>setModal({kind:'settings'})}>设置与说明</button></div></header>
 {error&&!view?.hasCandidate&&view?.saveStatus!=='conflict'?<SafetyNotice key={error} title="操作未完成"><div role="alert" className="global-alert error-box"><strong>操作未完成</strong><p>{error}</p>{state.phase==='error'&&controller?<button type="button" disabled={state.busy} onClick={()=>{void controller.initialize().then(()=>setLocalError(null)).catch(fail)}}>重试读取本机存档</button>:null}</div></SafetyNotice>:null}
 {diagnostics?<aside className="test-banner">隔离存储验证库：{diagnostics.name} · 写入成功后中止：{diagnostics.trace.writeSucceeded&&diagnostics.trace.abortIssued?'已触发':'待触发'}。此开关只存在于本地开发服务。</aside>:null}
 {props&&view?<>{view.origin==='fixture'?<aside className="warning-box saved-warning">隔离测试存档：可能含预设资金或资格，不代表正常开局成果。</aside>:null}<div className={'run-bar'+(openingRoom?' opening-run-bar':'')}><div><span className="date-label">{view.date}</span><span>{features!.workbench.quarter} · {backgroundNames[view.backgroundId as keyof typeof backgroundNames]??view.backgroundId} · 愿望：{wishes[view.playerProfile.wishId]}</span></div><div className="run-numbers"><strong>{openingRoom?(displayAccountId==='personal'?'个人可花 ':'企业可花 '):'可花 '}{moneyText(view.accounts.find(a=>a.accountId===displayAccountId)?.availableFen)}</strong><span className="scene-action-budget" aria-label={'行动'+view.budget.available+'/'+view.budget.total+'，预留'+view.budget.reserved}><span>行动 {view.budget.available}/{view.budget.total}</span><span className="action-pips" aria-hidden="true">{Array.from({length:view.budget.total},(_,i)=><i key={i} data-state={i<view.budget.available?'available':i<view.budget.available+view.budget.reserved?'reserved':'spent'}/>)}</span><small>预留{view.budget.reserved}</small></span></div>{openingRoom?<button type="button" className="opening-account-link" onClick={()=>openWorkspace('finance',{accountId:displayAccountId})}>{accountName(displayAccountId)} · 翻开原账 ↗</button>:<label>查看账户<select value={accountId} onChange={event=>setAccountId(event.target.value)}>{!view.accounts.some(account=>account.accountId===accountId)?<option value={accountId} disabled>原账户已不可达，请重选</option>:null}{view.accounts.map(account=><option value={account.accountId} key={account.accountId}>{accountName(account.accountId)}</option>)}</select></label>}<span className={'save-badge save-'+view.saveStatus} role="status" aria-label={saveLabel+'，第'+view.revision+'次提交'}>{saveLabel}<span className="sr-only"> · {view.revision}</span></span></div>
 {view.readOnly?<SafetyNotice key={view.runId+view.saveStatus} title="当前人生只读"><aside className="warning-box saved-warning"><strong>{readOnlyTitle}</strong><p>{view.readOnlyReason==='ANOTHER_WRITER'?'可以查看和导出。关闭另一标签或在那里退出后，再尝试接管；不会静默覆盖。':'可以查看和导出。当前不能可靠取得写权限，请在支持本机写锁的浏览器继续，或重试申请；不会无保护写入。'}</p><button type="button" disabled={state.busy} onClick={()=>{void controller!.reload().catch(fail)}}>重新读取并尝试接管</button></aside></SafetyNotice>:null}
 {view.hasCandidate&&view.saveStatus!=='saving'||view.saveStatus==='conflict'?<SafetyNotice key={view.runId+view.saveStatus} title={view.saveStatus==='conflict'?'存档冲突':'未保存 · 旧提交仍完整'}><aside className="unsaved-banner" role="alert"><strong ref={unsavedHeading} tabIndex={-1}>{view.saveStatus==='conflict'?'存档冲突：没有覆盖另一提交':'未保存：界面仍是上一次完整提交'}</strong>{error?<p>{error}</p>:null}<p>新操作已暂停。候选可以导出；重试不会重新执行命令或抽取结果。</p><div className="button-row">{view.hasCandidate&&view.saveStatus!=='conflict'&&!controller!.runtimeFailed?<button type="button" className="primary" disabled={state.busy} onClick={()=>{const pending=failedScene.current,workspace=pending?{...pending.workspace,open:false,epoch:activeWorkspace.current.epoch}:null,retrySession=controller!.runtimeSession;void controller!.retry().then(result=>{if(controller!.runtimeSession!==retrySession||pending&&controller!.snapshot.view?.runId!==pending.runId)return;if(pending&&workspace){const current=controller!.snapshot.view,resumed=(result.status==='saved'||result.status==='duplicate')?(result.waitResult&&pending.wait&&current?checkpointResultAfterRetry(pending.wait,result.waitResult,current):!result.checkpointWait&&pending.wait&&current?waitResultAfterRetry(pending.wait,result.receipt,current):null):null;if(resumed)onWaitSubmission(resumed,workspace,pending.label,pending.operatingReader);else if(!((result.status==='saved'||result.status==='duplicate')&&result.checkpointWait))onSubmission(result.status,pending.runId,pending.screen,pending.label,pending.kind,workspace,pending.payload,pending.operatingReader);else if(!current?.hasCandidate)failedScene.current=null}}).catch(fail)}}>重试保存原候选</button>:null}{view.hasCandidate?<button type="button" disabled={state.busy} onClick={()=>exportCurrent(true)}>导出未保存候选</button>:null}<button type="button" disabled={state.busy} onClick={()=>exportCurrent()}>导出旧已保存存档</button><button type="button" disabled={state.busy} onClick={()=>setModal({kind:'reload'})}>舍弃候选并重新读取</button></div></aside></SafetyNotice>:null}
 {journeyOpen?<Dialog title="你走过的篇章" className="journey-dialog" onClose={()=>setJourneyOpen(false)}><Suspense fallback={<p role="status">正在翻开这段人生…</p>}><JourneyPanel p={props} onYear={year=>{setJourneyOpen(false);showYear(year)}} onChoose={()=>{setJourneyOpen(false);navigate('quarter')}}/></Suspense></Dialog>:null}
 <SceneAttention p={props} onStoryScene={id=>{setStoryIncidentId(id);navigate('story')}} onOpen={(screen,accountId)=>{if(accountId)setAccountId(accountId);navigate(screen,true)}}/>
 {tab==='room'&&!openingRoom&&!modal&&sceneReceipt?.kind!=='AdvanceTime'&&sceneReceipt?.runId===view.runId&&sceneReceipt.screen===tab&&sceneReceipt.revision===view.revision?<SceneEcho text={sceneReceipt.text} frame={sceneReceipt.frame} onClose={()=>setSceneReceipt(null)} accountName={accountName}/>:null}
 <div className="workbench-layout"><main id="main-content" tabIndex={-1} className="workbench-main">{tab==='room'&&features!.journey?.ending&&(view.phase!=='playing'||features!.journey.canEnterEpilogue)?<Suspense fallback={<p className="scene-loading" role="status">正在回看这段人生…</p>}><EndingStage key={view.runId+':'+view.phase} p={props} headingRef={heading} onOpen={screen=>navigate(screen,true)} onJourney={()=>setJourneyOpen(true)} onOpenEquity={openClosingEquity} onNewLife={()=>{if(controller?.needsUnsavedWarning)setModal({kind:'exit'});else void controller?.home().catch(fail)}}/></Suspense>:tab==='room'?<CinematicRoom {...props} onSavedFollowFocus={focus=>rememberFocus(focus,controller?.snapshot.view??undefined)} todayPerspective={requestedRoomToday} onTodayPerspective={setRequestedRoomToday} openingFocus={openingFocus} focusQuarter={openingFocusQuarter} focusNotice={openingFocusNotice} focusRequiresChoice={focusRequiresChoice} onOpeningFocus={focus=>{const source=controller?.snapshot.view;if(source&&source===view&&!source.busy&&!state.busy&&!source.hasCandidate&&['saved','read_only'].includes(source.saveStatus)&&(focus?.kind==='ecosystem'||openingFocus?.kind==='ecosystem'||focus?.kind==='equity'||openingFocus?.kind==='equity')&&JSON.stringify(focus)!==JSON.stringify(openingFocus)&&playerThread({view:source,features:source.features as unknown as PlayFeatures},focus).focusStatus!=='invalid')setSceneReceipt(null);rememberFocus(focus)}} notice={openingRoom&&view.revision===1?null:state.notice?activityText(state.notice):null} timeEcho={!modal&&sceneReceipt&&(openingRoom||sceneReceipt.kind==='AdvanceTime')&&sceneReceipt.runId===view.runId&&sceneReceipt.screen===tab&&sceneReceipt.revision===view.revision?<SceneTimeNotice compact={openingRoom} key={view.revision} date={view.date} text={sceneReceipt.text} {...(sceneReceipt.brief?{brief:sceneReceipt.brief}:{})} frame={sceneReceipt.frame} onClose={()=>setSceneReceipt(null)} accountName={accountName}/>:null} headingRef={heading} onJourney={()=>setJourneyOpen(true)} onNavigate={navigateScene} onPeople={personId=>showPeople(personId??'tang-ying')} onYear={()=>showYear()}/>:tab==='routes'?<Suspense fallback={<p className="scene-loading" role="status">新的路，正在眼前展开…</p>}><RoutesPanel {...props} headingRef={heading} onRoute={id=>navigate(screenForRoute(id))}/></Suspense>:ecosystemScene&&ecosystemFocus?<EcosystemMoment p={{...props,accountId:ecosystemFocus.accountId}} focus={ecosystemFocus} headingRef={heading} feedback={!modal&&sceneReceipt?.runId===view.runId&&sceneReceipt.screen==='deepseek'&&sceneReceipt.revision===view.revision?<SceneTimeNotice compact date={view.date} text={sceneReceipt.text} {...(sceneReceipt.brief?{brief:sceneReceipt.brief}:{})} frame={sceneReceipt.frame} onClose={()=>setSceneReceipt(null)} accountName={accountName}/>:null} onFocus={selectEcosystemRecord} onNavigate={navigateScene} onExplore={()=>navigateScene('room')} onToday={()=>navigateScene('room',{roomView:'today'})}/>:equityScene&&equityFocus?<EquityMoment p={{...props,accountId:equityFocus.accountId}} focus={equityFocus} headingRef={heading} feedback={!modal&&sceneReceipt?.runId===view.runId&&sceneReceipt.screen==='deepseek'&&sceneReceipt.revision===view.revision?<SceneTimeNotice compact date={view.date} text={sceneReceipt.text} {...(sceneReceipt.brief?{brief:sceneReceipt.brief}:{})} frame={sceneReceipt.frame} onClose={()=>setSceneReceipt(null)} accountName={accountName}/>:null} onFocus={selectEquityRecord} onNavigate={navigateScene} onExplore={()=>navigateScene('room')} onToday={()=>navigateScene('room',{roomView:'today'})}/>:<NarrativeScene {...props} videoTarget={videoTarget} onVideoTargetChange={selectVideoRecord} courseTarget={courseTarget} onCourseTargetChange={selectCourseRecord} relayTarget={relayTarget} onRelayTargetChange={selectRelayRecord} marketRecordId={marketRecordId} onStoryIncident={id=>{setStoryIncidentId(id);setSceneReceipt(null)}} storyIncidentId={storyIncidentId} screen={tab} headingRef={heading} personId={lifePerson} lifeMode={lifeSceneMode} onLifeMode={setLifeSceneMode} onPerson={id=>{setLifeRecordId(null);setLifePerson(id);setLifeSceneMode('person');setSceneReceipt(null)}} onNavigate={navigateScene} onOpen={openWorkspace} onPeople={()=>showPeople(lifePerson,true)} onYear={()=>showYear()} onDismissReceipt={()=>setSceneReceipt(null)} receiptKind={!preparationReceipt&&sceneReceipt?.runId===view.runId&&sceneReceipt.screen===tab&&sceneReceipt.revision===view.revision?sceneReceipt.kind:null} echoFrame={!preparationReceipt&&sceneReceipt?.runId===view.runId&&sceneReceipt.revision===view.revision?sceneReceipt.frame:null} receipt={!preparationReceipt&&sceneReceipt?.runId===view.runId&&sceneReceipt.screen===tab&&sceneReceipt.revision===view.revision?sceneReceipt.text:null}/>}</main></div>
 {tab!=='room'?<SceneThreads p={props} compact={!!ecosystemScene||!!equityScene} onOpen={(screen,personId,incidentId)=>{if(screen==='story'&&incidentId){setStoryIncidentId(incidentId);navigate('story')}else navigate(screen,true);if(screen==='life'&&personId){setLifePane('people');setLifePerson(personId)}}}/>:null}
 {operatingJobReader&&props?<OperatingJobRecord key={operatingJobReader.key} p={{...props,request:(...args)=>{makeSharedAction(props,args[2],()=>props.request(...args),{canActivate:()=>currentOperatingJobReader.current===operatingJobReader}).activate()},requestWait:props.requestWait?(...args)=>{makeSharedAction(props,args[1],()=>props.requestWait?.(...args),{canActivate:()=>currentOperatingJobReader.current===operatingJobReader}).activate()}:undefined}} target={operatingJobReader.target} initialDraft={operatingJobDrafts.current.get(operatingJobReader.key)??{resource:'',date:''}} onDraftChange={next=>{let changed=false;makeSharedAction(props,'调整这份原安排',()=>{if(operatingJobReader.key){operatingJobDrafts.current.set(operatingJobReader.key,next);changed=true}},{allowReadOnly:true,canActivate:()=>currentOperatingJobReader.current===operatingJobReader}).activate();return changed}} onClose={()=>{if(currentOperatingJobReader.current===operatingJobReader)closeOperatingJobReader()}} onBusiness={(businessId,owner)=>{if(currentOperatingJobReader.current!==operatingJobReader||controller?.snapshot.view!==props.view)return;const original=resolveOperatingJob(props,operatingJobReader.target);if(original.status!=='valid'||original.business.id!==businessId||original.business.accountId!==owner||original.business.definitionId!=='ecosystem-service')return;closeOperatingJobReader();openWorkspace('deepseek',{accountId:owner,deepseekPane:'ecosystem',ecosystemTarget:{runId:props.view.runId,accountId:owner,businessId,kind:'business'},recordId:businessId,openRecord:true})}}/>:null}
 {workspaceOpen&&tab!=='room'&&tab!=='routes'?<Dialog title={screens.find(s=>s[0]===tab)![1]} className={'scene-workspace workspace-'+tab} onClose={closeWorkspace}><p className="scene-sheet-caption">{view.phase==='playing'?'把接下来的日子安排仔细。合上这一页，回到眼前的生活。':'翻看原来的记录与责任。合上这一页，回到这段人生。'}</p><SectionNavigation screen={tab} onNavigate={screen=>navigate(screen,true)}/><label className="scene-sheet-account">查看哪一份账与安排<select value={accountId} onChange={event=>setAccountId(event.target.value)}>{!view.accounts.some(account=>account.accountId===accountId)?<option value={accountId} disabled>原账户已不可达，请重选</option>:null}{view.accounts.map(account=><option key={account.accountId} value={account.accountId}>{accountName(account.accountId)}</option>)}</select></label>{preparationReceipt?<p key="preparation-feedback" className="scene-sheet-caption" role="status"><strong>素材使用范围的准备已安排。</strong> {preparationReceipt.text}<br/><span>继续准备，已填内容仍在。授权任务仍要按约定日期完成。</span></p>:null}<div key="workspace-content" className="scene-workspace-content"><Suspense fallback={<p className="loading-panel" role="status">正在翻开这段生活…</p>}>{tab==='quarter'?<QuarterPanel {...props} initialRecordId={quarterRecordId} initialPhase="plan" onLife={()=>{setLifePane('today');setLifeSceneMode('person');setTab('life')}} onPeople={personId=>showPeople(personId??'tang-ying',true)} onDeepseek={()=>setTab('deepseek')} onCourse={()=>setTab('course')} onRelay={()=>setTab('relay')} onRoutines={()=>setTab('routines')} onStory={()=>setTab('story')} onMarket={()=>setTab('market')} guideHidden={settings.hiddenGuides.includes(view.runId)} onHideGuide={()=>saveSettings({...settings,hiddenGuides:[...new Set([...settings.hiddenGuides,view.runId])].slice(-100)})}/>:tab==='life'?<LifePanel key={view.runId} {...props} initialRecordId={lifeRecordId} initialPane={lifePane} initialPersonId={lifePerson} initialYear={lifeYear}/>:tab==='story'?<StoryPanel {...props}/>:tab==='market'?<MarketPanel key={accountId+':'+(marketRecordId??'')} {...props} initialRecordId={marketRecordId}/>:tab==='video'?<VideoPanel {...props} {...(videoTarget?{initialTarget:videoTarget}:{})} onTargetChange={selectVideoRecord}/>:tab==='course'?<CoursePanel {...props} {...(courseTarget!==undefined?{initialTarget:courseTarget}:{})} onTargetChange={selectCourseRecord} {...(courseDraftSlot?{initialDraftSlot:courseDraftSlot}:{})} {...(courseTeachingSlot?{initialTeachingSlot:courseTeachingSlot}:{})} {...(courseRecordId?{initialFocusId:courseRecordId}:{})}/>:tab==='relay'?<Suspense fallback={<p role="status">正在打开中转站…</p>}><RelayPanel {...props} {...(relayTarget!==undefined?{initialTarget:relayTarget}:{})} onTargetChange={selectRelayRecord} {...(relayDraftSlot?{initialDraftSlot:relayDraftSlot}:{})} {...(relayRecordId?{initialFocusId:relayRecordId}:{})}/></Suspense>:tab==='routines'?<Suspense fallback={<p role="status">正在载入例行计划…</p>}><RoutinesPanel {...props}/></Suspense>:tab==='deepseek'?<Suspense fallback={<p role="status">正在载入DeepSeek机会…</p>}><DeepseekPanel {...props} onPaneChange={pane=>{setDeepseekTarget(current=>({...current,pane}));setSceneReceipt(null)}} onEquityTargetChange={target=>selectEquityRecord(equityFocusFor(props,target,target.accountId))} {...(deepseekTarget.pane==='equity'&&equityTarget!==undefined?{initialEquityTarget:equityTarget}:{})} {...(ecosystemTarget?{initialBusinessId:ecosystemTarget.businessId}:{})} initialPane={deepseekTarget.pane} {...(deepseekTarget.recordId?{initialFocusId:deepseekTarget.recordId}:{})}/></Suspense>:tab==='memory'?<MemoryPanel {...props}/>:<FinancePanel key={accountId} {...props} onStorage={()=>openStorage()} onExport={()=>exportCurrent()} onBackup={()=>exportOriginal(view.runId,true)}/>}</Suspense></div></Dialog>:null}</>:<div className="entry-wrap"><Home key={entryKey} controller={controller} state={state} onStorage={()=>openStorage()} onExport={id=>exportOriginal(id)}/></div>}
 {controller?<RuntimeReadStatus controller={controller} enabled={!!view&&!modal&&!uiIntent.pending&&!state.busy&&!controller.runtimeFailed}/>:null}
 {!modal&&uiIntent.pending?<div className="runtime-feedback" role="status"><span>{uiIntent.pending.label}</span><button type="button" onClick={uiIntent.cancel}>{uiIntent.pending.kind==='record'?'先合上':'先不决定'}</button></div>:!modal&&view&&controller?.asynchronous&&state.busy?<div className="runtime-feedback" role="status">{controller.timeWait?.stopRequested?'这一步记好后，就先停下。':controller.needsUnsavedWarning?'正在把这一步记进日子…':'正在翻开这段人生…'}</div>:null}
 {!openingRoom?<footer className="site-footer">本机人生 · 模拟市场 / 明确架空股权</footer>:null}
 {modal?<Dialog footer={commandActions} title={modal.kind==='command'?modal.intent.label:modal.kind==='storage'?'本机存档与备份':modal.kind==='settings'?'显示与历史说明':modal.kind==='reload'?'重新读取前确认':'离开前处理未保存操作'} onClose={()=>setModal(null)} className={modal.kind==='command'?(modal.equityShared?'command-review equity-shared-review':'command-review'):modal.kind==='settings'?'display-journal':modal.kind==='storage'?'storage-journal':'safety-journal'}>
 {modal.kind==='command'&&confirm?<>{!videoCommission&&!courseTeaching&&!ecologyContract&&!modal.decisionFacts?<p className="command-introduction">先把代价看清，再作决定。</p>:null}{modal.decisionFacts??modal.clockFacts??<dl className={'command-facts'+(videoCommission?' video-money':courseTeaching?' course-money':'')}><div><dt>{clockCommand?'日历范围':'由谁承担'}</dt><dd>{clockCommand?'各项原安排与原账户':accountName(view&&features?intentAccount(modal.intent.command,view,features):'personal')}</dd></div><div><dt>{confirm.actionAllocations?'跨日期注意力合计':scheduledStart&&scheduledStart!==view?.date?'开工季度行动':'本季行动'}</dt><dd>{confirm.actionPoints}点{confirm.actionAllocations?<ul>{confirm.actionAllocations.map((a,n)=><li key={a.date+String(n)}>{a.date} · {a.label}{a.actionPoints}点</li>)}</ul>:null}</dd></div><div><dt>{money?.label}</dt><dd>{moneyText(money?.amountFen??null)}</dd></div>{confirm.receivedPrepaymentFen!==undefined?<><div><dt>{modal.intent.command.kind==='RechargeRelayCustomer'?'收到客户充值':modal.intent.command.kind==='AcceptEcoContract'?'收到客户预款':'收到学员预款'}</dt><dd>{moneyText(confirm.receivedPrepaymentFen)}</dd></div><div><dt>新增客户保护</dt><dd>{moneyText(confirm.protectedIncreaseFen)}</dd></div><div><dt>{modal.intent.command.kind==='RechargeRelayCustomer'?'本次充值新增服务收入':modal.intent.command.kind==='AcceptEcoContract'?'本次预款新增服务收入':'本次报名新增课程收入'}</dt><dd>¥0 · {modal.intent.command.kind==='RechargeRelayCustomer'?'实际用量与支持交付后才确认':modal.intent.command.kind==='AcceptEcoContract'?'客户验收与实际支持后才确认':'完成教学阶段后才确认'}</dd></div></>:null}{confirm.releasedFen>0?<div><dt>原占款释放</dt><dd>{moneyText(confirm.releasedFen)}</dd></div>:null}{(confirm.accruedServiceFeeFen??0)>0?<div><dt>本主体原已用未出账服务费结算</dt><dd>{moneyText(confirm.accruedServiceFeeFen)} · 非新增服务承诺</dd></div>:null}{courseTeaching&&scheduledStart&&!combinedScheduledDate?<div><dt>当前日期 → 已选开工日期</dt><dd>{view?.date} → {scheduledStart}</dd></div>:<><div><dt>{combinedScheduledDate?(videoCommission?'接单与开工日期':'安排与开工日期'):'当前日期'}</dt><dd>{view?.date}</dd></div>{scheduledStart&&!combinedScheduledDate?<div><dt>已选开工日期</dt><dd>{scheduledStart}</dd></div>:null}</>}</dl>}{modal.decisionFacts&&(modal.intent.command.kind==='SignEquityAgreement'||modal.intent.command.kind==='DeclineEquityTerms'||modal.intent.command.kind==='AcceptEquityExit'&&confirm.privateSale)?<details className="equity-original-confirmation"><summary>{modal.intent.command.kind==='SignEquityAgreement'?'完整签署说明':modal.intent.command.kind==='DeclineEquityTerms'?'完整放下说明':'完整转让说明'}</summary>{modal.details}</details>:modal.details}{ecologyContract?<p className="command-introduction">先把代价看清，再作决定。</p>:null}{pendingSubmission?.commandId===modal.intent.command.commandId?<p role="status">正在记下这一步，请稍候。</p>:null}{!confirm.allowed?<p role="alert" className="error-box">{reasonText(confirm.reasonCodes[0]??'STALE_REVISION')}</p>:null}</>:null}
 {modal.kind==='storage'&&controller?<StoragePanel controller={controller} initialText={modal.text} kind={modal.source} onDone={()=>setModal(current=>current===modal?null:current)}/>:null}
 {modal.kind==='settings'?<div className="stack"><label className="radio-line"><input type="checkbox" checked={settings.textOnly} onChange={event=>saveSettings({...settings,textOnly:event.target.checked})}/>文本模式，简化场景装饰</label><label className="radio-line"><input type="checkbox" checked={settings.reducedMotion} onChange={event=>saveSettings({...settings,reducedMotion:event.target.checked})}/>减少动态效果</label>{settingsNotice?<p role="status">{settingsNotice}</p>:null}<p>真实历史节点标注日期与来源；股票名称和价格为明确模拟。DeepSeek直接股权只会在有资格与对方融资意愿的明确架空条件下提供，本体验没有现实申购入口。</p><p>显示、阅读、收藏和动画不会改变随机结果。切换设置也不会增加钱或行动。</p><p>存档只在本机；浏览器可能清理数据，请手动导出备份。导出的完整档可能包含私人备注与隐藏事实，请妥善保管。</p></div>:null}
 {modal.kind==='exit'?<><p>{uncertainRuntime?'这次操作已中断，保存到了哪里还需要核对。已有候选可先导出；重新读取不会重做原操作。':'离开将丢失尚未保存的候选。旧提交仍完整；建议先导出候选或重试保存。'}</p><div className="button-row"><button type="button" onClick={()=>setModal(null)}>留在当前人生</button><button type="button" onClick={()=>exportCurrent(true)}>先导出未保存候选</button><button type="button" className="danger" onClick={()=>{void controller?.home(true).then(()=>setModal(null)).catch(fail)}}>{uncertainRuntime?'放下这次操作，返回入口核对':'明确舍弃候选并返回入口'}</button></div></>:null}
 {modal.kind==='reload'?<><p>会舍弃当前尚未保存的候选，并读取本机最新的完整提交。此操作不能把候选合并进另一版本；可先导出保留。</p><div className="button-row"><button type="button" onClick={()=>setModal(null)}>返回</button><button type="button" onClick={()=>exportCurrent(true)}>先导出候选</button><button type="button" className="danger" onClick={()=>{void controller?.reload(true).then(()=>setModal(null)).catch(fail)}}>确认舍弃并重新读取</button></div></>:null}
 </Dialog>:null}</div>
}
