import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'

const root='goal-1/evidence/t17-acceptance-40/wait-feedback-r373',started=Date.now(),hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex')
if(fs.existsSync(root+'/stopped.json'))throw Error('ACTIVE_B5_REQUIRED')
const source=JSON.parse(fs.readFileSync(root+'/snapshot391.json','utf8'))
const exact=()=>source.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(source.target,r.path)))===r.sha256)
assert(exact())
const beforeWire=fs.readFileSync(root+'/native-r1/actual-before.json','utf8'),candidateWire=fs.readFileSync(root+'/native-r1/actual-candidate-before-fix.json','utf8')
assert.equal(hash(beforeWire),'81fd365fd9113d43ebf7a940db98f5365537c0c3cb42d37a4e89ce80615d90dc')
assert.equal(hash(candidateWire),'6d9ac06d4f208ad33f4880d7b13ffa13d261869bdb12d81944837364ba1c0904')
const at=(name:string)=>import(pathToFileURL(path.join(source.target,'src',name)).href)
const [{createCampaignCodec},{assertJsonInput,inspectJsonInput},{MAX_LOGICAL_SAVE_NODES}]=await Promise.all([at('application/campaign.ts'),at('core/json-input.ts'),at('persistence/save-limits.ts')])
const codec=createCampaignCodec()
console.log(JSON.stringify({phase:'validate-actual-native-before333'}))
const before=codec.import(beforeWire)
console.log(JSON.stringify({phase:'validate-actual-native-unsaved337'}))
const candidate=codec.import(candidateWire)
assert.equal(before.revision,333);assert.equal(candidate.revision,337);assert.equal(before.runId,candidate.runId)
const beforeNodes=inspectJsonInput(before,MAX_LOGICAL_SAVE_NODES),candidateNodes=inspectJsonInput(candidate,MAX_LOGICAL_SAVE_NODES)
assert(beforeNodes>300000&&candidateNodes>300000)
const rejected=(value:unknown)=>{try{assertJsonInput(value);return null}catch(e){return e instanceof Error?e.message:String(e)}}
const beforeError=rejected(before),candidateError=rejected(candidate)
console.log(JSON.stringify({phase:'compare-existing-node-domains',beforeNodes,candidateNodes,beforeError,candidateError}))
assert.equal(codec.export(before),beforeWire);assert.equal(codec.export(candidate),candidateWire)
const commands=candidate.receipts.slice(before.receipts.length).map((r:{payloadSignature:string;commandId:string;revisionBefore:number})=>({...JSON.parse(r.payloadSignature),commandId:r.commandId,expectedRevision:r.revisionBefore}))
assert.equal(commands.length,4);assert(commands.every((c:{kind:string})=>c.kind==='AdvanceTime'))
const report={at:new Date().toISOString(),source:source.target,sourceRows:source.files.length,sourceExact:exact(),wallMs:Date.now()-started,before:{revision:before.revision,date:before.timeline.cursor.date,nodes:beforeNodes,wireBytes:Buffer.byteLength(beforeWire),sha256:hash(beforeWire)},candidate:{revision:candidate.revision,date:candidate.timeline.cursor.date,nodes:candidateNodes,wireBytes:Buffer.byteLength(candidateWire),sha256:hash(candidateWire),saved:false},commands,ordinaryBeforeError:beforeError,ordinaryCandidateError:candidateError,existingSaveNodeLimit:MAX_LOGICAL_SAVE_NODES,fullNativeWiresExact:true,newGameCommands:0,newStoreWrites:0,compatibility:0,verdict:'real valid save history must not be checked as an ordinary command payload'}
fs.writeFileSync(root+'/large-budget-red.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
assert.doesNotThrow(()=>assertJsonInput(candidate),'A validated save-domain run is rejected by the ordinary payload check used by captureWaitCheckpoint')
