import {canonicalJson} from '../core/identity.ts'
import type {GamePanelProps,PlayingView} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
export interface RetiredRoomNotice {readonly runId:string;readonly revision:number;readonly notice:string}
const lifeStartNotice='生活工作已实际开始；完成与场景仍按真实日期处理。'
const identity=(focus:OpeningFocus)=>canonicalJson(JSON.parse(JSON.stringify(focus)))

/** Explicit reading choices only. Automatic result following has its own callback. */
export function explicitFocusChangesObject(p:Input,previous:OpeningFocus|null|undefined,next:OpeningFocus|null):boolean {
 if(p.view.busy||p.view.hasCandidate||!['saved','read_only'].includes(p.view.saveStatus))return false
 const chosen=next??{runId:p.view.runId,kind:'free' as const,accountId:'personal',entityId:null}
 if(chosen.runId!==p.view.runId)return false
 const selected=playerThread(p,chosen,p.features.workbench.quarter)
 if(selected.focusStatus==='invalid')return false
 return identity(playerThread(p,previous).focus)!==identity(selected.focus)
}

/** Only this known ordinary acknowledgement can outlive a dismissed life echo.
 * Unknown notices and responsibility messages are never retired by this layer. */
export function retireRoomAcknowledgement(view:Pick<PlayingView,'runId'|'revision'>,notice:string|null):RetiredRoomNotice|null {
 return notice===lifeStartNotice?{runId:view.runId,revision:view.revision,notice}:null
}

export function roomNoticeAfterFocus(view:Pick<PlayingView,'runId'|'revision'>,notice:string|null,retired:RetiredRoomNotice|null):string|null {
 return notice===lifeStartNotice&&retired?.notice===notice&&retired.runId===view.runId&&retired.revision===view.revision?null:notice
}
