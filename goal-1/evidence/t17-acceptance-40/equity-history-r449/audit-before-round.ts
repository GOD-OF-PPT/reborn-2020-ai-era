import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {createCampaignCodec} from '../../../../.delivery/t17-u6-equity-history-r450/src/application/campaign.ts'
import {canonicalJson} from '../../../../.delivery/t17-u6-equity-history-r450/src/core/identity.ts'
const root='goal-1/evidence/t17-acceptance-40/equity-history-r449',codec=createCampaignCodec(),input=fs.readFileSync(root+'/normal-before-round-input.json','utf8'),actual=fs.readFileSync(root+'/qa-before-round-after450.ui-export.json','utf8'),hash=(v:string)=>createHash('sha256').update(v).digest('hex')
if(input!==actual+'\n'||hash(input)!=='5ee2c1fdc5cbb9999edaad1871d677ade51f7aba3f2e2d4571dce5a424d16120')throw Error('ORIGINAL_INPUT_OR_EXACT_LF_DIFFERENCE_CHANGED')
const before=codec.import(input),after=codec.import(actual)
if(codec.export(before)!==actual||codec.export(after)!==actual||canonicalJson(before)!==canonicalJson(after)||before.origin!=='normal'||before.revision!==94)throw Error('FULL_ORIGINAL_CODEC_IDENTITY_CHANGED')
const report={at:new Date().toISOString(),source:450,input:{bytes:Buffer.byteLength(input),sha256:hash(input)},actualUiExport:{bytes:Buffer.byteLength(actual),sha256:hash(actual)},rawBytesEqual:false,exactRawDifference:'One trailing LF in original producer input',canonicalOriginalCodecBytesEqual:true,wholeGameRunEqual:true,revision:94,originalInputPreserved:true,nativeNewGameCommands:0,compatibility:0,wholeU6Complete:false}
fs.writeFileSync(root+'/before-round-codec-audit.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(report)
