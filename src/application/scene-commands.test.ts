import {expect,it} from 'vitest'
import type {GameRun} from '../core/run-types.ts'
import {projectSceneCommands} from './scene-commands.ts'
import raw from '../../goal-1/evidence/t17-acceptance-38/chrome-art-isolated-r25/u5-r25-03-actual-physical75-after-settings.json?raw'

// A preserved real normal Chrome export, not a synthesized successful command history.
const run:GameRun=JSON.parse(raw).state
const accepted=run.receipts.find(r=>r.kind==='AcceptEcoContract')!
const input=(receipts:GameRun['receipts'])=>({runId:run.runId,revision:run.revision,receipts})

it('publishes exact committed object identifiers from the actual acceptance and submission without time or raw payloads',()=>{
 const result=projectSceneCommands(run),a=result.commands.find(c=>c.commandId===accepted.commandId)!
 const original=JSON.parse(accepted.payloadSignature)
 expect(result).toMatchObject({version:1,runId:run.runId,committedRevision:75})
 expect(a).toEqual({commandId:accepted.commandId,kind:accepted.kind,date:accepted.date,revisionAfter:accepted.revisionAfter,identifiers:{leadId:original.payload.leadId}})
 const submit=run.receipts.find(r=>r.kind==='SubmitEcoDelivery')!
 expect(result.commands.find(c=>c.commandId===submit.commandId)?.identifiers).toEqual({contractId:JSON.parse(submit.payloadSignature).payload.contractId})
 expect(result.commands.some(c=>['AdvanceTime','CreateRun','ChooseEvent','WorkQuarter'].includes(c.kind))).toBe(false)
 expect(JSON.stringify(result)).not.toMatch(/payloadSignature|resources|startAt|scope|capitalFen|amountFen|random|reviewFactId/)
})

it('reads no world, queue, random, notes or hidden outcome and returns detached identifiers',()=>{
 const original=JSON.parse(accepted.payloadSignature)
 const payload={...original.payload,privateNotes:'PRIVATE_CANARY',approved:'UNREAD_CANARY',actualUnits:76543,random:'RANDOM_CANARY',secret:{id:'NESTED_CANARY'}}
 const receipt={...accepted,payloadSignature:JSON.stringify({...original,payload})}
 const minimal=input([receipt]),before=JSON.stringify(minimal)
 Object.defineProperties(minimal,{timeline:{get(){throw Error('NO_QUEUE_READ')}},random:{get(){throw Error('NO_RANDOM_READ')}},world:{get(){throw Error('NO_WORLD_READ')}}})
 const result=projectSceneCommands(minimal)
 expect(result.commands).toHaveLength(1)
 expect(JSON.stringify(result)).not.toMatch(/CANARY|76543|secret|actualUnits/)
 expect(JSON.stringify(minimal)).toBe(before)
 expect(result.commands[0]!.identifiers).not.toBe(payload)
 expect(projectSceneCommands(minimal)).toEqual(result)
})

it('leaves malformed, foreign, future and mismatched source signatures unknown',()=>{
 const original=JSON.parse(accepted.payloadSignature)
 const bad=[
  {...accepted,payloadSignature:'{'},
  {...accepted,runId:'foreign'},
  {...accepted,revisionAfter:run.revision+1},
  {...accepted,revisionAfter:0},
  {...accepted,payloadSignature:JSON.stringify({...original,runId:'foreign'})},
  {...accepted,payloadSignature:JSON.stringify({...original,actorId:'foreign'})},
  {...accepted,payloadSignature:JSON.stringify({...original,kind:'CancelEcoContract'})},
  {...accepted,payloadSignature:JSON.stringify({...original,payload:[]})},
  {...accepted,payloadSignature:'null'},
 ]
 for(const receipt of bad)expect(projectSceneCommands(input([receipt])).commands).toEqual([])
})

it('does not reinterpret nested values, numbers, blank strings or control characters as object IDs',()=>{
 const original=JSON.parse(accepted.payloadSignature)
 for(const leadId of [{id:'other'},['other'],null,17,'','  ','bad\u0000id','x'.repeat(513)]){
  const receipt={...accepted,payloadSignature:JSON.stringify({...original,payload:{leadId}})}
  expect(projectSceneCommands(input([receipt])).commands[0]?.identifiers).toEqual({})
 }
})
