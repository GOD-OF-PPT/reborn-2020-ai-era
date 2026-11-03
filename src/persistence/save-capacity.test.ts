/// <reference types="node" />
import {beforeAll,expect,it} from 'vitest'
import {inflateSync} from 'node:zlib'
import {deflate} from 'pako'
import {createInitialRun} from '../application/bootstrap.ts'
import {createBaseRegistry} from '../core/commands.ts'
import {BOOTSTRAP_VERSIONS} from '../content/bootstrap.ts'
import {canonicalJson} from '../core/identity.ts'
import {hashText,utf8Length} from '../core/hash.ts'
import {inspectJsonInput} from '../core/json-input.ts'
import {RunCodec} from './codec.ts'
import {encodeDictionaryJson} from './save-dictionary.ts'
import {packSave,unpackSave,MAX_ENCODED_SAVE_BYTES,MAX_LOGICAL_SAVE_BYTES,MAX_LOGICAL_SAVE_NODES} from './save-packing.ts'

const codec=new RunCodec(createBaseRegistry(BOOTSTRAP_VERSIONS),['technical_employee'])
const run=createInitialRun({runId:'packing-capacity-only',actorId:'player',commandId:'create-fixture',backgroundId:'technical_employee',seed:'packing-fixture-v1'})
const sealed=codec.seal(run),alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const words:string[]=[],characters=Array<string>(200);let random=0x13579bdf
for(let i=0;i<53000;i++){
  for(let n=0;n<200;n++){random=(Math.imul(random,1664525)+1013904223)>>>0;characters[n]=alphabet.charAt(random>>>26)}
  words.push(characters.join(''))
}

// Packing-layer JSON fixture only. The extra member deliberately is not a
// campaign schema field; legal-run acceptance uses the original captured624.
function fixture(count:number){
  const data=words.slice(0,count),state={...run,packingCapacityOnly:[data,[...data]]}
  const {checksum:ignored,...base}=sealed,body={...base,state},envelope={...body,checksum:hashText(canonicalJson(body))}
  const logical=canonicalJson(envelope),logicalBytes=utf8Length(logical),nodes=inspectJsonInput(envelope,MAX_LOGICAL_SAVE_NODES)
  const tokens=encodeDictionaryJson(envelope,logicalBytes)
  return{envelope,logical,logicalBytes,nodes,tokens}
}
function referenceWire(value:ReturnType<typeof fixture>,level:3|9){
  const {state:ignoredState,saveVersion:ignoredVersion,...metadata}=value.envelope
  return canonicalJson({...metadata,saveVersion:3,packing:'zlib-dictionary-v1',logicalBytes:value.logicalBytes,packedBytes:value.tokens.length,payloadHash:hashText(value.logical),payload:Buffer.from(deflate(value.tokens,{level})).toString('base64')})
}
let prepared:{fallback:ReturnType<typeof fixture>;preferred:ReturnType<typeof fixture>;tooLarge:ReturnType<typeof fixture>}|null=null
function inputs(){if(!prepared)throw Error('CAPACITY_FIXTURES_NOT_READY');return prepared}
beforeAll(()=>{
  // Locate the real10MiB boundary on a fixed byte sequence. No production
  // limits are mocked, and no campaign/seed is searched for a passing run.
  let low=49000,high=51000
  expect(utf8Length(referenceWire(fixture(low),3))).toBeLessThanOrEqual(MAX_ENCODED_SAVE_BYTES)
  expect(utf8Length(referenceWire(fixture(high),3))).toBeGreaterThan(MAX_ENCODED_SAVE_BYTES)
  while(low+1<high){const middle=Math.floor((low+high)/2);if(utf8Length(referenceWire(fixture(middle),3))>MAX_ENCODED_SAVE_BYTES)high=middle;else low=middle}
  const fallback=fixture(high)
  expect(utf8Length(referenceWire(fallback,3))).toBeGreaterThan(MAX_ENCODED_SAVE_BYTES)
  expect(utf8Length(referenceWire(fallback,9))).toBeLessThanOrEqual(MAX_ENCODED_SAVE_BYTES)
  prepared={fallback,preferred:fixture(high-2000),tooLarge:fixture(high+2000)}
},120000)

it('keeps every existing size limit while losslessly fitting a dictionary document that needs stronger compression',()=>{
  const value=inputs().fallback
  expect(MAX_ENCODED_SAVE_BYTES).toBe(10*1024*1024)
  expect(MAX_LOGICAL_SAVE_BYTES).toBe(256*1024*1024)
  expect(MAX_LOGICAL_SAVE_NODES).toBe(5000000)
  const packed=packSave(value.envelope,value.logical,value.nodes)
  expect(packed.saveVersion).toBe(3)
  if(packed.saveVersion!==3)throw Error('DICTIONARY_FALLBACK_REQUIRED')
  expect(utf8Length(canonicalJson(packed))).toBeLessThanOrEqual(MAX_ENCODED_SAVE_BYTES)
  expect(canonicalJson(packed)).toBe(referenceWire(value,9))
  expect(unpackSave(packed).text).toBe(value.logical)
  expect(inflateSync(Buffer.from(packed.payload,'base64')).equals(Buffer.from(value.tokens))).toBe(true)
  expect(packed.checksum).toBe(value.envelope.checksum)
  expect(canonicalJson(packSave(value.envelope,value.logical,value.nodes))).toBe(canonicalJson(packed))
},60000)

it('retains the exact preferred level3 dictionary wire when it already fits',()=>{
  const value=inputs().preferred,packed=packSave(value.envelope,value.logical,value.nodes)
  expect(packed.saveVersion).toBe(3)
  expect(canonicalJson(packed)).toBe(referenceWire(value,3))
  expect(unpackSave(packed).text).toBe(value.logical)
},60000)

it('still refuses an encoded document that remains above the unchanged limit after stronger compression',()=>{
  const value=inputs().tooLarge
  expect(utf8Length(referenceWire(value,9))).toBeGreaterThan(MAX_ENCODED_SAVE_BYTES)
  expect(()=>packSave(value.envelope,value.logical,value.nodes)).toThrow('SAVE_TOO_LARGE')
},60000)
