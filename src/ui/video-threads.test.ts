import {expect,it} from 'vitest'
import {createVideoFixture} from '../testing/video-fixture.ts'
import {projectVideo} from '../core/video-projection.ts'
import {videoThreads} from './scene-thread-notes.ts'
import {videoSceneProgress} from './video-scene-progress.ts'
import {moneyText} from './game-text.ts'

function projection(){
 const f=createVideoFixture();let run=f.run
 const send=(kind:string,payload:unknown)=>{run=f.apply(run,kind,payload)}
 send('OpenVideoChannel',{name:'灯下作品',segment:'local_merchants'})
 const channelId=run.video!.channels[0]!.id
 send('StartVideoMarketing',{channelId,resources:['player-production'],startAt:'2020-01-01'});send('AdvanceTime',{date:'2020-01-08'})
 const cohort=run.video!.cohorts[0]!
 send('AcceptVideoCommission',{channelId,cohortId:cohort.id,clientId:cohort.qualifiedMembers[0],modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-08'})
 return {video:projectVideo(run,f.video)!,channelId}
}
/** Bounded public display variants exercise visibility, not valid encoded histories or normal-player outcomes. */
it('retains every video contract beyond the ordinary highlight budget and distinguishes original prepayment from current protection',()=>{
 const {video}=projection(),base=video.contracts[0]!
 const display={...video,contracts:Array.from({length:9},(_,i)=>({...base,id:'public-contract-'+i,prepaymentFen:90000,status:i===7?'cancelled' as const:i===8?'settled' as const:base.status,paidCase:i===8}))}
 const raw=JSON.stringify(display),notes=videoThreads(display,'2020-01-08')
 expect(notes).toHaveLength(7);expect(new Set(notes.map(n=>n.id)).size).toBe(7)
 expect(notes.every(n=>n.detail.includes('原预款'+moneyText(90000))&&n.detail.includes('当前保护与欠款以原账为准'))).toBe(true)
 expect(JSON.stringify(display)).toBe(raw)
})
it('keeps unpaid original fees visible after contract settlement without repeating a settled contract with no remaining obligation',()=>{
 const {video}=projection(),base=video.contracts[0]!
 const notes=videoThreads({...video,contracts:[{...base,status:'settled',paidCase:false},{...base,id:'fully-paid',status:'settled',paidCase:true}]},'2020-01-08')
 expect(notes).toHaveLength(1);expect(notes[0]!.detail).toContain('仍须处理原账未付费用');expect(notes[0]!.detail).not.toContain('前交付')
})
it('keeps pending publication, finite affiliate observation and actual receivable as distinct public stages',()=>{
 const {video,channelId}=projection()
 const publication={id:'public-publication',channelId,workId:video.works[0]!.id,publishedAt:'2020-01-08',measureAt:'2020-01-15',monetization:'affiliate' as const,labelAttached:true,qualified:true,permissionId:'public-permission',retentionBps:0,measuredAt:null,unlistedAt:null,views:0,followers:0,qualifiedInquiries:0,cohortId:null,settlementId:null}
 const noWork={...video,works:[],contracts:[],publications:[publication]}
 expect(videoThreads(noWork,'2020-01-08')[0]!.detail).toContain('2020-01-15统计实际反馈')
 expect(videoSceneProgress(noWork,'2020-01-08')!.title).toContain('回应还在路上')
 const measured={...noWork,publications:[{...publication,measuredAt:'2020-01-15'}]}
 expect(videoThreads(measured,'2020-01-21')[0]!.detail).toContain('退货观察至2020-01-22')
 expect(videoSceneProgress(measured,'2020-01-21')!.command).toBeUndefined()
 expect(videoThreads(measured,'2020-01-22')).toHaveLength(0)
 const settlement={id:'public-settlement',channelId,publicationId:publication.id,kind:'affiliate' as const,grossMerchandiseFen:19900,amountFen:1900,feeFen:95,confirmedAt:'2020-01-22',dueAt:'2020-01-29',collectedAt:null,retained:1,returned:0}
 const receivable={...measured,publications:[{...measured.publications[0]!,settlementId:settlement.id}],settlements:[settlement]}
 const notes=videoThreads(receivable,'2020-01-22')
 expect(notes).toHaveLength(1);expect(notes[0]!.detail).toContain('已确认'+moneyText(1900));expect(notes[0]!.detail).toContain('原手续费'+moneyText(95));expect(notes[0]!.detail).toContain('商品成交额不计为佣金')
 expect(videoSceneProgress(receivable,'2020-01-22')!.choice.line).toContain('2020-01-29')
 expect(videoThreads({...receivable,settlements:[{...settlement,collectedAt:'2020-01-29'}]},'2020-01-29')).toHaveLength(0)
})
