import {useState} from 'react'
import type {PlayFeatures} from './game-types.ts'
import {moneyText} from './game-text.ts'
export type SupportSelection={mode:string;deploymentId:string|null}
export function agentSupportMode(mode:string){return ['assisted','delegated','assisted_group','delegated_group'].includes(mode)}
export const supportModeText:Record<string,string>={guided:'集中支持',self:'限额自支持',guided_group:'集中支持',self_small:'限额自答疑',assisted:'衡星辅助支持',assisted_group:'衡星辅助支持',delegated:'衡星跨流程委托',delegated_group:'衡星跨流程委托'}
/** A support choice only selects an existing grant. It can never create or enlarge one. */
export function AgentSupportChoice({features,businessId,route,modeName,deploymentName,initial,value,onChange,routine=false}:{features:PlayFeatures;businessId:string;route:'course'|'relay';modeName?:string;deploymentName?:string;initial?:SupportSelection;value?:SupportSelection;onChange?:(v:SupportSelection)=>void;routine?:boolean}){
 const base=route==='course'?'guided_group':'guided',[local,setLocal]=useState<SupportSelection>(initial??{mode:base,deploymentId:null}),selection=value??local
 const deployments=features.story.deployments.filter(d=>d.businessId===businessId&&d.lifecycle==='active'&&d.currentGrant?.scopes.includes(route==='course'?'course_support':'relay_support')&&(!routine||d.currentGrant.level!=='approval'))
 const delegated=selection.mode==='delegated'||selection.mode==='delegated_group',available=deployments.filter(d=>!delegated||d.currentGrant?.level==='cross_flow'),selected=available.find(d=>d.id===selection.deploymentId)
 const set=(v:SupportSelection)=>{if(onChange)onChange(v);else setLocal(v)}
 return <div className="support-choice"><label className="field">支持方式<select name={modeName} value={selection.mode} onChange={e=>set({mode:e.target.value,deploymentId:null})}>
 <option value={base}>集中支持 · 原方案成本、行动与日期</option><option value={route==='course'?'self_small':'self'}>限额自支持 · 更多行动与日期</option>
 <option value={route==='course'?'assisted_group':'assisted'} disabled={deployments.length===0}>衡星辅助 · {route==='course'?'1500':'1000'}元 / 1点 / 4天</option>
 <option value={route==='course'?'delegated_group':'delegated'} disabled={!deployments.some(d=>d.currentGrant?.level==='cross_flow')}>跨流程委托 · {route==='course'?'1000':'700'}元 / 1点 / 2天</option></select></label>
 {agentSupportMode(selection.mode)?<><label className="field">本次明确使用的原部署<select required name={deploymentName} value={selected?.id??''} onChange={e=>set({...selection,deploymentId:e.target.value||null})}><option value="" disabled>请选择本主体已有权限，不自动扩权</option>{available.map(d=><option value={d.id} key={d.id}>{d.id.slice(-6)} · {d.currentGrant?.level==='cross_flow'?'跨流程':d.currentGrant?.level==='limited'?'有限步骤':'逐项确认'} · 至{d.currentGrant?.expiresAt}</option>)}</select></label>{selected?.currentGrant?<p className="field-help">原权限剩余额度{moneyText(selected.currentGrant.cashLimitFen-selected.currentGrant.committedFen)}；部署与月费另计。实际日期、全部槽位预算与原支持责任仍在提交前检查。</p>:null}</>:<input type="hidden" name={deploymentName} value=""/>}
 {deployments.length===0?<p className="field-help">没有当前可用的{routine?'有限自动':'本主体'}代理权限。可继续手动支持，或到“变化与处置”单独准备与授权。</p>:null}
 </div>
}
