/// <reference types="node" />
import {expect,it} from 'vitest'
import {deflateSync,inflateSync} from 'node:zlib'
import {encodeDictionaryJson,decodeDictionaryJson} from './save-dictionary.ts'
import {unpackSave,MAX_LOGICAL_SAVE_BYTES,type DictionarySaveEnvelope} from './save-packing.ts'
import {canonicalJson} from '../core/identity.ts'
import {hashText,utf8Length} from '../core/hash.ts'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'

const magic=Buffer.from('RJS1'),utf8=(s:string)=>Buffer.from(s,'utf8')
const u=(n:number)=>{const out:number[]=[];do{out.push(n%128|(n>=128?128:0));n=Math.floor(n/128)}while(n);return Buffer.from(out)}
const literal=(b:Uint8Array)=>Buffer.concat([u(b.length),b])
const packet=(words:readonly string[],body:Uint8Array)=>Buffer.concat([magic,u(words.length),...words.map(s=>literal(utf8(JSON.stringify(s)))),body])
/** Independent byte producer using Buffers; no production writer or decoder. */
function reference(value:unknown):Buffer{
 const words:string[]=[],index=new Map<string,number>(),add=(s:string)=>{if(!index.has(s)){index.set(s,words.length);words.push(s)}}
 function visit(v:unknown){if(typeof v==='string')add(v);else if(Array.isArray(v))v.forEach(visit);else if(v!==null&&typeof v==='object')Object.keys(v).sort().forEach(k=>{add(k);visit((v as Record<string,unknown>)[k])})}
 visit(value)
 function node(v:unknown):Buffer{
  if(v===null)return Buffer.from([0]);if(v===false)return Buffer.from([1]);if(v===true)return Buffer.from([2])
  if(typeof v==='number')return Buffer.concat([Buffer.from([3]),literal(utf8(JSON.stringify(v)))])
  if(typeof v==='string')return Buffer.concat([Buffer.from([4]),u(index.get(v)!)])
  if(Array.isArray(v))return Buffer.concat([Buffer.from([5]),u(v.length),...v.map(node)])
  const keys=Object.keys(v as object).sort();return Buffer.concat([Buffer.from([6]),u(keys.length),...keys.flatMap(k=>[u(index.get(k)!),node((v as Record<string,unknown>)[k])])])
 }
 return packet(words,node(value))
}
const codec=createCampaignCodec(),run=createCampaignRun({runId:'dictionary-normal',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'dictionary-中🙂-\ud800'}),envelope=codec.seal(run),raw=canonicalJson(envelope)
function packed(value:unknown=envelope):DictionarySaveEnvelope{
 const text=canonicalJson(value),bytes=reference(value),{state:_,saveVersion:__,...metadata}=envelope
 return {...metadata,saveVersion:3,packing:'zlib-dictionary-v1',logicalBytes:utf8Length(text),packedBytes:bytes.length,payloadHash:hashText(text),payload:deflateSync(bytes).toString('base64')}
}
function changedBytes(bytes:Uint8Array):DictionarySaveEnvelope{return {...packed(),packedBytes:bytes.length,payload:deflateSync(bytes).toString('base64')}}
it('matches a fixed byte fixture with shared key/value text, arrays and all scalar tags',()=>{
 const value={a:['a',true,null,1]},text=canonicalJson(value),bytes=new Uint8Array([82,74,83,49,1,3,34,97,34,6,1,0,5,4,4,0,2,0,3,1,49])
 expect(encodeDictionaryJson(value,utf8Length(text))).toEqual(bytes)
 expect(decodeDictionaryJson(bytes,utf8Length(text))).toBe(text)
})
it.each(['中文🙂','\u0000','\ufeff','"\\\n','\ud800','\udfff','{"saveVersion":3,"constructor":"只是原文"}','1e400'])('preserves literal string %s and never interprets its contents',value=>{
 const data={value,[value]:[value,false,-0,1e21,1e-7]},text=canonicalJson(data),bytes=encodeDictionaryJson(data,utf8Length(text))
 expect(Buffer.from(bytes)).toEqual(reference(data));expect(decodeDictionaryJson(reference(data),utf8Length(text))).toBe(text)
})
it('keeps numeric array order beyond9, sorted original object keys, and words across chunk boundaries',()=>{
 const data={z:Array.from({length:32},(_,i)=>'value'+i),a:'界🙂'.repeat(6000)},text=canonicalJson(data),bytes=encodeDictionaryJson(data,utf8Length(text))
 expect(Buffer.from(bytes)).toEqual(reference(data));expect(decodeDictionaryJson(bytes,utf8Length(text))).toBe(text)
})
it('rejects accessor input before reading it and retains ordinary JSON source shape checks',()=>{
 let read=false;const value={};Object.defineProperty(value,'x',{enumerable:true,get(){read=true;return 'bad'}})
 expect(()=>encodeDictionaryJson(value,20)).toThrow('INVALID_JSON_VALUE');expect(read).toBe(false)
 expect(()=>encodeDictionaryJson([,],10)).toThrow();expect(()=>encodeDictionaryJson({x:Infinity},10)).toThrow()
})
it.each([
 ['unknown tag',packet([],Buffer.from([7]))],
 ['dangling string',packet([],Buffer.from([4,0]))],
 ['duplicate words',packet(['x','x'],Buffer.from([4,0]))],
 ['trailing token',packet([],Buffer.from([0,0]))],
 ['overlong integer',Buffer.concat([magic,Buffer.from([128,0,0])])],
 ['overflow integer',Buffer.concat([magic,Buffer.from([255,255,255,255,16])])],
 ['truncated integer',Buffer.concat([magic,Buffer.from([128])])],
 ['huge table',Buffer.concat([magic,u(10000001),Buffer.from([0])])],
 ['invalid UTF8',Buffer.concat([magic,u(1),literal(Buffer.from([34,0xc3,0x28,34])),Buffer.from([4,0])])],
 ['leading UTF8 BOM',Buffer.concat([magic,u(1),literal(Buffer.from([0xef,0xbb,0xbf,34,120,34])),Buffer.from([4,0])])],
 ['noncanonical string',Buffer.concat([magic,u(1),literal(utf8('"\\u0078"')),Buffer.from([4,0])])],
 ['noncanonical number',packet([],Buffer.concat([Buffer.from([3]),literal(utf8('1.0'))]))],
 ['infinite number',packet([],Buffer.concat([Buffer.from([3]),literal(utf8('1e400'))]))],
 ['negative zero',packet([],Buffer.concat([Buffer.from([3]),literal(utf8('-0'))]))],
 ['wrong key order',packet(['z','a'],Buffer.from([6,2,0,0,1,0]))],
 ['duplicate key',packet(['x'],Buffer.from([6,2,0,0,0,0]))],
 ['unsafe key',packet(['__proto__'],Buffer.from([6,1,0,0]))],
] as const)('rejects malformed independent bytes: %s',(_label,bytes)=>expect(()=>decodeDictionaryJson(bytes,1000)).toThrow())
it('rejects oversized expansion, depth, collection and declared output before trusting counts',()=>{
 expect(()=>decodeDictionaryJson(packet(['x'],Buffer.from([5,4,4,0,4,0,4,0,4,0])),10)).toThrow('SAVE_TOO_LARGE')
 expect(()=>decodeDictionaryJson(packet([],Buffer.from([0])),MAX_LOGICAL_SAVE_BYTES+1)).toThrow('SAVE_TOO_LARGE')
 expect(()=>decodeDictionaryJson(packet([],Buffer.concat([Buffer.from([5]),u(100001)])),1000000)).toThrow('SAVE_TOO_LARGE')
 expect(()=>decodeDictionaryJson(packet([],Buffer.concat([Buffer.from(Array.from({length:33},()=>[5,1]).flat()),Buffer.from([0])])),1000)).toThrow('SAVE_TOO_LARGE')
 expect(()=>decodeDictionaryJson(packet([],Buffer.from([0])),5)).toThrow('CORRUPT_SAVE')
})
it('enforces the original5M logical-node budget on a bounded independent token expansion',()=>{
 const array=Buffer.concat([Buffer.from([5]),u(100000),Buffer.alloc(100000)]),bytes=Buffer.concat([magic,u(0),Buffer.from([5]),u(51),...Array.from({length:51},()=>array)])
 expect(()=>decodeDictionaryJson(bytes,26*1024*1024)).toThrow('SAVE_TOO_LARGE')
})
it('reads an independent Node-zlib v3 normal save through the complete original RunCodec validator',()=>{
 const value=packed();expect(unpackSave(value).text).toBe(raw);expect(codec.readEnvelope(value)).toEqual(envelope);expect(codec.import(canonicalJson(value))).toEqual(run)
 expect(codec.export(codec.import(canonicalJson(value)))).toBe(codec.export(run)) // Small original writer remains v1.
 expect(inflateSync(Buffer.from(value.payload,'base64'))).toEqual(reference(envelope))
})
it.each(['runId','revision','checksum'] as const)('retains original metadata rejection for v3 %s',key=>{
 const value=packed(),bad={...value,[key]:key==='revision'?value.revision+1:key==='checksum'?'0'.repeat(64):'foreign-life'}
 expect(()=>codec.readEnvelope(bad)).toThrow('SAVE_HEADER_MISMATCH')
})
it('rejects corrupt streams, wrong lengths, unknown formats and nested physical envelopes',()=>{
 const value=packed(),bytes=Buffer.from(value.payload,'base64'),bad=Buffer.from(bytes);bad[bad.length-1]!^=1
 for(const payload of [bad,bytes.subarray(0,-2),Buffer.concat([bytes,Buffer.from([0])]),Buffer.concat([bytes,bytes])])expect(()=>unpackSave({...value,payload:payload.toString('base64')})).toThrow('CORRUPT_SAVE')
 expect(()=>unpackSave({...value,packedBytes:value.packedBytes-1})).toThrow('SAVE_TOO_LARGE')
 expect(()=>unpackSave({...value,packedBytes:value.packedBytes+1})).toThrow('CORRUPT_SAVE')
 expect(()=>unpackSave({...value,logicalBytes:value.logicalBytes-1})).toThrow('SAVE_TOO_LARGE')
 expect(()=>unpackSave({...value,logicalBytes:value.logicalBytes+1})).toThrow('CORRUPT_SAVE')
 expect(()=>unpackSave({...value,packedBytes:MAX_LOGICAL_SAVE_BYTES+1})).toThrow('SAVE_TOO_LARGE')
 expect(()=>unpackSave({...value,payloadHash:'0'.repeat(64)})).toThrow('CORRUPT_SAVE')
 expect(()=>unpackSave({...value,packing:'not-supported'})).toThrow('INVALID_SAVE_ENVELOPE')
 expect(()=>unpackSave({...value,unknown:true})).toThrow('INVALID_SAVE_ENVELOPE')
 expect(()=>codec.readEnvelope(packed(value))).toThrow('UNSUPPORTED_SAVE_VERSION')
 expect(()=>unpackSave(changedBytes(Buffer.concat([reference(envelope),Buffer.from([0])])))).toThrow('CORRUPT_SAVE')
})
it('keeps header compatibility ahead of decode and never invokes an accessor payload',()=>{
 const value={...packed(),rulesVersion:'foreign',payload:'AAAA'};expect(()=>codec.readEnvelope(value)).toThrow('INCOMPATIBLE_RULES')
 let read=false;const bad={...packed()};Object.defineProperty(bad,'payload',{enumerable:true,get(){read=true;return ''}})
 expect(()=>codec.readEnvelope(bad)).toThrow('INVALID_JSON_VALUE');expect(read).toBe(false)
})
