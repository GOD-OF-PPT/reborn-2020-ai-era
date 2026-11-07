import type {SceneTarget} from './game-types.ts'
import type {Screen} from './Navigation.tsx'

/** Explicit reading keeps the room origin; ordinary route navigation does not. */
export function roomReaderReturns(screen:Screen,target?:SceneTarget):boolean{
 return screen==='finance'||screen==='deepseek'||target?.returnToRoom===true&&(screen==='market'||screen==='life'||screen==='video')
}
