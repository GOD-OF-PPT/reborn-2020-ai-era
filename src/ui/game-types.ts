import type {StoryProjection} from '../core/story-projection.ts'
import type {DeepseekProjection} from '../core/deepseek-projection.ts'
import type {RelayProjection} from '../core/relay-projection.ts'
import type {RoutineProjection} from '../core/routine-projection.ts'
import type { CourseProjection } from '../core/course-projection.ts'
import type { VideoProjection } from '../core/video-projection.ts'
import type { CommandEnvelope } from '../core/run-types.ts'
import type { GameController,GameSnapshot } from '../application/game-controller.ts'
import type { WorkbenchProjection } from '../application/workbench-projection.ts'
import type { projectFirstOrder } from '../application/first-order.ts'
import type { projectMarket } from '../core/market-projection.ts'
export type PlayingView=NonNullable<GameSnapshot['view']>
export interface PlayFeatures {readonly story:StoryProjection;readonly deepseek:DeepseekProjection;readonly relay:RelayProjection;readonly routines:RoutineProjection;readonly course:CourseProjection;readonly video:VideoProjection;readonly firstOrder:ReturnType<typeof projectFirstOrder>;readonly market:NonNullable<ReturnType<typeof projectMarket>>;readonly workbench:WorkbenchProjection}
export type RequestCommand=(kind:string,payload:unknown,label:string,confirm?:boolean)=>void
export interface GamePanelProps {readonly controller:GameController;readonly view:PlayingView;readonly features:PlayFeatures;readonly request:RequestCommand;readonly accountId:string}
export interface ConfirmIntent {readonly command:CommandEnvelope;readonly label:string}
