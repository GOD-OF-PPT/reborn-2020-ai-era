import {beforeAll,expect,it,vi} from 'vitest'
import {createInitialRun} from '../application/bootstrap.ts'
import {BOOTSTRAP_VERSIONS} from '../content/bootstrap.ts'
import {createBaseRegistry,evaluateCommand} from '../core/commands.ts'
import {canonicalJson} from '../core/identity.ts'
import type {GameRun} from '../core/run-types.ts'
import {RunCodec} from './codec.ts'

// Original kernel commands and the complete codec validator. The small
// bootstrap history measures access growth, not normal economics or wall time.
const registry=createBaseRegistry(BOOTSTRAP_VERSIONS),codec=new RunCodec(registry,['technical_employee'])
let history:GameRun
beforeAll(()=>{
 history=createInitialRun({runId:'codec-cause-index',actorId:'player',commandId:'create',seed:'cause-index-fixed',backgroundId:'technical_employee'})
 for(let n=0;n<80;n++){
  const result=evaluateCommand(history,{runId:history.runId,actorId:history.actorId,commandId:'note-'+n,expectedRevision:history.revision,kind:'SetPrivateNote',payload:{text:'note '+n}},registry,'player')
  if(result.status!=='proposed')throw Error('ORIGINAL_NOTE_COMMAND_REQUIRED')
  history=result.nextRun
 }
})

it('checks every command-to-cause association without rescanning the complete cause list for each claim',()=>{
 let visits=0
 const original=Array.prototype.some,spy=vi.spyOn(Array.prototype,'some').mockImplementation(function(this:unknown[],callback:(value:unknown,index:number,array:unknown[])=>unknown,thisArg?:unknown):boolean{
  const first=this[0] as {id?:unknown}|undefined
  if(this.length===history.causes.length&&first?.id===history.causes[0]!.id){
   return Reflect.apply(original,this,[(...args:unknown[])=>{visits++;return Reflect.apply(callback,thisArg,args)},thisArg]) as boolean
  }
  return Reflect.apply(original,this,[callback,thisArg]) as boolean
 })
 try{expect(canonicalJson(codec.validateRun(history))).toBe(canonicalJson(history))}finally{spy.mockRestore()}
 expect(visits).toBeLessThanOrEqual(history.causes.length*4)
})

it('rejects an existing cause borrowed from another actual command',()=>{
 const run=structuredClone(history),last=run.receipts.at(-1)!
 Object.assign(last,{causeIds:[run.causes[0]!.id]})
 expect(()=>codec.validateRun(run)).toThrow('INVALID_CAUSE_REFERENCE')
})

it('rebuilds associations when the same caller object is changed after a successful validation',()=>{
 const run=structuredClone(history);codec.validateRun(run)
 Object.assign(run.causes.at(-1)!,{commandId:run.receipts[0]!.commandId})
 expect(()=>codec.validateRun(run)).toThrow('INVALID_CAUSE_REFERENCE')
})

it('keeps the original missing and duplicate-cause guards and error code',()=>{
 const missing=structuredClone(history);Object.assign(missing,{causes:missing.causes.slice(1)})
 expect(()=>codec.validateRun(missing)).toThrow('INVALID_CAUSE_REFERENCE')
 const duplicate=structuredClone(history);Object.assign(duplicate,{causes:[...duplicate.causes,{...duplicate.causes[0]!}]})
 expect(()=>codec.validateRun(duplicate)).toThrow('INVALID_CAUSE_REFERENCE')
})

it('preserves original repeated claims and whole canonical save bytes without changing any effects',()=>{
 const run=structuredClone(history),last=run.receipts.at(-1)!
 Object.assign(last,{causeIds:[...last.causeIds,...last.causeIds]})
 expect(codec.validateRun(run)).toEqual(run)
 const wire=codec.export(run)
 expect(codec.export(codec.import(wire))).toBe(wire)
 expect(run.random).toEqual(history.random)
 expect(run.economy).toEqual(history.economy)
})
