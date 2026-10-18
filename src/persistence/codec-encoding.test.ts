import {expect,it} from 'vitest'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {canonicalJson} from '../core/identity.ts'
import {hashValue,utf8Length} from '../core/hash.ts'
import {MAX_SAVE_BYTES} from './codec.ts'

function reversed(value:unknown):unknown{
 if(Array.isArray(value))return value.map(reversed)
 if(value!==null&&typeof value==='object')return Object.fromEntries(Object.entries(value).reverse().map(([key,v])=>[key,reversed(v)]))
 return value
}
it.each(['technical_employee','content_employee'])('preserves original canonical envelope bytes and noncanonical imports for %s',backgroundId=>{
 const codec=createCampaignCodec(),initial=createCampaignRun({runId:'encoding-'+backgroundId,actorId:'player',commandId:'create',backgroundId,seed:'encoding-引号"-\ud800'})
 const state=codec.validateRun({...initial,privateNotes:'中文🙂 "checksum":"不是根字段"\\\n\ud800'})
 const body={saveVersion:1 as const,...state.versions,runId:state.runId,revision:state.revision,state},expected=canonicalJson({...body,checksum:hashValue(body)})
 expect(codec.export(state)).toBe(expected)
 expect(codec.seal(state)).toEqual(JSON.parse(expected))
 const input=JSON.stringify(reversed(JSON.parse(expected)))
 expect(input).not.toBe(expected)
 expect(codec.export(codec.import(input))).toBe(expected)
 expect(codec.export(codec.readEnvelope(JSON.parse(input)).state)).toBe(expected)
})
it('retains checksum and header rejection in both text and unknown-object entry points',()=>{
 const codec=createCampaignCodec(),run=createCampaignRun({runId:'encoding-rejections',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'encoding-rejections'}),raw=JSON.parse(codec.export(run))
 const corrupt={...raw,checksum:'0'.repeat(64)}
 expect(()=>codec.import(JSON.stringify(corrupt))).toThrow('CORRUPT_SAVE')
 expect(()=>codec.readEnvelope(corrupt)).toThrow('CORRUPT_SAVE')
 const {checksum:_,...body}=raw,mismatch={...body,revision:body.revision+1},envelope={...mismatch,checksum:hashValue(mismatch)}
 expect(()=>codec.import(JSON.stringify(envelope))).toThrow('SAVE_HEADER_MISMATCH')
 expect(()=>codec.readEnvelope(envelope)).toThrow('SAVE_HEADER_MISMATCH')
 expect(()=>codec.import('{"saveVersion":1,"value":1e400}')).toThrow('INVALID_JSON_VALUE')
})
it('retains canonical UTF8 expansion limits before invalid-envelope or unsupported-version errors',()=>{
 const codec=createCampaignCodec(),padding='\ud800'.repeat(Math.floor(MAX_SAVE_BYTES/6)),text='{"padding":"'+padding+'","saveVersion":2}'
 expect(text.length).toBeLessThan(MAX_SAVE_BYTES)
 expect(utf8Length(text)).toBeLessThan(MAX_SAVE_BYTES)
 expect(()=>codec.import(text)).toThrow('SAVE_TOO_LARGE')
 expect(()=>codec.readEnvelope(JSON.parse(text))).toThrow('SAVE_TOO_LARGE')
})
