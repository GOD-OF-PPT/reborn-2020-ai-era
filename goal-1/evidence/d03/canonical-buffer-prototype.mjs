import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {canonicalJson} from '../../../src/core/identity.ts'
import {requireRule} from '../../../src/core/errors.ts'

function buffered(value,depth=0,safeKeys=false){
 const chunks=[]
 function visit(v,d){
  requireRule(d<=32,'INVALID_PAYLOAD')
  if(v===null||typeof v==='string'||typeof v==='boolean'){chunks.push(JSON.stringify(v));return}
  if(typeof v==='number'){requireRule(Number.isFinite(v),'INVALID_PAYLOAD');chunks.push(JSON.stringify(v));return}
  if(Array.isArray(v)){
   if(Object.getPrototypeOf(v)!==Array.prototype||Object.hasOwn(v,'map')||Object.hasOwn(v,'constructor')){chunks.push(canonicalJson(v,d));return}
   chunks.push('[');const length=v.length
   for(let i=0;i<length;i++){if(i)chunks.push(',');if(i in v)visit(v[i],d+1)}
   chunks.push(']');return
  }
  requireRule(typeof v==='object'&&v!==null,'INVALID_PAYLOAD');const prototype=Object.getPrototypeOf(v)
  requireRule(prototype===Object.prototype||prototype===null,'INVALID_PAYLOAD')
  chunks.push('{');const keys=Object.keys(v).sort()
  for(let i=0;i<keys.length;i++){const key=keys[i];if(i)chunks.push(',');chunks.push(safeKeys&&/^[A-Za-z0-9_$:-]+$/.test(key)?'"'+key+'"':JSON.stringify(key),':');visit(Reflect.get(v,key),d+1)}
  chunks.push('}')
 }
 visit(value,depth);return chunks.join('')
}
const root=new URL('./',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex'),functions=[['original',canonicalJson],['buffered',v=>buffered(v)],['buffered-safe-keys',v=>buffered(v,0,true)]]
const outcome=(fn,v)=>{try{return {result:fn(v)}}catch(e){return {error:e.constructor.name,code:e.code??null,message:e.message}}}
const values=[null,true,false,0,-0,1e21,1e-9,'\ud800\n"\\',{'2':'two','10':'ten','':0,'__proto__':null},Object.assign(Object.create(null),{z:1,a:2}),[,,3,],undefined,NaN,Infinity,1n,Symbol('x'),()=>0,new Date(0),Object.create({inherited:1})]
let deep=0;for(let i=0;i<34;i++){values.push(deep);deep={value:deep}}
const cycle={};cycle.self=cycle;values.push(cycle)
let seed=20201018;const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0}
function jsonValue(depth=0){const n=next();if(depth>4||n%4===0)return [null,true,false,n/17,'quoted"\\'+n+'\ud800'][n%5];if(n%4===1)return Array.from({length:next()%5},()=>jsonValue(depth+1));const o={};for(let i=0;i<next()%5;i++)o[['n'+next(),String(next()%30),'中文'+next(),'unsafe"'+next()][next()%4]]=jsonValue(depth+1);return o}
for(let i=0;i<5000;i++)values.push(jsonValue())
for(const value of values){const expected=JSON.stringify(outcome(canonicalJson,value));for(const [name,fn] of functions.slice(1))if(JSON.stringify(outcome(fn,value))!==expected)throw Error('PROTOTYPE_NOT_EQUIVALENT:'+name)}
const files=['hooks-before/agency-normal-relay-base.json','hooks-before/agency-payroll-ready.json','hooks-before/routine-prepared.json','final-life77-after-art-review.json','final-risk114-after-review.json'],data=files.map(file=>({file,value:JSON.parse(readFileSync(new URL(file,root),'utf8'))}))
const parity=data.map(({file,value})=>{const old=canonicalJson(value);for(const [name,fn] of functions.slice(1))if(fn(value)!==old)throw Error('REAL_SNAPSHOT_NOT_EQUIVALENT:'+file+name);return {file,canonicalSha256:sha(old),byteEqual:true}})
for(const [,fn] of functions)for(const {value} of data)fn(value)
const timings=[]
for(let round=0;round<5;round++)for(let i=0;i<functions.length;i++){const [name,fn]=functions[(i+round)%functions.length];const start=performance.now();for(let repeat=0;repeat<3;repeat++)for(const {value} of data)fn(value);timings.push({round,name,milliseconds:performance.now()-start})}
const result={scope:'throwaway canonical encoding prototype; no application changes, current five authentic envelopes and seeded differential cases; Node microbenchmarks do not establish whole-game/browser speed or timeout cause',differentialCases:values.length,allOutcomesEqual:true,parity,timings}
writeFileSync(new URL('canonical-buffer-prototype-result.json',root),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({differentialCases:values.length,parityFiles:parity.length,timings}))
