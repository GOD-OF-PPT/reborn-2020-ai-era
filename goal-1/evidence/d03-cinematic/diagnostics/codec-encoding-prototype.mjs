// Throwaway, data-only experiment. Does not import/replace any production function.
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {canonicalJson} from '../../../../src/core/identity.ts'
import {hashValue,hashText} from '../../../../src/core/hash.ts'

function sortedData(value){
 if(value===null||typeof value!=='object')return true
 const keys=Object.keys(value)
 if(!Array.isArray(value))for(let i=1;i<keys.length;i++)if(keys[i-1]>keys[i])return false
 return keys.every(k=>sortedData(value[k]))
}
// Only for data freshly obtained from native JSON.parse and already strictly validated.
function parsedCanonical(value){return sortedData(value)?JSON.stringify(value):canonicalJson(value)}
function sameData(a,b){
 if(a===b)return true
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false
 const keys=Object.keys(a)
 return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&sameData(a[k],b[k]))
}
function legacySeal(body){return canonicalJson({...body,checksum:hashValue(body)})}
function onePassSeal(body){const encoded=canonicalJson(body),checksum=hashText(encoded),keys=Object.keys(body);return keys.length&&keys.every(k=>k>'checksum')?'{"checksum":'+JSON.stringify(checksum)+','+encoded.slice(1):canonicalJson({...body,checksum})}
function importedChecksum(raw,parsed){const encoded=parsedCanonical(raw),{checksum,...body}=parsed,prefix='{"checksum":'+JSON.stringify(checksum)+',';return sameData(raw,parsed)&&encoded.startsWith(prefix)?hashText('{'+encoded.slice(prefix.length)):hashValue(body)}

let seed=20201019
const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0}
function value(depth=0){const n=next();if(depth>4||n%4===0)return [null,true,false,n/17,'引号"\\'+n+'\ud800'][n%5];if(n%4===1)return Array.from({length:next()%5},()=>value(depth+1));const o={};for(let i=0;i<next()%5;i++)o[['k'+next(),String(next()%30),'中文'+next(),'q"'+next()][next()%4]]=value(depth+1);return o}
const examples=[null,true,false,0,-0,1e21,1e-9,'\ud800\n"\\',{'2':'two','10':'ten','':0},JSON.parse('{"__proto__":{"x":1},"a":2}'),[]]
for(let i=0;i<5000;i++)examples.push(value())
for(const data of examples){const parsed=JSON.parse(JSON.stringify(data));if(parsedCanonical(parsed)!==canonicalJson(parsed))throw Error('PARSED_CANONICAL_NOT_EQUAL');const body={state:parsed,contentVersion:'v',revision:1};if(onePassSeal(body)!==legacySeal(body))throw Error('SEALED_BYTES_NOT_EQUAL');const raw=JSON.parse(legacySeal(body));if(importedChecksum(raw,JSON.parse(JSON.stringify(raw)))!==hashValue(body))throw Error('IMPORTED_BODY_HASH_NOT_EQUAL')}
for(const body of [{a:1,state:2},{checksum:'prior',state:3},{'':1,state:4},{}])if(onePassSeal(body)!==legacySeal(body))throw Error('HEADER_FALLBACK_NOT_EQUAL')
const changed={checksum:'x',state:{value:1}},normalized={checksum:'x',state:{value:2}};if(importedChecksum(changed,normalized)!==hashValue({state:normalized.state}))throw Error('SCHEMA_NORMALIZATION_FALLBACK_MISSING')
const root=new URL('../',import.meta.url),files=['input-tech1.json','input-life77.json','input-business95.json','input-risk114.json','dev-content-completed4.json','final-zero-stopped-and-advanced8.json'],records=files.map(file=>{const raw=JSON.parse(readFileSync(new URL(file,root),'utf8'));return {file,raw,parsed:JSON.parse(JSON.stringify(raw))}})
const sha=s=>createHash('sha256').update(s).digest('hex')
const parity=records.map(({file,raw})=>{const {checksum,...body}=raw,old=legacySeal(body);if(onePassSeal(body)!==old||parsedCanonical(raw)!==canonicalJson(raw)||importedChecksum(raw,JSON.parse(JSON.stringify(raw)))!==hashValue(body))throw Error('REAL_ENVELOPE_NOT_EQUAL:'+file);return {file,sha256:sha(old),byteEqual:true}})
const timings=[]
for(let round=0;round<5;round++)for(const mode of round%2?['one-pass','legacy']:['legacy','one-pass']){const started=performance.now(),cpu=process.cpuUsage();for(let repeat=0;repeat<2;repeat++)for(const {raw,parsed} of records){const {checksum,...body}=parsed;if(mode==='legacy'){legacySeal(body);canonicalJson(raw);hashValue(body)}else{onePassSeal(body);importedChecksum(raw,parsed)}}const used=process.cpuUsage(cpu);timings.push({round,mode,wallMs:performance.now()-started,userMs:used.user/1000,systemMs:used.system/1000})}
const result={scope:'Unmerged data-only codec encoding prototype. No global canonicalJson/copyJson changes, no source mutation, no moved/cached gameplay commands. Microbenchmarks are not whole-hook or browser speed.',differentialCases:examples.length,allEqual:true,headerFallbacks:4,normalizationFallback:true,parity,timings}
writeFileSync(new URL('diagnostics/codec-encoding-prototype-result.json',root),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(result))
