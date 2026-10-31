import {assertJsonInput,inspectJsonInput,copyJson} from '../core/json-input.ts'
import {canonicalJson} from '../core/identity.ts'
import {hashValue} from '../core/hash.ts'
import {requireRule} from '../core/errors.ts'
import type {CommandEnvelope,CommandReceipt,GameRun,ProposedRun} from '../core/run-types.ts'
import {MAX_LOGICAL_SAVE_NODES} from './save-limits.ts'

export const MAX_WAIT_CHECKPOINT_STEPS=8
export interface WaitCheckpoint {
 readonly baseRun:GameRun
 readonly previousRun:GameRun
 readonly proposal:ProposedRun
 readonly commands:readonly CommandEnvelope[]
}

const same=(a:unknown,b:unknown)=>canonicalJson(a)===canonicalJson(b)
const prefix=(old:readonly unknown[],next:readonly unknown[])=>old.length<=next.length&&old.every((row,index)=>same(row,next[index]))
function own(value:unknown,key:string):unknown{
 requireRule(value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value)),'INVALID_WAIT_CHECKPOINT')
 const descriptor=Object.getOwnPropertyDescriptor(value,key)
 requireRule(descriptor&&Object.hasOwn(descriptor,'value'),'INVALID_WAIT_CHECKPOINT')
 return descriptor.value
}

/** Capture only original logical time envelopes; never a new rule or arbitrary revision jump. */
export function captureWaitCheckpoint(input:WaitCheckpoint){
 const baseRun=own(input,'baseRun') as GameRun,previousRun=own(input,'previousRun') as GameRun,proposal=own(input,'proposal') as ProposedRun,rawCommands=own(input,'commands')
 assertJsonInput(rawCommands);requireRule(Array.isArray(rawCommands)&&rawCommands.length>=1&&rawCommands.length<=MAX_WAIT_CHECKPOINT_STEPS,'INVALID_WAIT_CHECKPOINT')
 const commands=copyJson(rawCommands) as CommandEnvelope[]
 const nextRun=own(proposal,'nextRun') as GameRun,receipt=own(proposal,'receipt') as CommandReceipt,previousRevision=own(proposal,'previousRevision')
 // Each history is a save-domain value. The small command payload budget
 // above still applies to envelopes, independently of the existing save cap.
 for(const run of [baseRun,previousRun,nextRun])inspectJsonInput(run,MAX_LOGICAL_SAVE_NODES)
 requireRule(own(proposal,'status')==='proposed','INVALID_WAIT_CHECKPOINT')
 const identity=(run:GameRun)=>[run.runId,run.actorId,run.personalAccountId,run.backgroundId,run.origin,run.seed,run.playerProfile,run.versions]
 requireRule(same(identity(baseRun),identity(previousRun))&&same(identity(baseRun),identity(nextRun)),'WAIT_CHECKPOINT_SOURCE_MISMATCH')
 requireRule(baseRun.phase==='playing'&&nextRun.revision===baseRun.revision+commands.length&&previousRun.revision===nextRun.revision-1&&previousRevision===previousRun.revision,'INVALID_WAIT_CHECKPOINT')
 requireRule(nextRun.receipts.length===baseRun.receipts.length+commands.length&&previousRun.receipts.length===nextRun.receipts.length-1&&prefix(baseRun.receipts,nextRun.receipts)&&prefix(previousRun.receipts,nextRun.receipts)&&prefix(baseRun.causes,previousRun.causes)&&prefix(previousRun.causes,nextRun.causes),'WAIT_CHECKPOINT_PREFIX_MISMATCH')
 if(commands.length===1)requireRule(same(baseRun,previousRun),'WAIT_CHECKPOINT_PREFIX_MISMATCH')
 let date=baseRun.timeline.cursor.date
 const ids=new Set<string>(),receipts=nextRun.receipts.slice(baseRun.receipts.length)
 for(const [index,command]of commands.entries()){
  const row=receipts[index]!,payload=command.payload
  requireRule(!ids.has(command.commandId)&&command.kind==='AdvanceTime'&&command.runId===baseRun.runId&&command.actorId===baseRun.actorId&&command.expectedRevision===baseRun.revision+index,'WAIT_CHECKPOINT_SOURCE_MISMATCH')
  requireRule(payload!==null&&typeof payload==='object'&&!Array.isArray(payload)&&Object.keys(payload).every(key=>key==='date'||key==='phase')&&'date'in payload&&typeof payload.date==='string'&&(!('phase'in payload)||payload.phase==='snapshot'),'INVALID_WAIT_CHECKPOINT')
  requireRule(row.commandId===command.commandId&&row.kind==='AdvanceTime'&&row.actorId===command.actorId&&row.runId===command.runId&&row.revisionBefore===command.expectedRevision&&row.revisionAfter===command.expectedRevision+1&&row.date>=date&&row.date<=payload.date,'INVALID_WAIT_CHECKPOINT')
  const signature=JSON.parse(row.payloadSignature) as unknown
  requireRule(same(signature,{runId:command.runId,actorId:command.actorId,kind:'AdvanceTime',payload:{date:payload.date,phase:'snapshot'}}),'WAIT_CHECKPOINT_SOURCE_MISMATCH')
  ids.add(command.commandId);date=row.date
 }
 requireRule(same(nextRun.receipts.at(-1),receipt)&&date===nextRun.timeline.cursor.date,'INVALID_WAIT_CHECKPOINT')
 return {baseRun,previousRun,nextRun,receipt,commands,receipts,baseRevision:baseRun.revision,baseHash:hashValue(baseRun),count:commands.length}
}

export function checkpointBaseMatches(run:GameRun,hash:string):boolean{return hashValue(run)===hash}
