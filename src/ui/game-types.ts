import type {EndingProjection} from '../core/ending-projection.ts'
import type {projectJourney} from '../core/journey.ts'
import type {StoryProjection} from '../core/story-projection.ts'
import type {LifeProjection} from '../core/life-projection.ts'
import type {LifePerson} from '../core/life-schema.ts'
import type {Screen} from './Navigation.tsx'
import type {DeepseekProjection} from '../core/deepseek-projection.ts'
import type {RelayProjection} from '../core/relay-projection.ts'
import type {RelayCasebookHistory} from '../application/relay-casebook-projection.ts'
import type {RoutineProjection} from '../core/routine-projection.ts'
import type { CourseProjection } from '../core/course-projection.ts'
import type { VideoProjection } from '../core/video-projection.ts'
import type { CommandEnvelope } from '../core/run-types.ts'
import type { GameController,GameSnapshot } from '../application/game-controller.ts'
import type { WorkbenchProjection } from '../application/workbench-projection.ts'
import type { projectFirstOrder } from '../application/first-order.ts'
import type { projectMarket } from '../core/market-projection.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import type {VideoSceneDraftMemory} from './video-scene-draft.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import type {CourseSceneDraftMemory,CourseSceneDraftSlot} from './course-scene-draft.ts'
import type {CourseTeachingDraftMemory,CourseTeachingDraftSlot} from './course-teaching-draft.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import type {RelaySceneDraftMemory} from './relay-scene-draft.ts'
import type {RelayChoiceDraftSlot,RelayPreparationDraftMemory} from './relay-preparation-draft.ts'
import type {RelayResponseDraftMemory} from './relay-response-draft.ts'
import type {RelayRecordMemory} from './relay-record-memory.ts'
export type PlayingView=NonNullable<GameSnapshot['view']>
export interface PlayFeatures {readonly journey?:(NonNullable<ReturnType<typeof projectJourney>>&{ending?:EndingProjection|null})|null;readonly life:LifeProjection;readonly story:StoryProjection;readonly deepseek:DeepseekProjection;readonly relay:(NonNullable<RelayProjection>&{readonly casebook?:RelayCasebookHistory})|null;readonly routines:RoutineProjection;readonly course:CourseProjection;readonly video:VideoProjection;readonly firstOrder:ReturnType<typeof projectFirstOrder>;readonly market:NonNullable<ReturnType<typeof projectMarket>>;readonly workbench:WorkbenchProjection}
export type RequestCommand=(kind:string,payload:unknown,label:string,confirm?:boolean)=>void
export type LifeSceneMode='person'|'rest'|'workspace'
export interface SceneTarget {roomView?:'today';accountId?:string;personId?:LifePerson;lifeSelection?:LifeSceneMode;deepseekPane?:'ecosystem'|'equity';recordId?:string;videoTarget?:VideoSceneTarget;courseTarget?:CourseSceneTarget|null;courseDraftSlot?:CourseSceneDraftSlot;courseTeachingSlot?:CourseTeachingDraftSlot;relayTarget?:RelaySceneTarget|null;relayDraftSlot?:RelayChoiceDraftSlot;openRecord?:boolean}
export type NavigateScene=(screen:Screen,target?:SceneTarget)=>void
export interface GamePanelProps {readonly controller:GameController;readonly view:PlayingView;readonly features:PlayFeatures;readonly request:RequestCommand;readonly accountId:string;readonly textOnly?:boolean;readonly videoDraftMemory?:VideoSceneDraftMemory;readonly courseDraftMemory?:CourseSceneDraftMemory;readonly courseTeachingDraftMemory?:CourseTeachingDraftMemory;readonly relayDraftMemory?:RelaySceneDraftMemory;readonly relayPreparationDraftMemory?:RelayPreparationDraftMemory;readonly relayResponseDraftMemory?:RelayResponseDraftMemory;readonly relayRecordMemory?:RelayRecordMemory}
export interface ConfirmIntent {readonly command:CommandEnvelope;readonly label:string}
