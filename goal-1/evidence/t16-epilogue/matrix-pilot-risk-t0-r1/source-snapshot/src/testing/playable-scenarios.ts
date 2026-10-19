import { IDBFactory,IDBKeyRange } from 'fake-indexeddb'
import { GameController } from '../application/game-controller.ts'
import { createCampaignCodec } from '../application/campaign.ts'
import { playableAdvanceDate } from '../application/playable-advance.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { MemoryWriterAccess } from './memory-writer-access.ts'
import type { WorkbenchProjection } from '../application/workbench-projection.ts'
import type { projectMarket } from '../core/market-projection.ts'
import type { projectFirstOrder } from '../application/first-order.ts'
import type { CommandEnvelope } from '../core/run-types.ts'

export async function playNormalInvestmentHalfYear(backgroundId='technical_employee'){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:`t09-${backgroundId}`});let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s01-${backgroundId}-${++sequence}`}),commands:CommandEnvelope[]=[]
 try{
  await controller.initialize();await controller.newLife({backgroundId,playerProfile:{wishId:'autonomy',approach:'investment'},seed:`t09-s01-${backgroundId}`});const initial=codec.import(controller.exportSaved())
  const workbench=()=>controller.snapshot.view!.features.workbench as WorkbenchProjection
  const market=()=>controller.snapshot.view!.features.market as NonNullable<ReturnType<typeof projectMarket>>
  const send=async(kind:string,payload:unknown)=>{const cmd=controller.prepare(kind,payload),result=await controller.submit(cmd);if(result.status!=='saved')throw new Error(JSON.stringify({kind,result}));commands.push(cmd)}
  const advance=async(date:string)=>send('AdvanceTime',{date:playableAdvanceDate(workbench(),controller.snapshot.view!.date,date)})
  const reject=async(kind:string,payload:unknown)=>{const previous=controller.exportSaved(),result=await controller.submit(controller.prepare(kind,payload));if(result.status!=='rejected'||previous!==controller.exportSaved())throw new Error('Rejected intent changed the saved run');return result.reasonCodes[0]}
  await send('WorkQuarter',{});await advance('2020-01-02');await send('ResearchMarket',{definitionId:'market-overview'});await advance('2020-01-03');await send('ResearchMarket',{definitionId:'market-foundation-course'})
  const noExtraAction=await reject('ResearchMarket',{definitionId:'simulation-special-study'})
  await send('PlaceStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen:11988,quoteId:market().quoteId,validUntil:'SIM-CP-2020-01-10'})
  const noFutureCash=await reject('PlaceStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:200,limitPriceFen:11988,quoteId:market().quoteId,validUntil:'SIM-CP-2020-01-10'})
  async function finishQuarter(onPause?:()=>Promise<void>){let steps=0;while(!workbench().atQuarterEnd||workbench().pause){if(++steps>30)throw new Error('Quarter did not progress');const w=workbench();if(w.pause){if(w.pause.reason!=='CONTENT_DECISION_PENDING')throw new Error(JSON.stringify(w.pause));if(onPause)await onPause();const event=w.events.find(e=>e.isBlocking);if(!event)throw new Error('Missing visible decision');await send('ChooseEvent',{instanceId:event.id,choiceId:event.defaultChoiceId})}else await advance(w.quarterEnd)}}
  await finishQuarter();const first=controller.snapshot.view!,quarter={cashFen:first.accounts[0]!.cashFen,investmentValueFen:first.accounts[0]!.investmentValueFen,minimumCashFen:(first.features.firstOrder as ReturnType<typeof projectFirstOrder>).minimumCashFen,spent:first.budget.spent};const quarterSave=codec.import(controller.exportSaved())
  await advance('2020-04-01');await send('WorkQuarter',{});let noPastQuote:string|undefined
  await finishQuarter(async()=>{if(controller.snapshot.view!.date==='2020-06-11')noPastQuote=await reject('PlaceStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen:market().stocks.find(s=>s.symbol==='SIM-AI01')!.priceFen,quoteId:market().quoteId,validUntil:market().quoteId})})
  const continuation=controller.preview(controller.prepare('ResearchMarket',{definitionId:'simulation-special-study'}));const newActionAtEnd=continuation.allowed?'allowed_preview':continuation.reasonCodes[0];const lastWork=commands.filter(c=>c.kind==='WorkQuarter').at(-1)!;const endBefore=controller.exportSaved(),duplicateAtEnd=await controller.submit(lastWork);if(duplicateAtEnd.status!=='duplicate'||controller.exportSaved()!==endBefore)throw new Error('End boundary changed an existing receipt');
  const final=codec.import(controller.exportSaved()),actual={date:controller.snapshot.view!.date,cashFen:controller.snapshot.view!.accounts[0]!.cashFen,quantity:final.market!.positions[0]!.quantity,quarterSpent:controller.snapshot.view!.budget.spent,marketPoints:final.market!.lastMatchedIndex+1,salaryPayments:final.operations!.payroll.filter(p=>p.kind==='salary'&&p.amountFen>0).length,worldAnchors:final.world!.anchors.map(a=>a.id)}
  return {initial,quarterSave,final,commands,quarter,actual,boundary:{newActionAtEnd,duplicateAtEnd:duplicateAtEnd.status},rejections:{noExtraAction,noFutureCash,noPastQuote},versions:final.versions,seed:final.seed}
 }finally{await controller.close(true)}
}
