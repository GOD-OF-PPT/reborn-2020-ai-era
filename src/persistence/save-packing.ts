import {z} from 'zod'
import {deflate,Inflate} from 'pako'
import {requireRule,RuleError} from '../core/errors.ts'
import {canonicalJson} from '../core/identity.ts'
import {hashText,utf8Length} from '../core/hash.ts'
import {envelopeSchema} from './schemas.ts'
import {assertJsonInput} from '../core/json-input.ts'
import type {SaveEnvelope} from './codec.ts'

export const MAX_ENCODED_SAVE_BYTES=10*1024*1024
export const MAX_LOGICAL_SAVE_BYTES=256*1024*1024
export const MAX_LOGICAL_SAVE_NODES=5000000
export const LEGACY_SAVE_NODES=300000
const CHUNK_BYTES=16*1024
const packing='zlib-base64-v1' as const
const packedSchema=envelopeSchema.omit({state:true,saveVersion:true}).extend({saveVersion:z.literal(2),packing:z.literal(packing),logicalBytes:z.number().int().min(1).max(MAX_LOGICAL_SAVE_BYTES),payloadHash:z.string().regex(/^[0-9a-f]{64}$/),payload:z.string().min(4).max(MAX_ENCODED_SAVE_BYTES)})
export type PackedSaveEnvelope=z.infer<typeof packedSchema>
export type SaveDocument=SaveEnvelope|PackedSaveEnvelope
const metadataKeys=['runId','revision','checksum','schemaVersion','rulesVersion','contentVersion','contentHash','rngAlgorithmVersion'] as const

function base64(bytes:Uint8Array):string{
 let binary=''
 for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000))
 return btoa(binary)
}
function decode64(value:string):Uint8Array<ArrayBuffer>{
 requireRule(value.length>0&&value.length%4===0,'INVALID_SAVE_ENVELOPE')
 const padding=value.endsWith('==')?2:value.endsWith('=')?1:0
 for(let i=0;i<value.length-padding;i++){
  const n=value.charCodeAt(i)
  requireRule(n>=65&&n<=90||n>=97&&n<=122||n>=48&&n<=57||n===43||n===47,'INVALID_SAVE_ENVELOPE')
 }
 let binary:string
 try{binary=atob(value)}catch{throw new RuleError('INVALID_SAVE_ENVELOPE')}
 const bytes=new Uint8Array(binary.length)
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i)
 requireRule(base64(bytes)===value,'INVALID_SAVE_ENVELOPE')
 return bytes
}

/** Logical v1 stays the checksum/state contract; only its bounded wire form changes. */
export function packSave(envelope:SaveEnvelope,logicalText:string,nodes:number):SaveDocument{
 const logicalBytes=utf8Length(logicalText)
 requireRule(logicalBytes<=MAX_LOGICAL_SAVE_BYTES,'SAVE_TOO_LARGE')
 if(logicalBytes<=MAX_ENCODED_SAVE_BYTES&&nodes<=LEGACY_SAVE_NODES)return envelope
 const encoded=deflate(new TextEncoder().encode(logicalText),{level:3})
 requireRule(Math.ceil(encoded.length/3)*4<MAX_ENCODED_SAVE_BYTES,'SAVE_TOO_LARGE')
 const {state:_,saveVersion:__,...metadata}=envelope
 const result:PackedSaveEnvelope={...metadata,saveVersion:2,packing,logicalBytes,payloadHash:hashText(logicalText),payload:base64(encoded)}
 requireRule(utf8Length(canonicalJson(result))<=MAX_ENCODED_SAVE_BYTES,'SAVE_TOO_LARGE')
 return result
}

/** No allocation trusts the declared length. Output is checked on each fixed chunk. */
export function unpackSave(value:unknown,beforeDecode?:(header:Readonly<PackedSaveEnvelope>)=>void):{text:string;header:PackedSaveEnvelope}{
 assertJsonInput(value)
 requireRule(utf8Length(canonicalJson(value))<=MAX_ENCODED_SAVE_BYTES,'SAVE_TOO_LARGE')
 if(typeof value==='object'&&value!==null){const size=Reflect.get(value,'logicalBytes');if(typeof size==='number'&&Number.isSafeInteger(size)&&size>MAX_LOGICAL_SAVE_BYTES)throw new RuleError('SAVE_TOO_LARGE')}
 const parsed=packedSchema.safeParse(value)
 requireRule(parsed.success,'INVALID_SAVE_ENVELOPE')
 const header=parsed.data
 beforeDecode?.(header)
 const bytes=decode64(header.payload),parts:string[]=[],decoder=new TextDecoder('utf-8',{fatal:true}),progress:{stream?:{avail_in:number}}={}
 const stream=new Inflate({windowBits:15,chunkSize:CHUNK_BYTES})
 let total=0
 stream.onStart=value=>{progress.stream=value}
 stream.onData=chunk=>{
  total+=chunk.length
  requireRule(chunk.length<=CHUNK_BYTES&&total<=header.logicalBytes&&total<=MAX_LOGICAL_SAVE_BYTES,'SAVE_TOO_LARGE')
  parts.push(decoder.decode(chunk,{stream:true}))
 }
 try{
  stream.push(bytes,true)
  requireRule(stream.ended&&stream.err===0&&progress.stream?.avail_in===0,'CORRUPT_SAVE')
  parts.push(decoder.decode())
 }catch(error){if(error instanceof RuleError)throw error;throw new RuleError('CORRUPT_SAVE')}
 requireRule(total===header.logicalBytes,'CORRUPT_SAVE')
 const text=parts.join('')
 requireRule(hashText(text)===header.payloadHash,'CORRUPT_SAVE')
 return{text,header}
}
export function assertPackedMetadata(envelope:SaveEnvelope,header:PackedSaveEnvelope):void{
 requireRule(metadataKeys.every(key=>envelope[key]===header[key]),'SAVE_HEADER_MISMATCH')
}
