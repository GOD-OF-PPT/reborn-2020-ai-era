import {expect,it} from 'vitest'
import {storySceneProgress} from './story-scene-progress.ts'
import {createPublicRiskIncident as incident,createPublicRiskInvestigation as job,createPublicRiskSceneFixture as story} from '../testing/public-risk-scene-fixture.ts'

/** These complete typed public variants test presentation, not earned normal histories. */
function freeze<T>(value:T):T{
 if(value!==null&&typeof value==='object'){
  Object.freeze(value)
  for(const child of Object.values(value))freeze(child)
 }
 return value
}

it('has no letter or invented local crisis when the public story contains no incident',()=>{
 expect(storySceneProgress(story(),'2025-04-08')).toBeNull()
})
it('keeps an explicitly selected historical letter ahead of a different active pause',()=>{
 const historical=incident({id:'historical',sourceEventId:'old-source',stage:'normal',verdict:'ordinary',openedAt:'2025-03-01'}),active=incident({id:'active'})
 const p=storySceneProgress(story([historical,active]),'2025-04-08',historical.id,active.sourceEventId)!
 expect(p.incident).toBe(historical);expect(p.phase).toBe('reviewed')
})
it('selects a pause by the original source event or a later public signal source, not the incident ID',()=>{
 const first=incident({id:'first',sourceEventId:'first-event',deadline:'2025-04-12'}),second=incident({id:'second',sourceEventId:'second-event',signals:[{id:'later-signal',date:'2025-04-09',deploymentId:null,sourceEventId:'later-event',source:'external_notice',text:'后来出现的公开通知。'}]})
 for(const source of ['second-event','later-event'])expect(storySceneProgress(story([first,second]),'2025-04-10','missing',source)?.incident.id).toBe(second.id)
 expect(storySceneProgress(story([first,second]),'2025-04-10',null,second.id)?.incident.id).toBe(first.id)
})
it('uses the earliest active deadline, keeps ties stable, and leaves every public record unchanged',()=>{
 const later=incident({id:'later',deadline:'2025-04-20'}),first=incident({id:'first',deadline:'2025-04-18'}),tie=incident({id:'tie',deadline:'2025-04-18'}),projection=freeze(story([later,first,tie])),before=JSON.stringify(projection)
 expect(storySceneProgress(projection,'2025-04-10')?.incident.id).toBe(first.id)
 expect(storySceneProgress(projection,'2025-04-10','tie')?.incident.id).toBe(tie.id)
 expect(JSON.stringify(projection)).toBe(before)
})
it('returns the latest actual history when there is no active case, including a later completion of an older letter',()=>{
 const newerOpening=incident({id:'newer-opening',stage:'resolved',verdict:'legitimate',kind:'external_claim',openedAt:'2025-04-02',resolvedAt:'2025-04-05'}),laterResult=incident({id:'later-result',stage:'normal',verdict:'normal',openedAt:'2025-03-20'},job({status:'completed',result:'normal',startAt:'2025-04-04',completeAt:'2025-04-07'}))
 expect(storySceneProgress(story([laterResult,newerOpening]),'2025-04-08')?.incident.id).toBe(laterResult.id)
})
it('leaves an unknown external letter unverified and does not invent an investigation',()=>{
 const original=incident({kind:'external_claim'}),p=storySceneProgress(story([original]),'2025-04-08')!
 expect(p.phase).toBe('signal');expect(p.completeAt).toBeNull();expect(p.incident.verdict).toBe('unknown');expect(p.title).not.toContain('已核实');expect(p.line).toContain('仍待独立核对')
})
it('shows only the actual running investigation dates and no early assessment',()=>{
 const original=incident({stage:'investigating'},job()),p=storySceneProgress(story([original]),'2025-04-09')!
 expect(p.phase).toBe('waiting');expect(p.completeAt).toBe('2025-04-11');expect(p.line).toContain('2025-04-08—2025-04-11');expect(p.deadlineWarning).toBeNull()
})
it('requires both actual completion and a revealed result before showing assessment',()=>{
 const noResult=incident({stage:'investigating'},job({status:'completed',result:null})),future=incident({stage:'investigating'},job({status:'completed',result:'violation',completeAt:'2025-04-12'})),complete=incident({stage:'investigating'},job({status:'completed',result:'ordinary'}))
 expect(storySceneProgress(story([noResult]),'2025-04-11')?.phase).toBe('signal')
 expect(storySceneProgress(story([future]),'2025-04-11')?.phase).toBe('signal')
 const p=storySceneProgress(story([complete]),'2025-04-11')!
 expect(p.phase).toBe('assessment');expect(p.completeAt).toBe('2025-04-11');expect(p.incident.verdict).toBe('unknown')
})
it('warns when a proposed or actual completion reaches the default deadline without disabling late investigation',()=>{
 const original=incident({deadline:'2025-04-11'}),proposed=storySceneProgress(story([original]),'2025-04-08')!
 expect(proposed.phase).toBe('signal');expect(proposed.completeAt).toBeNull();expect(proposed.deadlineWarning).toContain('2025-04-11');expect(proposed.deadlineWarning).toContain('默认处置可能先发生')
 const waiting=storySceneProgress(story([incident({deadline:'2025-04-11',stage:'investigating'},job())]),'2025-04-09')!
 expect(waiting.phase).toBe('waiting');expect(waiting.deadlineWarning).not.toBeNull()
 const late=storySceneProgress(story([original]),'2025-04-12')!
 expect(late.phase).toBe('signal');expect(late.deadlineWarning).toContain('不会顺延')
})
it('keeps a completed but unconfirmed report distinct from a past default disposition',()=>{
 const original=incident({deadline:'2025-04-12',stage:'unresolved'},job({status:'completed',result:'ordinary',completeAt:'2025-04-11'})),p=storySceneProgress(story([original]),'2025-04-13')!
 expect(p.phase).toBe('assessment');expect(p.deadlineWarning).toContain('已经到来');expect(p.incident.stage).toBe('unresolved');expect(p.incident.verdict).toBe('unknown')
})
it('does not turn an interrupted investigation or default stop into a restarted or completed job',()=>{
 const original=incident({stage:'unresolved',declinedAt:'2025-04-22'},job({status:'interrupted',result:null})),p=storySceneProgress(story([original]),'2025-04-23')!
 expect(p.phase).toBe('signal');expect(p.completeAt).toBeNull();expect(p.title).toContain('停在了半路');expect(p.line).toContain('另行决定');expect(p.incident.jobs.investigate?.status).toBe('interrupted')
})
it('shows known ordinary or identity findings as this case only, with original money and responsibilities retained',()=>{
 for(const verdict of ['normal','ordinary','fraud','legitimate'] as const){
  const claim=verdict==='fraud'||verdict==='legitimate',original=incident({kind:claim?'external_claim':'agent',stage:claim?'resolved':'normal',verdict,resolvedAt:claim?'2025-04-11':null},job({status:'completed',result:verdict})),p=storySceneProgress(story([original]),'2025-04-12')!
  expect(p.phase).toBe('reviewed');expect(p.completeAt).toBeNull();expect(p.deadlineWarning).toBeNull();expect(p.line).toContain('本次')
  if(claim){expect(p.line).toContain('应收');expect(p.line).toContain('没有新增')}
  else{expect(p.line).toMatch(/费用|成本/);expect(p.line).toMatch(/未来/)}
 }
})
it('does not offer another assessment for an already confirmed violation or imply that takeover restored full control',()=>{
 const confirmed=incident({stage:'confirmed',verdict:'violation'},job({status:'completed',result:'violation'})),handling=storySceneProgress(story([confirmed]),'2025-04-12')!
 expect(handling.phase).toBe('handling');expect(handling.completeAt).toBeNull();expect(handling.line).toContain('停止自报不等于')
 const taken=incident({stage:'takeover',verdict:'violation',resolvedAt:'2025-04-18',externalManager:true}),past=storySceneProgress(story([taken]),'2025-04-20')!
 expect(past.phase).toBe('handling');expect(past.line).toContain('外部托管');expect(past.line).toContain('旧责任未清空')
})
it('keeps a newly started re-investigation separate from an older known verdict until the new report is confirmed',()=>{
 const known=incident({stage:'investigating',verdict:'violation'},job()),waiting=storySceneProgress(story([known]),'2025-04-09')!
 expect(waiting.phase).toBe('waiting');expect(waiting.incident.verdict).toBe('violation')
 const finished=incident({stage:'investigating',verdict:'violation'},job({status:'completed',result:'ordinary'})),report=storySceneProgress(story([finished]),'2025-04-11')!
 expect(report.phase).toBe('assessment');expect(report.incident.verdict).toBe('violation');expect(report.incident.jobs.investigate?.result).toBe('ordinary')
})
it('does not use an older completed investigation to dismiss a later independent signal',()=>{
 const original=incident({stage:'confirmed',verdict:'violation',signals:[{id:'new-independent-signal',date:'2025-04-12',deploymentId:null,sourceEventId:'new-independent-event',source:'independent_statement',text:'旧报告完成之后新增的一份独立记录。'}]},job({status:'completed',result:'violation'})),p=storySceneProgress(story([original]),'2025-04-12')!
 expect(p.phase).toBe('signal');expect(p.completeAt).toBeNull();expect(p.incident.verdict).toBe('violation');expect(p.line).toContain('旧报告');expect(p.line).toContain('另行调查')
})
it('does not treat a later system report or an unreached signal date as new independent evidence',()=>{
 for(const signal of [{id:'self-report',date:'2025-04-12',deploymentId:null,sourceEventId:'self-report-event',source:'system_report' as const,text:'后来的一条系统自报。'},{id:'future-signal',date:'2025-04-13',deploymentId:null,sourceEventId:'future-event',source:'external_notice' as const,text:'只作显示边界的未来日期变体。'}]){
  const original=incident({stage:'confirmed',verdict:'violation',signals:[signal]},job({status:'completed',result:'violation'}))
  expect(storySceneProgress(story([original]),'2025-04-12')?.phase).toBe('handling')
 }
})
it('keeps an interrupted re-investigation actionable while retaining the older known assessment',()=>{
 for(const verdict of ['ordinary','violation'] as const){
  const original=incident({stage:'investigating',verdict},job({status:'interrupted',result:null})),p=storySceneProgress(story([original]),'2025-04-12')!
  expect(p.phase).toBe('signal');expect(p.completeAt).toBeNull();expect(p.incident.verdict).toBe(verdict);expect(p.line).toContain('此前已核对的结论保留');expect(p.line).toContain('重新调查已经中断')
 }
})
