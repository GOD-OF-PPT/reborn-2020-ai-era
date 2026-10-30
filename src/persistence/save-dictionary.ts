import {requireRule,RuleError} from '../core/errors.ts'
import {inspectJsonInput} from '../core/json-input.ts'
import {utf8Length} from '../core/hash.ts'
import {MAX_LOGICAL_SAVE_BYTES,MAX_LOGICAL_SAVE_NODES,SAVE_JSON_DEPTH,SAVE_JSON_MEMBERS} from './save-limits.ts'

const MAGIC=new Uint8Array([82,74,83,49]) // RJS1
const CHUNK=16*1024
const forbidden=new Set(['__proto__','constructor','prototype'])
const encoder=new TextEncoder()
type Word={id:number;value:string;text:string;bytes:Uint8Array<ArrayBuffer>}

class Writer{
 #chunks:Uint8Array<ArrayBuffer>[]=[]
 #current=new Uint8Array(CHUNK)
 #used=0
 #length=0
 byte(value:number){
  requireRule(this.#length<MAX_LOGICAL_SAVE_BYTES,'SAVE_TOO_LARGE')
  if(this.#used===CHUNK){this.#chunks.push(this.#current);this.#current=new Uint8Array(CHUNK);this.#used=0}
  this.#current[this.#used++]=value;this.#length++
 }
 write(bytes:Uint8Array){
  requireRule(this.#length+bytes.length<=MAX_LOGICAL_SAVE_BYTES,'SAVE_TOO_LARGE')
  let at=0
  while(at<bytes.length){
   if(this.#used===CHUNK){this.#chunks.push(this.#current);this.#current=new Uint8Array(CHUNK);this.#used=0}
   const size=Math.min(CHUNK-this.#used,bytes.length-at)
   this.#current.set(bytes.subarray(at,at+size),this.#used);this.#used+=size;this.#length+=size;at+=size
  }
 }
 uint(value:number){
  requireRule(Number.isSafeInteger(value)&&value>=0&&value<=0xffffffff,'CORRUPT_SAVE')
  do{const n=value%128;value=Math.floor(value/128);this.byte(n|(value?128:0))}while(value)
 }
 literal(bytes:Uint8Array){this.uint(bytes.length);this.write(bytes)}
 finish(){
  const result=new Uint8Array(this.#length);let at=0
  for(const chunk of this.#chunks){result.set(chunk,at);at+=chunk.length}
  result.set(this.#current.subarray(0,this.#used),at);return result
 }
}

/** A canonical JSON value, encoded without dropping or interpreting any string content. */
export function encodeDictionaryJson(value:unknown,logicalBytes:number):Uint8Array<ArrayBuffer>{
 requireRule(Number.isSafeInteger(logicalBytes)&&logicalBytes>0&&logicalBytes<=MAX_LOGICAL_SAVE_BYTES,'SAVE_TOO_LARGE')
 inspectJsonInput(value,MAX_LOGICAL_SAVE_NODES)
 const words:Word[]=[],byValue=new Map<string,Word>()
 let outputBytes=0
 const count=(n:number)=>{outputBytes+=n;requireRule(outputBytes<=logicalBytes,'SAVE_TOO_LARGE')}
 const word=(value:string)=>{
  let entry=byValue.get(value)
  if(!entry){
   requireRule(value.length+2<=logicalBytes,'SAVE_TOO_LARGE')
   const text=JSON.stringify(value);requireRule(utf8Length(text)<=logicalBytes,'SAVE_TOO_LARGE')
   entry={id:words.length,value,text,bytes:encoder.encode(text)};words.push(entry);byValue.set(value,entry)
  }
  return entry
 }
 const children=(v:object)=>Object.keys(v).sort().map(key=>{
  const d=Object.getOwnPropertyDescriptor(v,key)
  requireRule(d&&'value'in d&&d.enumerable&&!forbidden.has(key),'INVALID_JSON_VALUE')
  return {key,value:d.value as unknown}
 })
 const gather=(v:unknown):void=>{
  if(v===null||typeof v==='boolean'){count(v===null?4:v?4:5);return}
  if(typeof v==='number'){count(JSON.stringify(v).length);return}
  if(typeof v==='string'){count(word(v).bytes.length);return}
  requireRule(typeof v==='object'&&v!==null,'INVALID_JSON_VALUE')
  // Arrays retain numeric order, rather than lexically sorting their indices.
  if(Array.isArray(v)){count(2+Math.max(0,v.length-1));for(const item of v)gather(item);return}
  const entries=children(v);count(2+Math.max(0,entries.length-1))
  for(const entry of entries){count(word(entry.key).bytes.length+1);gather(entry.value)}
 }
 gather(value)
 requireRule(outputBytes===logicalBytes,'CORRUPT_SAVE')
 const writer=new Writer();writer.write(MAGIC);writer.uint(words.length)
 for(const entry of words)writer.literal(entry.bytes)
 const emit=(v:unknown):void=>{
  if(v===null){writer.byte(0);return}
  if(v===false){writer.byte(1);return}
  if(v===true){writer.byte(2);return}
  if(typeof v==='number'){writer.byte(3);writer.literal(encoder.encode(JSON.stringify(v)));return}
  if(typeof v==='string'){writer.byte(4);writer.uint(byValue.get(v)!.id);return}
  requireRule(typeof v==='object'&&v!==null,'INVALID_JSON_VALUE')
  if(Array.isArray(v)){writer.byte(5);writer.uint(v.length);for(const item of v)emit(item);return}
  const entries=children(v);writer.byte(6);writer.uint(entries.length)
  for(const entry of entries){writer.uint(byValue.get(entry.key)!.id);emit(entry.value)}
 }
 emit(value);return writer.finish()
}

/** Reconstructs bounded canonical text before the normal envelope/domain validator sees it. */
export function decodeDictionaryJson(bytes:Uint8Array,logicalBytes:number):string{
 requireRule(Number.isSafeInteger(logicalBytes)&&logicalBytes>0&&logicalBytes<=MAX_LOGICAL_SAVE_BYTES&&bytes.length<=MAX_LOGICAL_SAVE_BYTES,'SAVE_TOO_LARGE')
 requireRule(bytes.length>=6&&MAGIC.every((n,i)=>bytes[i]===n),'CORRUPT_SAVE')
 let at=MAGIC.length,nodes=0,outputBytes=0
 const uint=()=>{
  let n=0,multiplier=1
  for(let i=0;i<5;i++){
   requireRule(at<bytes.length,'CORRUPT_SAVE')
   const b=bytes[at++]!
   requireRule(i!==4||b<=15,'CORRUPT_SAVE')
   n+=(b&127)*multiplier
   if(!(b&128)){requireRule(i===0||b!==0,'CORRUPT_SAVE');return n}
   multiplier*=128
  }
  throw new RuleError('CORRUPT_SAVE')
 }
 const utf8=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true})
 const literal=(maxBytes:number)=>{
  const length=uint();requireRule(length<=maxBytes&&length<=bytes.length-at,'CORRUPT_SAVE')
  let text:string
  try{text=utf8.decode(bytes.subarray(at,at+length))}catch{throw new RuleError('CORRUPT_SAVE')}
  at+=length;return {text,length}
 }
 const parse=(text:string):unknown=>{try{return JSON.parse(text) as unknown}catch{throw new RuleError('CORRUPT_SAVE')}}
 const size=uint(),words:{value:string;text:string;length:number}[]=[],seen=new Set<string>()
 requireRule(size<=2*MAX_LOGICAL_SAVE_NODES&&size<=Math.floor((bytes.length-at-1)/3),'CORRUPT_SAVE')
 let dictionaryBytes=0
 for(let i=0;i<size;i++){
  const entry=literal(logicalBytes)
  requireRule(entry.text.startsWith('"')&&entry.text.endsWith('"'),'CORRUPT_SAVE')
  const value=parse(entry.text)
  requireRule(typeof value==='string'&&JSON.stringify(value)===entry.text&&!seen.has(value),'CORRUPT_SAVE')
  dictionaryBytes+=entry.length;requireRule(dictionaryBytes<=logicalBytes,'SAVE_TOO_LARGE')
  seen.add(value);words.push({value,...entry})
 }
 const entry=()=>{const w=words[uint()];requireRule(w,'CORRUPT_SAVE');return w}
 const take=(text:string,length:number)=>{outputBytes+=length;requireRule(outputBytes<=logicalBytes,'SAVE_TOO_LARGE');return text}
 const read=(depth:number):string=>{
  nodes++;requireRule(nodes<=MAX_LOGICAL_SAVE_NODES&&depth<=SAVE_JSON_DEPTH,'SAVE_TOO_LARGE')
  requireRule(at<bytes.length,'CORRUPT_SAVE')
  const tag=bytes[at++]!
  if(tag===0)return take('null',4)
  if(tag===1)return take('false',5)
  if(tag===2)return take('true',4)
  if(tag===3){const l=literal(32),n=parse(l.text);requireRule(typeof n==='number'&&Number.isFinite(n)&&JSON.stringify(n)===l.text,'CORRUPT_SAVE');return take(l.text,l.length)}
  if(tag===4){const w=entry();return take(w.text,w.length)}
  requireRule(tag===5||tag===6,'CORRUPT_SAVE')
  const count=uint(),array=tag===5
  requireRule(count<=SAVE_JSON_MEMBERS,'SAVE_TOO_LARGE')
  requireRule(count<=Math.floor((bytes.length-at)/(array?1:2)),'CORRUPT_SAVE')
  const parts:string[]=[take(array?'[':'{',1)];let last:string|undefined
  for(let i=0;i<count;i++){
   if(i)parts.push(take(',',1))
   if(!array){const w=entry();requireRule(!forbidden.has(w.value)&&(last===undefined||last<w.value),'CORRUPT_SAVE');last=w.value;parts.push(take(w.text,w.length),take(':',1))}
   parts.push(read(depth+1))
  }
  parts.push(take(array?']':'}',1));return parts.join('')
 }
 const text=read(0)
 requireRule(at===bytes.length&&outputBytes===logicalBytes,'CORRUPT_SAVE')
 return text
}
