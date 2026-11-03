import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {deflate} from 'pako'
import {json} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',out=root+'/save-capacity-r471',source=json(root+'/money-sum-r464/snapshot469.json'),count=Number(process.argv[2])
if(!Number.isSafeInteger(count) || count<1000 || count>60000 || fs.existsSync(out+'/fixture-'+count+'.json') || fs.existsSync(out+'/stopped.json')) throw Error('FRESH_BOUNDED_FIXTURE_REQUIRED')
const at=name=>import(pathToFileURL(path.join(source.target,'src',name)).href)
const [{createCampaignCodec,createCampaignRun},{canonicalJson},{hashText,utf8Length},{encodeDictionaryJson},{inspectJsonInput},limits]=await Promise.all([at('application/campaign.ts'),at('core/identity.ts'),at('core/hash.ts'),at('persistence/save-dictionary.ts'),at('core/json-input.ts'),at('persistence/save-limits.ts')])
const run=createCampaignRun({runId:'packing-capacity-only',actorId:'player',commandId:'create-fixture',backgroundId:'technical_employee',seed:'packing-fixture-v1'}),sealed=createCampaignCodec().seal(run)
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',chars=Array(200),words=[];let state=0x13579bdf
for(let index=0;index<count;index++){for(let j=0;j<200;j++){state=(Math.imul(state,1664525)+1013904223)>>>0;chars[j]=alphabet.charAt(state>>>26)}words.push(chars.join(''))}
// Packing-layer JSON only: the extra state member is not a legal campaign.
// Normal-run acceptance uses the separate original unwritten624 proposal.
const expanded={...run,packingCapacityOnly:[words,[...words]]},{checksum:omitted,...base}=sealed,body={...base,state:expanded},envelope={...body,checksum:hashText(canonicalJson(body))},logical=canonicalJson(envelope),logicalBytes=utf8Length(logical),nodes=inspectJsonInput(envelope,limits.MAX_LOGICAL_SAVE_NODES)
const legacy=deflate(new TextEncoder().encode(logical),{level:3}),tokens=encodeDictionaryJson(envelope,logicalBytes),{state:ignoredState,saveVersion:ignoredVersion,...metadata}=envelope,attempts=[]
for(const level of [3,9]){const compressed=deflate(tokens,{level}),document={...metadata,saveVersion:3,packing:'zlib-dictionary-v1',logicalBytes,packedBytes:tokens.length,payloadHash:hashText(logical),payload:Buffer.from(compressed).toString('base64')};attempts.push({level,compressedBytes:compressed.length,wireBytes:utf8Length(canonicalJson(document)),fits:utf8Length(canonicalJson(document))<=limits.MAX_ENCODED_SAVE_BYTES})}
const report={at:new Date().toISOString(),count,charactersPerWord:200,logicalBytes,nodes,legacyBase64Bytes:Math.ceil(legacy.length/3)*4,dictionaryBytes:tokens.length,attempts,encodedLimit:limits.MAX_ENCODED_SAVE_BYTES,packingOnlySyntheticFixtureNotNormalProof:true,newLiveGameCommands:0,productChanges:0,compatibility:0}
fs.writeFileSync(out+'/fixture-'+count+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(report)
