import type { CourseProjection } from '../core/course-projection.ts'
import type { VideoProjection } from '../core/video-projection.ts'
import type { CommandEnvelope } from '../core/run-types.ts'
import type { GameController,GameSnapshot } from '../application/game-controller.ts'
import type { WorkbenchProjection } from '../application/workbench-projection.ts'
import type { projectFirstOrder } from '../application/first-order.ts'
import type { projectMarket } from '../core/market-projection.ts'
export type PlayingView=NonNullable<GameSnapshot['view']>
export interface PlayFeatures {readonly course:CourseProjection;readonly video:VideoProjection;readonly firstOrder:ReturnType<typeof projectFirstOrder>;readonly market:NonNullable<ReturnType<typeof projectMarket>>;readonly workbench:WorkbenchProjection}
export type RequestCommand=(kind:string,payload:unknown,label:string,confirm?:boolean)=>void
export interface GamePanelProps {readonly controller:GameController;readonly view:PlayingView;readonly features:PlayFeatures;readonly request:RequestCommand;readonly accountId:string}
export interface ConfirmIntent {readonly command:CommandEnvelope;readonly label:string}
