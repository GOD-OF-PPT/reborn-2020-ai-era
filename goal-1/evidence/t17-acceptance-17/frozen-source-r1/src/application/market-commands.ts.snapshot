import { z } from 'zod'
import { defineCommand } from '../core/commands.ts'
import { idSchema as id,moneySchema } from '../core/record-schemas.ts'
import type { MarketIntent } from '../core/market-types.ts'
import type { MarketRuntime } from '../core/market.ts'
export function createMarketHandlers(runtime:MarketRuntime){
 const order={accountId:id,symbol:id,side:z.enum(['buy','sell']),quantity:z.number().int().min(1).max(1000000000),limitPriceFen:moneySchema.min(1),quoteId:id,validUntil:id}
 const schemas:Record<MarketIntent['kind'],z.ZodType>={PlaceStockOrder:z.strictObject(order),PlanStockOrder:z.strictObject(order),SubmitStockOrder:z.strictObject({orderId:id,quoteId:id}),CancelStockOrder:z.strictObject({orderId:id}),AmendStockOrder:z.strictObject({orderId:id,quantity:order.quantity,limitPriceFen:order.limitPriceFen,quoteId:id,validUntil:id}),ResearchMarket:z.strictObject({definitionId:id}),StopMarketResearch:z.strictObject({researchId:id}),UseHistoricalReplay:z.strictObject({})}
 return (Object.keys(schemas) as MarketIntent['kind'][]).map(kind=>defineCommand(kind,schemas[kind],(view,payload)=>runtime.inspect(view,{...(payload as object),kind} as MarketIntent,view.date),(model,payload,context)=>({model:runtime.apply(model,{...(payload as object),kind} as MarketIntent,context.commandId),summary:`模拟市场指令已处理：${kind}`,domain:'market'})))
}
