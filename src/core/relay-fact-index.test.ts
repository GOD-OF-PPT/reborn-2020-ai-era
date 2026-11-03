import {beforeAll,expect,it,vi} from 'vitest'
import {replayRelayF04} from '../testing/relay-scenarios.ts'
import {assertRelay} from './relay-validation.ts'
import {assertGameRun} from './run.ts'
import type {GameRun} from './run-types.ts'

// Real fixture commands produce the meters and receipts. These direct validator
// counterexamples test lookup work and first-match semantics, not normal capital.
let sample:ReturnType<typeof replayRelayF04>,history:GameRun
beforeAll(()=>{sample=replayRelayF04();history=sample.h.run;expect(history.origin).toBe('fixture');expect(history.relay!.meters).toHaveLength(28)})
const meterFact=(run:GameRun)=>run.facts.find(f=>f.id===run.relay!.meters[0]!.factId)!

it('validates actual metering without rescanning the full fact list for every meter',()=>{
 let visits=0
 const original=Array.prototype.find,spy=vi.spyOn(Array.prototype,'find').mockImplementation(function(this:unknown[],callback:(value:unknown,index:number,array:unknown[])=>unknown,thisArg?:unknown):unknown{
  if(this===history.facts)return Reflect.apply(original,this,[(...args:unknown[])=>{visits++;return Reflect.apply(callback,thisArg,args)},thisArg])
  return Reflect.apply(original,this,[callback,thisArg])
 })
 try{expect(()=>assertRelay(sample.h.relay,history)).not.toThrow()}finally{spy.mockRestore()}
 expect(visits).toBeLessThanOrEqual(history.facts.length*6)
})

it('keeps the first valid fact when a later same-id counterexample disagrees, while full-run validation still rejects the duplicate',()=>{
 const run=structuredClone(history),fact=meterFact(run)
 Object.assign(run,{facts:[...run.facts,{...fact,sourceEventId:'later-wrong-source'}]})
 expect(()=>assertRelay(sample.h.relay,run)).not.toThrow()
 expect(()=>assertGameRun(run)).toThrow('INVALID_FACT_REFERENCE')
})

it('rejects the first conflicting fact rather than accepting a later matching duplicate',()=>{
 const run=structuredClone(history),fact=meterFact(run)
 Object.assign(run,{facts:[{...fact,sourceEventId:'first-wrong-source'},...run.facts]})
 expect(()=>assertRelay(sample.h.relay,run)).toThrow('INVALID_RELAY_METER')
})

it('rechecks facts replaced on the same caller object after an earlier successful validation',()=>{
 const run=structuredClone(history),fact=meterFact(run);assertRelay(sample.h.relay,run)
 Object.assign(run,{facts:run.facts.map(f=>f.id===fact.id?{...f,sourceEventId:'replaced-wrong-source'}:f)})
 expect(()=>assertRelay(sample.h.relay,run)).toThrow('INVALID_RELAY_METER')
})

it('retains missing-fact and frozen-meter rejection codes',()=>{
 const missing=structuredClone(history),fact=meterFact(missing)
 Object.assign(missing,{facts:missing.facts.filter(f=>f.id!==fact.id)})
 expect(()=>assertRelay(sample.h.relay,missing)).toThrow('INVALID_RELAY_METER')
 const changed=structuredClone(history),meter=changed.relay!.meters[0]!
 Object.assign(meter,{reportedUnits:meter.reportedUnits+1})
 expect(()=>assertRelay(sample.h.relay,changed)).toThrow('RELAY_FROZEN_METER_MISMATCH')
})

it('preserves the complete original fixture wire, random facts and every committed receipt',()=>{
 const before=sample.h.codec.export(history);assertRelay(sample.h.relay,history)
 expect(sample.h.codec.export(sample.h.codec.import(before))).toBe(before)
 expect(sample.h.codec.export(history)).toBe(before)
})
