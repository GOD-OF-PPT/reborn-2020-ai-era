import type {RunListing} from '../persistence/indexeddb.ts'
const key='reborn-2020-last-life'
export function lastViewedLife():string|null{try{return localStorage.getItem(key)}catch{return null}}
export function rememberViewedLife(runId:string){try{localStorage.setItem(key,runId)}catch{/* The explicit library remains available when browser preferences cannot be stored. */}}
export function selectContinuation(runs:readonly RunListing[],lastId:string|null){return runs.find(r=>r.compatible&&r.runId===lastId)??runs.find(r=>r.compatible)}
