import {MAX_ENCODED_SAVE_BYTES} from '../persistence/save-limits.ts'
import {record,validCounter,type RuntimeMethod} from './runtime-protocol.ts'
import type {GameSnapshot} from './game-snapshot.ts'

const codes=(value:unknown)=>Array.isArray(value)&&value.every(code=>typeof code==='string')
export function publicViewHeader(value:unknown):boolean{
 if(!record(value)||typeof value.runId!=='string'||!validCounter(value.revision)||value.revision<1||typeof value.date!=='string'||!Array.isArray(value.accounts)||!Array.isArray(value.receipts)||!record(value.budget)||!record(value.features))return false
 return typeof value.busy==='boolean'&&typeof value.readOnly==='boolean'&&typeof value.hasCandidate==='boolean'&&typeof value.saveStatus==='string'&&['available','reserved','spent','total'].every(key=>validCounter((value.budget as Record<string,unknown>)[key]))
}
/** Fast public DTO guards. Domain/state validation stays in the Worker codec. */
export function runtimeResultValid(method:RuntimeMethod,value:unknown,state:GameSnapshot,commandId?:string):boolean{
 if(method==='boot')return record(value)&&Object.hasOwn(value,'diagnostics')
 if(['exportSaved','exportCandidate','exportStored'].includes(method))return typeof value==='string'&&value.length<=MAX_ENCODED_SAVE_BYTES
 if(method==='preview')return record(value)&&typeof value.allowed==='boolean'&&codes(value.reasonCodes)&&['actionPoints','upfrontCostFen','releasedFen'].every(key=>validCounter(value[key]))
 if(method==='clockCommitments')return record(value)&&value.runId===state.view?.runId&&value.sourceRevision===state.view?.revision&&typeof value.from==='string'&&typeof value.target==='string'&&Array.isArray(value.accounts)
 if(method==='inspectImport')return record(value)&&typeof value.runId==='string'&&validCounter(value.revision)&&value.revision>0&&typeof value.date==='string'&&typeof value.backgroundId==='string'&&record(value.playerProfile)&&['normal','fixture'].includes(String(value.origin))&&typeof value.alreadyExists==='boolean'
 if(method==='runRoutine')return record(value)&&validCounter(value.stepsExecuted)&&validCounter(value.commandsSaved)
 if(method==='waitForFeedback')return record(value)&&['saved','stopped','rejected','unsaved','conflict'].includes(String(value.status))&&codes(value.reasonCodes)&&Array.isArray(value.steps)&&Array.isArray(value.feedback)&&publicViewHeader(value.before)&&publicViewHeader(value.lastSaved)&&publicViewHeader(value.current)&&(value.lastBefore===null||publicViewHeader(value.lastBefore))&&(value.failed===null||record(value.failed))
 if(method==='submit'||method==='retry'){
  if(!record(value)||!['saved','duplicate','rejected','unsaved','conflict'].includes(String(value.status))||!codes(value.reasonCodes))return false
  if(value.status!=='saved'&&value.status!=='duplicate')return true
  const receipt=value.receipt
  return record(receipt)&&typeof receipt.commandId==='string'&&typeof receipt.kind==='string'&&validCounter(receipt.revisionAfter)&&receipt.revisionAfter>0&&(commandId===undefined||commandId===receipt.commandId)&&!!state.view?.receipts.some(r=>r.commandId===receipt.commandId&&r.kind===receipt.kind&&r.revisionAfter===receipt.revisionAfter)
 }
 return value===undefined
}
