import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createCampaignCodec} from '../../../../.delivery/t17-u6-equity-history-r450/src/application/campaign.ts'
import {evaluateCommand} from '../../../../.delivery/t17-u6-equity-history-r450/src/core/commands.ts'
const root='goal-1/evidence/t17-acceptance-40/follow-rights-r451',codec=createCampaignCodec(),rows=fs.readFileSync(root+'/normal-author-commands.jsonl','utf8').trim().split('\n').map(x=>JSON.parse(x)),hash=(v:string)=>createHash('sha256').update(v).digest('hex')
let run=codec.import(fs.readFileSync('goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeEquitySign.json','utf8'))
assert.equal(rows.length,3)
for(const row of rows){const result=evaluateCommand(run,row.command,codec.registry,'player');assert.equal(result.status,'proposed');if(result.status!=='proposed')throw Error('ORIGINAL_COMMAND_REQUIRED');const wire=codec.export(result.nextRun);assert.equal(hash(wire),row.sha256);assert.equal(Buffer.byteLength(wire),row.bytes);run=codec.import(wire)}
assert.equal(run.revision,96);assert.equal(run.deepseek!.negotiations.at(-1)!.accepted,false)
fs.writeFileSync(root+'/normal-liquidity-rejected96.json',codec.export(run),{flag:'wx'});fs.writeFileSync(root+'/normal-author-refusal.json',JSON.stringify({source:450,originalCommands:3,allOriginalWiresByteEqual:true,revision:96,date:run.timeline.cursor.date,accepted:false,noNewAttempt:true,noSeedChange:true,normalPendingNative:'not_run',compatibility:0},null,2)+'\n',{flag:'wx'});console.log({revision:96,accepted:false,allOriginalWiresByteEqual:true,noNewAttempt:true})
