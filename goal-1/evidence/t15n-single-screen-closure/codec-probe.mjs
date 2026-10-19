/** Differential evidence for real envelopes and strict scheduled payloads, not browser acceptance. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {createCampaignCodec,createCampaignRun} from '../../../src/application/campaign.ts';
import {eventSchema} from '../../../src/persistence/schemas.ts';
import {hashValue} from '../../../src/core/hash.ts';
import {canonicalJson} from '../../../src/core/identity.ts';
const out=process.argv[2];if(!out)throw Error('FRESH_OUTPUT_REQUIRED');mkdirSync(out,{recursive:false});
const sha=x=>createHash('sha256').update(x).digest('hex'),codec=createCampaignCodec();
const old='goal-1/evidence/t15n-cinematic-closure/diagnosis/ordinary-sampled/';
const sources=['ordinary-prepared.json','ordinary-final.json'].map(name=>({name,text:readFileSync(old+name,'utf8')}));
for(const backgroundId of ['technical_employee','content_employee'])sources.push({name:backgroundId,text:codec.export(createCampaignRun({runId:'t15n-probe-'+backgroundId,actorId:'player',commandId:'create',backgroundId,seed:'t15n-probe'}))});
const records=[],cases=[];
function result(label,fn){try{const value=fn();cases.push({label,status:'accepted',sha256:sha(typeof value==='string'?value:canonicalJson(value))})}catch(e){cases.push({label,status:'rejected',error:e.code??e.message})}}
for(const source of sources){
 result(source.name+':canonical-import',()=>codec.export(codec.import(source.text)));
 result(source.name+':object-entry',()=>codec.export(codec.readEnvelope(JSON.parse(source.text)).state));
 const raw=JSON.parse(source.text);records.push(...raw.state.timeline.pending,...raw.state.timeline.receipts.map(r=>JSON.parse(r.signature)));
 const market=raw.state.timeline.pending.findIndex(e=>e.payload.kind==='market_event');if(market<0)throw Error('REAL_MARKET_PENDING_REQUIRED');
 const variants={
  'extra-payload-field':r=>{r.state.timeline.pending[market].payload.extra='unexpected'},
  'cross-kind-fields':r=>{r.state.timeline.pending[market].payload.kind='story_event'},
  'unknown-kind':r=>{r.state.timeline.pending[market].payload.kind='unknown'},
  'bad-event-type':r=>{r.state.timeline.pending[market].payload.type='finish_job'},
  'fraction-priority':r=>{r.state.timeline.pending[market].priority=0.5},
  'negative-max-priority':r=>{r.state.timeline.pending[market].priority=-Number.MAX_SAFE_INTEGER},
  'bad-reference':r=>{r.state.timeline.pending[market].payload.entityId='missing-point'},
  'payload-date-mismatch':r=>{r.state.timeline.pending[market].payload.date='2026-01-01'},
  'same-duplicate':r=>{r.state.timeline.pending.push(structuredClone(r.state.timeline.pending[market]))},
  'changed-duplicate':r=>{const e=structuredClone(r.state.timeline.pending[market]);e.priority++;r.state.timeline.pending.push(e)},
  'order-and-shape-error':r=>{r.state.timeline.pending.reverse();r.state.timeline.pending[0].payload.extra=true},
  'order-only':r=>{r.state.timeline.pending.reverse()},
 };
 for(const [name,change] of Object.entries(variants)){const r=structuredClone(raw);change(r);const {checksum:_,...body}=r;r.checksum=hashValue(body);result(source.name+':'+name,()=>codec.import(JSON.stringify(r)))}
}
const payloadCases=[];
for(const event of records){for(const variant of ['original','extra-field','wrong-kind','missing-date','wrong-type']){const e=structuredClone(event);if(variant==='extra-field')e.payload.unexpected=true;if(variant==='wrong-kind')e.payload.kind='unknown';if(variant==='missing-date')delete e.payload.date;if(variant==='wrong-type')e.payload.type='unknown';const parsed=eventSchema.safeParse(e);payloadCases.push({kind:event.payload.kind,variant,accepted:parsed.success,...(parsed.success?{sha256:sha(canonicalJson(parsed.data))}:{})})}}
// Same real chronological mix in both runs. Timing is Node schema parsing only.
const timings=[];for(let round=0;round<4;round++){const started=performance.now();let accepted=0;for(let n=0;n<8;n++)for(const e of records){if(eventSchema.safeParse(e).success)accepted++;else throw Error('ORIGINAL_EVENT_REJECTED')}timings.push({round,events:accepted,ms:performance.now()-started})}
writeFileSync(out+'/probe.json',JSON.stringify({scope:'Codec and event-shape differential; no game, timing or validation assertions weakened',sourceSHA256:Object.fromEntries(sources.map(x=>[x.name,sha(x.text)])),cases,payloadCases,timings},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cases:cases.length,payloadCases:payloadCases.length,timings}));
