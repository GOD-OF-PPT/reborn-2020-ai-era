import { z } from 'zod'
import { FIRST_ORDER } from '../content/first-order.ts'
import { defineCommand } from '../core/commands.ts'
import { inspectFirstOrder,startFirstOrder,projectFirstOrder as project } from '../core/first-order.ts'
import type { OperationsRuntime } from '../core/operations.ts'
import type { WorldRuntime } from '../core/world.ts'
import type { GameRun } from '../core/run-types.ts'
export const projectFirstOrder=(run:GameRun)=>project(run,FIRST_ORDER)
export function createFirstOrderHandler(operations:OperationsRuntime,world:WorldRuntime){return defineCommand('StartFirstOrder',z.strictObject({}),(view)=>inspectFirstOrder(view,view.date,FIRST_ORDER,world),(model,_payload,context)=>({model:startFirstOrder(model,context.commandId,FIRST_ORDER,world,operations),summary:'手工首单已安排：开工、交付、验收与收款按实际日期处理',domain:'operations'}))}
