import {createCampaignRun,createCampaignCodec,campaignRuntime} from '../application/campaign.ts'
import {evaluateCommand} from '../core/commands.ts'
import {quarterOf} from '../core/calendar.ts'
import {dayBefore,quarterLimit} from '../core/operations-calendar.ts'
import {actionBudget} from '../core/economy.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
/** Normal command history only. It does not add cash, qualifications or free capacity. */
export class StoryHarness {
 readonly codec=createCampaignCodec();readonly initial:GameRun;readonly commands:CommandEnvelope[]=[];run:GameRun
 constructor(options:{backgroundId?:string;seed?:string;priorRun?:GameRun}={}){
  const prior=options.priorRun;this.run=prior??createCampaignRun({runId:'t14-normal-'+(options.backgroundId??'technical_employee'),actorId:'player',commandId:'create',backgroundId:options.backgroundId??'technical_employee',seed:options.seed??'t14-linzhou-normal-0'})
  if(prior){if(prior.origin!=='normal')throw Error('NORMAL_PREHISTORY_REQUIRED');this.initial=createCampaignRun({runId:prior.runId,actorId:prior.actorId,commandId:prior.receipts[0]!.commandId,backgroundId:prior.backgroundId,seed:prior.seed,playerProfile:prior.playerProfile});this.commands.push(...prior.receipts.slice(1).map(r=>({...JSON.parse(r.payloadSignature),commandId:r.commandId,expectedRevision:r.revisionBefore})))}else this.initial=this.run
 }
 command(kind:string,payload:unknown):CommandEnvelope{return {runId:this.run.runId,actorId:'player',commandId:'t14-command-'+this.run.revision,expectedRevision:this.run.revision,kind,payload}}
 send(kind:string,payload:unknown){return this.sendAs(kind,payload,this.command(kind,payload).commandId)}
 sendAs(kind:string,payload:unknown,commandId:string){const c={...this.command(kind,payload),commandId},r=evaluateCommand(this.run,c,this.codec.registry,'player');if(r.status!=='proposed')throw Error(JSON.stringify({date:this.run.timeline.cursor.date,kind,payload,result:r}));this.commands.push(c);this.run=this.codec.import(this.codec.export(r.nextRun));return this.run}
 reject(kind:string,payload:unknown){const r=evaluateCommand(this.run,this.command(kind,payload),this.codec.registry,'player');if(r.status!=='rejected')throw Error('EXPECTED_REJECTION:'+kind);return r.reasonCodes}
 at(target:string,options:{prepareManualCase?:boolean;work?:boolean}={}){
  if(target<this.run.timeline.cursor.date)throw Error('STORY_HARNESS_CANNOT_BACKDATE')
  for(let guard=0;guard<600;guard++){
   const r=this.run,date=r.timeline.cursor.date,q=quarterOf(date),limit=quarterLimit(date)
   if(r.timeline.pause){if(r.timeline.pause.reason==='CONTENT_DECISION_PENDING'){const i=r.world!.instances.find(i=>i.openedBy===r.timeline.pause!.instanceId)!;this.send('ChooseEvent',{instanceId:i.id,choiceId:options.prepareManualCase&&i.definitionId==='PREP-CASE'?'prepare':campaignRuntime.definition(i.definitionId).defaultChoiceId})}else if(r.timeline.pause.reason==='CASH_SHORTFALL')this.send('AcknowledgeCashGap',{instanceId:r.timeline.pause.instanceId});else if(r.timeline.pause.reason==='STORY_RISK_DECISION_PENDING')this.send('AcknowledgeStoryPause',{instanceId:r.timeline.pause.instanceId});else throw Error('UNHANDLED_STORY_PAUSE:'+JSON.stringify(r.timeline.pause));continue}
   const employed=r.operations!.employment.some(e=>e.quarter===q&&e.segments.some(s=>s.to===null))
   if(options.work!==false&&!employed&&date<dayBefore(limit)&&actionBudget(r.economy,date).available>=2){this.send('WorkQuarter',{});continue}
   if(date===target&&r.timeline.cursor.phase==='snapshot')return this.run
   this.send('AdvanceTime',{date:target<limit?target:date===dayBefore(limit)?limit:dayBefore(limit)})
  }
  throw Error('STORY_NORMAL_CLOCK_GUARD')
 }
}
