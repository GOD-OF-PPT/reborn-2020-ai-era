import type {SaveStatus} from '../application/session.ts'
import type {OpeningFocus} from './player-thread.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {isEcosystemSceneTarget,ecosystemTargetEntity} from './ecosystem-scene-target.ts'
import {isEquitySceneTarget,equityTargetEntity} from './equity-scene-target.ts'

export const SEASON_FOCUS_PREFERENCE_VERSION=1 as const
export const SEASON_FOCUS_PREFERENCE_MAX_TEXT_LENGTH=16_384
export interface SeasonFocusPreference {readonly version:1;readonly runId:string;readonly quarter:string;readonly focus:OpeningFocus}
export interface SeasonFocusPreferenceStorage {getItem(key:string):string|null;setItem(key:string,value:string):void}
export interface SeasonFocusPreferenceScope {readonly runId:string;readonly quarter:string}
export interface SeasonFocusPreferenceGate extends SeasonFocusPreferenceScope {readonly saveStatus:SaveStatus;readonly hasCandidate:boolean;readonly busy:boolean}
export type SeasonFocusPreferenceInvalidReason='invalid-scope'|'too-large'|'invalid-json'|'invalid-record'|'unsupported-version'|'unsupported-focus-kind'|'run-mismatch'|'future-quarter'
export type LoadSeasonFocusPreferenceResult=
 |{readonly status:'missing';readonly reason:'missing';readonly message:string;readonly raw:null}
 |{readonly status:'loaded';readonly reason:'current-quarter'|'previous-quarter';readonly message:string;readonly raw:string;readonly record:SeasonFocusPreference;readonly quarterStatus:'current'|'previous'}
 |{readonly status:'invalid';readonly reason:SeasonFocusPreferenceInvalidReason;readonly message:string;readonly raw:string|null}
 |{readonly status:'unavailable';readonly reason:'read-failed';readonly message:string;readonly raw:null}
export type SaveSeasonFocusPreferenceResult=
 |{readonly status:'saved';readonly reason:'saved';readonly message:string;readonly record:SeasonFocusPreference}
 |{readonly status:'blocked';readonly reason:'candidate'|'busy'|'saving'|'unsaved'|'conflict'|'closed'|'scope-mismatch';readonly message:string}
 |{readonly status:'invalid';readonly reason:SeasonFocusPreferenceInvalidReason;readonly message:string}
 |{readonly status:'unavailable';readonly reason:'read-failed'|'write-failed';readonly message:string}
 |{readonly status:'preserved';readonly reason:SeasonFocusPreferenceInvalidReason;readonly message:string;readonly raw:string|null}

type RecordValue=Record<string,unknown>
type Parsed={record:SeasonFocusPreference}|{reason:SeasonFocusPreferenceInvalidReason}
const personSelections=new Set(['tang-ying','linzhou','xu-cheng','chen-yu','rest','workspace'])
const marketKinds=new Set(['order','settlement','position','research'])
const focusKinds=new Set(['first-order','work','free','market','life','video','course','relay','ecosystem','equity'])
const messages:Record<SeasonFocusPreferenceInvalidReason,string>={
 'invalid-scope':'当前关注上下文不完整，未读取或记下本机关注。',
 'too-large':'本机关注记录过长，未采用；原文保留，可在本窗口重新选择。',
 'invalid-json':'本机关注记录无法解析；原文保留，可在本窗口重新选择。',
 'invalid-record':'本机关注的字段或对象身份不完整；原文保留，可在本窗口重新选择。',
 'unsupported-version':'本机关注使用了不支持的UI版本；原文保留，可在本窗口重新选择。',
 'unsupported-focus-kind':'本机关注使用了尚不支持的对象种类；原文保留，可在本窗口重新选择。',
 'run-mismatch':'这份关注不属于当前人生，未替换当前对象；原文保留。',
 'future-quarter':'这份关注来自尚未到达的季度，未采用；原文保留，可在本窗口重新选择。',
}
const id=(value:unknown):value is string=>typeof value==='string'&&value.length>0&&value.length<=512&&value.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(value)
const quarter=(value:unknown):value is string=>typeof value==='string'&&/^202[0-5]-Q[1-4]$/.test(value)
const quarterIndex=(value:string)=>Number(value.slice(0,4))*4+Number(value.slice(-1))
function object(value:unknown):RecordValue|null{
 if(value===null||typeof value!=='object'||Array.isArray(value))return null
 const prototype=Object.getPrototypeOf(value)
 if(prototype!==Object.prototype&&prototype!==null)return null
 if(Object.values(Object.getOwnPropertyDescriptors(value)).some(d=>d.get!==undefined||d.set!==undefined))return null
 return value as RecordValue
}
const exactKeys=(value:RecordValue,allowed:readonly string[],required:readonly string[])=>Object.keys(value).every(key=>allowed.includes(key))&&required.every(key=>Object.hasOwn(value,key))
function parseFocus(value:unknown):{focus:OpeningFocus}|{reason:SeasonFocusPreferenceInvalidReason}{
 const f=object(value)
 if(!f||typeof f.kind!=='string')return {reason:'invalid-record'}
 if(!focusKinds.has(f.kind))return {reason:'unsupported-focus-kind'}
 const common=['kind','runId','accountId','entityId','businessId'],allowed=f.kind==='market'?[...common,'entityKind']:f.kind==='life'?[...common,'selection']:f.kind==='video'?[...common,'videoTarget']:f.kind==='course'?[...common,'courseTarget']:f.kind==='relay'?[...common,'relayTarget']:f.kind==='ecosystem'?[...common,'ecosystemTarget']:f.kind==='equity'?[...common,'equityTarget']:common
 if(!exactKeys(f,allowed,['kind','runId','accountId','entityId'])||!id(f.runId)||!id(f.accountId)||f.entityId!==null&&!id(f.entityId)||f.businessId!==undefined&&!id(f.businessId))return {reason:'invalid-record'}
 const identity={runId:f.runId,accountId:f.accountId,entityId:f.entityId as string|null,...(f.businessId!==undefined?{businessId:f.businessId as string}:{})}
 if(f.kind==='equity'){
  const t=f.equityTarget
  if(t===null)return f.entityId===null&&f.accountId==='personal'&&f.businessId===undefined?{focus:{...identity,kind:'equity',equityTarget:null}}:{reason:'invalid-record'}
  if(!isEquitySceneTarget(t)||t.runId!==f.runId||t.accountId!==f.accountId||t.businessId!==f.businessId||equityTargetEntity(t)!==f.entityId)return {reason:'invalid-record'}
  return {focus:{...identity,kind:'equity',equityTarget:{...t}}}
 }
 if(f.kind==='ecosystem'){
  const t=f.ecosystemTarget
  if(t===null)return f.entityId===null&&f.accountId==='personal'&&f.businessId===undefined?{focus:{...identity,kind:'ecosystem',ecosystemTarget:null}}:{reason:'invalid-record'}
  if(!isEcosystemSceneTarget(t)||t.runId!==f.runId||t.accountId!==f.accountId||t.businessId!==f.businessId||ecosystemTargetEntity(t)!==f.entityId)return {reason:'invalid-record'}
  return {focus:{...identity,kind:'ecosystem',ecosystemTarget:{...t}}}
 }
 if(f.kind==='relay'){
  if(f.relayTarget===null)return f.entityId===null&&f.accountId==='personal'&&f.businessId===undefined?{focus:{...identity,kind:'relay',relayTarget:null}}:{reason:'invalid-record'}
  const t=object(f.relayTarget),base=['kind','runId','accountId','businessId','stationId']
  if(!t||!['business','application','audience','customer','period'].includes(String(t.kind))||t.runId!==f.runId||t.accountId!==f.accountId||t.businessId!==f.businessId)return {reason:'invalid-record'}
  const keys=t.kind==='business'?base:t.kind==='application'?[...base,'applicationId']:t.kind==='audience'?[...base,'audienceId']:t.kind==='customer'?[...base,'customerId']:[...base,'periodId','jobId','meterId']
  const required=t.kind==='business'?base:t.kind==='application'?[...base,'applicationId']:t.kind==='audience'?[...base,'audienceId']:t.kind==='customer'?[...base,'customerId']:[...base,'periodId']
  if(!exactKeys(t,keys,required)||!Object.values(t).every(id)||t.jobId!==undefined&&t.meterId!==undefined)return {reason:'invalid-record'}
  const ids=Object.entries(t).filter(([key])=>!['kind','runId','accountId'].includes(key)).map(([,value])=>value)
  const entity=t.meterId??t.jobId??t.periodId??t.customerId??t.audienceId??t.applicationId??t.businessId
  if(new Set(ids).size!==ids.length||f.entityId!==entity)return {reason:'invalid-record'}
  return {focus:{...identity,kind:'relay',relayTarget:{...t} as unknown as RelaySceneTarget}}
 }
 if(f.kind==='course'){
  if(f.courseTarget===null)return f.entityId===null&&f.accountId==='personal'&&f.businessId===undefined?{focus:{...identity,kind:'course',courseTarget:null}}:{reason:'invalid-record'}
  const t=object(f.courseTarget)
  if(!t||!['studio','outline','license','course','audience','cohort'].includes(String(t.kind))||!id(t.businessId)||t.businessId!==f.businessId)return {reason:'invalid-record'}
  const allowed=t.kind==='studio'?['kind','businessId']:t.kind==='outline'?['kind','businessId','outlineId']:t.kind==='license'?['kind','businessId','licenseId']:t.kind==='audience'?['kind','businessId','courseId','audienceId']:t.kind==='cohort'?['kind','businessId','courseId','cohortId','jobId']:['kind','businessId','courseId','sampleJobId']
  const required=t.kind==='studio'?['kind','businessId']:t.kind==='outline'?['kind','businessId','outlineId']:t.kind==='license'?['kind','businessId','licenseId']:t.kind==='audience'?['kind','businessId','courseId','audienceId']:t.kind==='cohort'?['kind','businessId','courseId','cohortId']:['kind','businessId','courseId']
  if(!exactKeys(t,allowed,required))return {reason:'invalid-record'}
  for(const key of ['outlineId','licenseId','courseId','sampleJobId','audienceId','cohortId','jobId'])if(t[key]!==undefined&&!id(t[key]))return {reason:'invalid-record'}
  const values=[t.businessId,t.outlineId,t.licenseId,t.courseId,t.sampleJobId,t.audienceId,t.cohortId,t.jobId].filter(x=>x!==undefined)
  if(new Set(values).size!==values.length||f.entityId!==(t.jobId??t.cohortId??t.audienceId??t.sampleJobId??t.courseId??t.licenseId??t.outlineId??t.businessId))return {reason:'invalid-record'}
  return {focus:{...identity,kind:'course',courseTarget:{...t} as unknown as CourseSceneTarget}}
 }
 if(f.kind==='video'){
  if(f.videoTarget===null)return f.entityId===null&&f.accountId==='personal'&&f.businessId===undefined?{focus:{...identity,kind:'video',videoTarget:null}}:{reason:'invalid-record'}
  const t=object(f.videoTarget)
  if(!t||!exactKeys(t,['channelId','workId','contractId','marketingId','section'],['channelId'])||!id(t.channelId)||!id(f.businessId))return {reason:'invalid-record'}
  for(const key of ['workId','contractId','marketingId'] as const)if(t[key]!==undefined&&!id(t[key]))return {reason:'invalid-record'}
  if(t.contractId!==undefined&&t.workId===undefined)return {reason:'invalid-record'}
  if(t.section!==undefined&&!['publications','leads','making'].includes(String(t.section))||t.marketingId!==undefined&&(t.workId!==undefined||t.contractId!==undefined||t.section!==undefined)||t.section!==undefined&&t.section!=='publications'&&(t.workId!==undefined||t.contractId!==undefined)||t.section==='publications'&&t.workId===undefined)return {reason:'invalid-record'}
  if(f.entityId!==(t.contractId??t.workId??t.marketingId??t.channelId))return {reason:'invalid-record'}
  const ids=[t.channelId,t.workId,t.contractId,t.marketingId].filter(x=>x!==undefined);if(new Set(ids).size!==ids.length)return {reason:'invalid-record'}
  return {focus:{...identity,kind:'video',videoTarget:{...t} as unknown as VideoSceneTarget}}
 }
 if(f.kind==='life')return typeof f.selection==='string'&&personSelections.has(f.selection)?{focus:{...identity,kind:'life',selection:f.selection as Extract<OpeningFocus,{kind:'life'}>['selection']}}:{reason:'invalid-record'}
 if(f.kind==='market'){
  if(f.entityKind!==undefined&&(typeof f.entityKind!=='string'||!marketKinds.has(f.entityKind)))return {reason:'invalid-record'}
  return {focus:{...identity,kind:'market',...(f.entityKind!==undefined?{entityKind:f.entityKind as NonNullable<Extract<OpeningFocus,{kind:'market'}>['entityKind']>}:{})}}
 }
 return {focus:{...identity,kind:f.kind as 'first-order'|'work'|'free'}}
}
function parseRecord(value:unknown,scope:SeasonFocusPreferenceScope):Parsed{
 try{
  const r=object(value)
  if(!r||!exactKeys(r,['version','runId','quarter','focus'],['version','runId','quarter','focus']))return {reason:'invalid-record'}
  if(r.version!==SEASON_FOCUS_PREFERENCE_VERSION)return {reason:'unsupported-version'}
  if(!id(r.runId)||!quarter(r.quarter))return {reason:'invalid-record'}
  const parsed=parseFocus(r.focus)
  if('reason'in parsed)return parsed
  if(r.runId!==scope.runId||parsed.focus.runId!==r.runId)return {reason:'run-mismatch'}
  if(quarterIndex(r.quarter)>quarterIndex(scope.quarter))return {reason:'future-quarter'}
  return {record:{version:1,runId:r.runId,quarter:r.quarter,focus:parsed.focus}}
 }catch{return {reason:'invalid-record'}}
}

/** This key is UI-only; no game store, receipt or controller is involved. */
export function seasonFocusPreferenceKey(runId:string):string{return 'reborn-2020-season-focus-v1:'+encodeURIComponent(runId)}

/** Loading never deletes or rewrites untrusted text. Public object matching belongs to playerThread. */
export function loadSeasonFocusPreference(storage:SeasonFocusPreferenceStorage,scope:SeasonFocusPreferenceScope):LoadSeasonFocusPreferenceResult{
 if(!id(scope.runId)||!quarter(scope.quarter))return {status:'invalid',reason:'invalid-scope',message:messages['invalid-scope'],raw:null}
 let raw:string|null
 try{raw=storage.getItem(seasonFocusPreferenceKey(scope.runId))}catch{return {status:'unavailable',reason:'read-failed',message:'未能读取本机关注；当前游戏存档未改变，可以在本窗口选择关注。',raw:null}}
 if(raw===null)return {status:'missing',reason:'missing',message:'本机尚未记下这段人生的关注。',raw:null}
 if(typeof raw!=='string')return {status:'invalid',reason:'invalid-record',message:messages['invalid-record'],raw:null}
 if(raw.length>SEASON_FOCUS_PREFERENCE_MAX_TEXT_LENGTH)return {status:'invalid',reason:'too-large',message:messages['too-large'],raw}
 let value:unknown
 try{value=JSON.parse(raw)}catch{return {status:'invalid',reason:'invalid-json',message:messages['invalid-json'],raw}}
 const parsed=parseRecord(value,scope)
 if('reason'in parsed)return {status:'invalid',reason:parsed.reason,message:messages[parsed.reason],raw}
 const previous=parsed.record.quarter!==scope.quarter
 return {status:'loaded',reason:previous?'previous-quarter':'current-quarter',message:previous?`这份关注来自${parsed.record.quarter}，当前是${scope.quarter}；可明确回看或继续原对象，不会自动改成本季关注。`:'已读出本局本季关注；仍须核对当前公开对象。',raw,record:parsed.record,quarterStatus:previous?'previous':'current'}
}

/** A stable read-only run may remember a UI preference; it gains no game write authority. */
export function saveSeasonFocusPreference(storage:SeasonFocusPreferenceStorage,record:SeasonFocusPreference,gate:SeasonFocusPreferenceGate):SaveSeasonFocusPreferenceResult{
 if(gate.saveStatus==='closed')return {status:'blocked',reason:'closed',message:'当前人生已关闭，未记下新的关注。'}
 if(gate.hasCandidate)return {status:'blocked',reason:'candidate',message:'原操作还有未保存候选，未调整本机关注；请先处理原候选。'}
 if(gate.busy)return {status:'blocked',reason:'busy',message:'正在处理原操作，未记下新的关注。'}
 if(gate.saveStatus!=='saved'&&gate.saveStatus!=='read_only')return {status:'blocked',reason:gate.saveStatus,message:'当前游戏操作尚未完成保存或存在冲突，未记下新的关注。'}
 if(!id(gate.runId)||!quarter(gate.quarter))return {status:'invalid',reason:'invalid-scope',message:messages['invalid-scope']}
 const parsed=parseRecord(record,gate)
 if('reason'in parsed)return {status:'invalid',reason:parsed.reason,message:messages[parsed.reason]}
 if(parsed.record.quarter!==gate.quarter)return {status:'blocked',reason:'scope-mismatch',message:'继续旧季度对象需要明确选择为本季关注；没有改写旧季度标识。'}
 const existing=loadSeasonFocusPreference(storage,gate)
 if(existing.status==='unavailable')return {status:'unavailable',reason:'read-failed',message:'未能读取原本机关注，未覆盖原记录；当前选择只在本窗口生效。'}
 if(existing.status==='invalid')return {status:'preserved',reason:existing.reason,message:existing.message+' 当前选择只在本窗口生效，旧原文没有被覆盖。',raw:existing.raw}
 let text:string
 try{text=JSON.stringify(parsed.record)}catch{return {status:'invalid',reason:'invalid-record',message:messages['invalid-record']}}
 if(text.length>SEASON_FOCUS_PREFERENCE_MAX_TEXT_LENGTH)return {status:'invalid',reason:'too-large',message:messages['too-large']}
 try{storage.setItem(seasonFocusPreferenceKey(gate.runId),text)}catch{return {status:'unavailable',reason:'write-failed',message:'关注只在本窗口生效，未能记到本机；游戏的保存状态未改变。'}}
 return {status:'saved',reason:'saved',message:gate.saveStatus==='read_only'?'本机关注偏好已记下；当前人生仍只读。':'本机关注偏好已记下；它不改变游戏存档。',record:parsed.record}
}
