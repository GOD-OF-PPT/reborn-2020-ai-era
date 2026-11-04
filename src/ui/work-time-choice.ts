import type {GamePanelProps} from './game-types.ts'
import {playerThread,type PlayerThreadView} from './player-thread.ts'
import {researchRoomBrief} from './research-room-copy.ts'
import {workRoomCopy} from './work-room-copy.ts'

export interface WorkTimeChoice {readonly key:string;readonly available:number;readonly label:string}
/** Reading priority only. Original command previews still decide whether each
 * optional activity can actually begin, and the original clock stays reachable. */
export function workTimeChoiceFor(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView):WorkTimeChoice|null {
 if(p.view.phase!=='playing'||!workRoomCopy(p,thread)||thread.command||!thread.wait)return null
 const b=p.view.budget,w=p.features.workbench
 if(b.total!==4||b.quarter!==w.quarter||![b.available,b.spent,b.reserved].every(n=>Number.isSafeInteger(n)&&n>=0)||b.available+b.spent+b.reserved!==4||b.available===0)return null
 const period=p.view.operations!.employment.find(row=>row.id===thread.focus.entityId)
 if(!period||!period.segments.some(segment=>segment.to===null&&segment.from<=p.view.date))return null
 return {key:JSON.stringify([p.view.runId,'personal',period.id,w.quarter]),available:b.available,label:'安排工作之外的时间'}
}

/** A work-side choice keeps its original work focus. Reuse the original strict
 * research receipt reader for this exact start, preserving full text and frame. */
export function workTimeResearchBrief(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView,notice:Parameters<typeof researchRoomBrief>[2]):string|null {
 if(!workRoomCopy(p,thread)||p.view.receipts.at(-1)?.kind!=='ResearchMarket')return null
 const period=p.view.operations!.employment.find(row=>row.id===thread.focus.entityId)
 if(!period?.segments.some(row=>row.to===null&&row.from<=p.view.date))return null
 const matches=p.features.market.researches.filter(row=>row.definitionId==='market-overview'&&row.status==='running'&&row.startAt===p.view.date).flatMap(row=>{
  const original=playerThread(p,{runId:p.view.runId,kind:'market',accountId:'personal',entityId:row.id,entityKind:'research'}),brief=researchRoomBrief(p,original,notice)
  return brief?[brief+'预计'+row.completeAt+'完成。']:[]
 })
 return matches.length===1?matches[0]!:null
}
