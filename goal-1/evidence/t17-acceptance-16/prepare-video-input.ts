import {writeFileSync} from 'node:fs'
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
import {assertBrowserEvidenceWritable} from '../../../scripts/browser_evidence_guard.mjs'

const root=new URL('./',import.meta.url),codec=createCampaignCodec()
assertBrowserEvidenceWritable(root.pathname)
let run=createCampaignRun({runId:'d11-video-navigation',actorId:'player',commandId:'d11-video-create',backgroundId:'technical_employee',seed:'d11-video-navigation',playerProfile:{wishId:'autonomy',approach:'free'}})
function send(kind:string,payload:unknown){
 const command={runId:run.runId,actorId:run.actorId,commandId:'d11-video-'+run.revision,expectedRevision:run.revision,kind,payload}
 const result=evaluateCommand(run,command,codec.registry,run.actorId)
 if(result.status!=='proposed')throw Error('NORMAL_VIDEO_INPUT_REJECTED:'+kind)
 run=codec.import(codec.export(result.nextRun))
}
send('OpenVideoChannel',{name:'原账号 · 日常记录',segment:'local_merchants'})
send('OpenVideoChannel',{name:'当前作品 · 街角短片',segment:'local_merchants'})
send('StartVideoWork',{channelId:run.video!.channels[1]!.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-02'})
assertBrowserEvidenceWritable(root.pathname)
writeFileSync(new URL('normal-two-channel-work.json',root),codec.export(run),{flag:'wx'})
console.log(JSON.stringify({origin:run.origin,revision:run.revision,commands:run.receipts.map(r=>r.kind),scope:'Normal Create plus 3 original commands, two public channels and a planned work in the second; not native Chrome prehistory.'}))
