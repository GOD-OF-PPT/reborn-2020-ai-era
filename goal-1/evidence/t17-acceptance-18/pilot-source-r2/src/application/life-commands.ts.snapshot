import {z} from 'zod'
import {defineCommand} from '../core/commands.ts'
import {queueEvent} from '../core/timeline.ts'
import {idSchema} from '../core/record-schemas.ts'
import {lifeWorkKind,lifePersonId,lifePriority,lifeReferenceSchema} from '../core/life-schema.ts'
import type {LifeRuntime} from '../core/life.ts'

export function createLifeHandlers(runtime:LifeRuntime){
 const schema={
  StartLifeWork:z.strictObject({kind:lifeWorkKind.exclude(['promise_keep']),personId:lifePersonId.nullable(),reference:lifeReferenceSchema.nullable()}),
  FulfillLifePromise:z.strictObject({promiseId:idSchema}),InterruptLifeWork:z.strictObject({jobId:idSchema}),
  SetLifePriority:z.strictObject({year:z.number().int().min(2020).max(2025),priority:lifePriority}),
  AcceptLifePromise:z.strictObject({promiseId:idSchema,consent:z.literal(true)}),DeclineLifePromise:z.strictObject({promiseId:idSchema}),
 }
 const summaries:Record<string,string>={StartLifeWork:'生活工作已实际开始；完成与场景仍按真实日期处理。',FulfillLifePromise:'已实际安排兑现约定，工作尚未完成。',InterruptLifeWork:'生活工作已中断，已耗行动与成本保留。',SetLifePriority:'本年度生活关注已保存，不自动消费或安排。',AcceptLifePromise:'本次约定已接受，具体工作与支出仍需另行安排。',DeclineLifePromise:'已婉拒这次未接受的邀请，没有新增付款承诺。'}
 return Object.entries(schema).map(([kind,body])=>defineCommand(kind,body as z.ZodType<Record<string,unknown>>,(view,p)=>runtime.inspect(view,kind,p,view.date),(m,p,context)=>{
  const result=runtime.apply(m,kind,p,context);let timeline=m.timeline;for(const event of result.newEvents??[])timeline=queueEvent(timeline,event)
  return {model:{...m,...result.state,timeline},summary:summaries[kind]!,domain:'life'}
 }))
}
