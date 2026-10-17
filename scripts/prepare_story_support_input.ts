import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from './evidence-output.ts'
import {createCampaignCodec,createCampaignRun} from '../src/application/campaign.ts'
import {StoryHarness} from '../src/testing/story-harness.ts'
import {previewCommand} from '../src/core/commands.ts'
const root=fileURLToPath(new URL('../',import.meta.url)),output=evidenceDirectory(root,'t14-support-ui-input-evidence.json'),sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex'),sourceFile=process.env.STORY_NATIVE_PREFIX_FILE??'goal-1/evidence/t14-ui-inputs-candidate/t14-input-technical-before-authority.json'
if(readdirSync(output).length)throw Error('EXISTING_T14_SUPPORT_INPUT_DIRECTORY: choose a fresh directory')
const sourceRaw=readFileSync(join(root,sourceFile),'utf8'),codec=createCampaignCodec(),source=codec.import(sourceRaw),creation=source.receipts[0]!
if(source.origin!=='normal'||creation.kind!=='CreateRun')throw Error('NORMAL_COMPLETE_PREFIX_REQUIRED')
function sources(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(i=>i.isDirectory()?sources(dir+'/'+i.name):/\.(tsx?|css)$/.test(i.name)?[dir+'/'+i.name]:[])}
const paths=[...sources('src'),'scripts/prepare_story_support_input.ts','scripts/evidence-output.ts','package.json','package-lock.json'],sourceHashes=Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(root,p)))]))
const initial=createCampaignRun({runId:source.runId,actorId:source.actorId,commandId:creation.commandId,backgroundId:source.backgroundId,seed:source.seed,playerProfile:source.playerProfile}),h=new StoryHarness({priorRun:initial})
let proposal:unknown=null
for(const r of source.receipts.slice(1)){const payload=JSON.parse(r.payloadSignature).payload;if(r.kind==='StartRelayServicePeriod'){proposal=payload;break}h.sendAs(r.kind,payload,r.commandId)}
if(proposal===null||h.run.relay!.periods.length||h.run.story!.supportUses.length)throw Error('FIRST_ASSISTED_PLAN_BOUNDARY_NOT_FOUND')
const preview=previewCommand(h.run,h.command('StartRelayServicePeriod',proposal),codec.registry,'player')
if(!preview.allowed||preview.upfrontCostFen!==400000||preview.actionPoints!==2)throw Error('ACTUAL_ASSISTED_PERIOD_NOT_PREVIEWABLE:'+JSON.stringify(preview))
const file='t14-input-relay-before-assisted-plan.json',raw=codec.export(h.run)+'\n';writeFileSync(join(output,file),raw,{flag:'wx'})
for(const p of paths)if(sourceHashes[p]!==sha(readFileSync(join(root,p))))throw Error('SOURCE_CHANGED_DURING_SUPPORT_INPUT_CAPTURE:'+p)
writeFileSync(join(output,'t14-support-ui-input-evidence.json'),JSON.stringify({taskId:'T14',evidenceType:'intact_normal_prefix_before_actual_assisted_support_plan',source:{file:sourceFile,sha256:sha(sourceRaw)},sourceHashes,input:{file,sha256:sha(raw),runId:h.run.runId,revision:h.run.revision,date:h.run.timeline.cursor.date,origin:h.run.origin,versions:h.run.versions},scope:'Original command IDs, payloads, salaries, costs, rights and dates replayed from CreateRun; stop before the first real service plan. No snapshot fields merged or edited; not native UI proof.',preview,notCovered:['actual_native_support_selection_or_completion','balance','full24quarter_campaign']},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:'INPUT_CAPTURED_NOT_UI_ACCEPTED',file,revision:h.run.revision,date:h.run.timeline.cursor.date,preview}))
