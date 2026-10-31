import type {GameController} from './game-controller.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'

/** The renderer sees the same public controller surface, never a private run. */
export interface GameControllerPort extends Pick<GameController,keyof GameController>{
 readonly asynchronous?:true
 readonly runtimeSequence?:number
 readonly runtimeSession?:string
 readonly runtimeFailed?:boolean
 readonly runtimeWriteUncertain?:boolean
 readonly readingCount?:number
 subscribeReads?(listener:()=>void):()=>void
 previewAsync?(command:CommandEnvelope):Promise<CommandPreview>
 clockCommitmentsAsync?(command:CommandEnvelope):Promise<ReturnType<GameController['clockCommitments']>>
 exportSavedAsync?():Promise<string>
 exportCandidateAsync?():Promise<string>
 inspectImportAsync?(text:string):Promise<ReturnType<GameController['inspectImport']>>
}
