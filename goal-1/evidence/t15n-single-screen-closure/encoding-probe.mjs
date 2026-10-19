/** Diagnostic only. Alternating encoders over the same strictly validated real data. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {createCampaignCodec} from '../../../src/application/campaign.ts';
import {canonicalJson} from '../../../src/core/identity.ts';
const old='goal-1/evidence/t15n-cinematic-closure/diagnosis/ordinary-sampled/ordinary-final.json';
const state=createCampaignCodec().import(readFileSync(old,'utf8')),body={saveVersion:1,...state.versions,runId:state.runId,revision:state.revision,state};
const encode=value=>{let indexKey=false;const text=JSON.stringify(value,(_key,item)=>{if(item===null||typeof item!=='object'||Array.isArray(item))return item;const keys=Object.keys(item),sorted=[...keys].sort();for(const key of keys)if(String(Number(key)>>>0)===key&&key!=='4294967295')indexKey=true;return keys.every((key,i)=>key===sorted[i])?item:Object.fromEntries(sorted.map(key=>[key,item[key]]))});return indexKey?canonicalJson(value):text};
const rows=[];for(let round=0;round<8;round++)for(const method of round%2?['native-sorted','canonical']:['canonical','native-sorted']){const start=performance.now();let text='';for(let n=0;n<3;n++)text=(method==='canonical'?canonicalJson:encode)(body);rows.push({round,method,ms:performance.now()-start,sha256:createHash('sha256').update(text).digest('hex')})}
const expected=canonicalJson(body);for(const row of rows)if(row.sha256!==createHash('sha256').update(expected).digest('hex'))throw Error('ENCODING_BYTES_CHANGED');
const output={source:old,scope:'Node encoding microbenchmark only, not full-path or browser speed',allBytesEqual:true,rows};writeFileSync('goal-1/evidence/t15n-single-screen-closure/encoding-probe.json',JSON.stringify(output,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(output));
