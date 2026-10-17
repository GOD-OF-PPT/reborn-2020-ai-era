import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
export const dsLocked=(p:GamePanelProps)=>p.view.busy||p.view.readOnly||p.view.hasCandidate||p.view.saveStatus==='conflict'||p.controller.snapshot.busy
const statuses:Record<string,string>={planned:'已预留，未开工',running:'进行中',completed:'已实际完成',cancelled:'未开工安排已取消',interrupted:'已中断，已花成本保留'}
export function DeepseekJob({job,props}:{job:NonNullable<GamePanelProps['view']['operations']>['jobs'][number]|null;props:GamePanelProps}){return job?<div className="stack"><p>{statuses[job.status]} · {job.startAt}—{job.completeAt}</p>{['planned','running'].includes(job.status)?<div className="button-row"><button type="button" disabled={dsLocked(props)||props.features.workbench.pause!==null} onClick={()=>props.request('AdvanceTime',{date:job.completeAt},'推进到本项生态 / 架空投资任务完成')}>推进到本项任务完成</button><CommandButton {...props} kind="InterruptJob" payload={{jobId:job.id}} label="中断本项，保留成本与原义务" confirm/></div>:null}</div>:null}
export type DeepseekAssignment={resources:string[];startAt:string}
