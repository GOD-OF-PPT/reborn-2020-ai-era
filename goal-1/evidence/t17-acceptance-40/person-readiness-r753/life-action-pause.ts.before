import type {GamePanelProps} from './game-types.ts'
import type {LifeSceneProgress} from './life-scene-progress.ts'

export interface LifeActionPauseReading {readonly title:string;readonly line:string}
/** Read-only framing for a new optional life activity. Existing invitations,
 * promises, running work and independent responsibilities keep their own lead. */
export function lifeActionPauseReading(p:Pick<GamePanelProps,'view'|'features'>,progress:LifeSceneProgress):LifeActionPauseReading|null {
 const {view,features}=p,w=features.workbench,b=view.budget
 if(view.phase!=='playing'||view.busy||view.readOnly||view.hasCandidate||view.saveStatus!=='saved'||b.available!==0||b.total!==4||b.quarter!==w.quarter||!Number.isSafeInteger(b.spent)||!Number.isSafeInteger(b.reserved)||b.spent<0||b.reserved<0||b.spent+b.reserved!==4||w.atQuarterEnd||w.pause||w.progression.requiresDelivery||progress.stage!=='ready'||progress.command?.kind!=='StartLifeWork'||progress.promise!==null)return null
 if(w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=view.date))||features.life.promises.some(p=>['offered','accepted'].includes(p.status))||features.story.incidents.some(i=>i.resolvedAt===null&&!['normal','resolved'].includes(i.stage)))return null
 return b.reserved>0?{title:'这季的行动，已经排进日历。',line:'预留仍属于原安排；现在可翻阅，等待时费用照常发生。'}:{title:'这季的四点，已经用完。',line:'仍可翻阅人物与原约定；等待期间，生活费照常发生。'}
}
