import type { RunSession } from './session.ts'
import type { RunListing } from '../persistence/indexeddb.ts'
export interface GameSnapshot {readonly phase:'loading'|'home'|'playing'|'error';readonly runs:readonly RunListing[];readonly view:RunSession['view']|null;readonly error:string|null;readonly notice:string|null;readonly busy:boolean}
export const INITIAL_GAME_SNAPSHOT:GameSnapshot={phase:'loading',runs:[],view:null,error:null,notice:null,busy:false}
