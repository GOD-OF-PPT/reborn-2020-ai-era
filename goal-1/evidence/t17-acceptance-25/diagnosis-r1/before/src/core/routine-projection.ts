import {copyJson} from './json-input.ts'
import type {GameRun} from './run-types.ts'
import type {RoutineRuntime} from './routines.ts'
export function projectRoutines(run:GameRun,runtime:RoutineRuntime){return run.routines?copyJson({plans:run.routines.plans,kinds:runtime.catalog.kinds,resources:[{id:'player-production',label:'本人时间'},...(run.operations?.workers.filter(w=>w.to===null).map(w=>({id:w.id,label:`员工${w.definitionId}`}))??[])]}):null}
export type RoutineProjection=ReturnType<typeof projectRoutines>
