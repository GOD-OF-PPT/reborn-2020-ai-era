import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread,openingFocusFor,type OpeningFocus} from './player-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {DayThreadAction} from './DayThreadAction.tsx'
import {DayContinuityPaper} from './DayContinuityPaper.tsx'
import {marketOrderRoomCopy,marketOrderWaitBrief} from './market-order-room.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {SceneTimeNotice} from './SceneEcho.tsx'

// Normal in-memory kernel proposals and public UI only. No persistence or codec.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'market-order-room-ui',actorId:'player',commandId:'create',seed:'market-order-room-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'investment'}})
const features=(run:GameRun)=>registry.runtime!.project!(run) as unknown as PlayFeatures
function act(run:GameRun,kind:string,payload:unknown={}){
 const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'order-ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId)
 if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(result))
 return result.nextRun
}
function until(run:GameRun,date:string,ready:(run:GameRun)=>boolean=()=>true){
 for(let n=0;n<30;n++){
  const f=features(run)
  if(f.workbench.pause){const event=f.workbench.events.find(row=>row.isBlocking)!,choice=event.choices.find(row=>row.isDefault)!;run=act(run,'ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(run.timeline.cursor.date>=date&&ready(run))return run
  run=act(run,'AdvanceTime',{date})
 }
 throw Error('NORMAL_CALENDAR_LIMIT')
}
function payload(run:GameRun,side:'buy'|'sell'='buy',quantity=600){
 const market=features(run).market,stock=market.stocks.find(row=>row.symbol==='SIM-AI02')!
 return {accountId:'personal',symbol:stock.symbol,side,quantity,limitPriceFen:side==='buy'?stock.upperFen!:stock.lowerFen!,quoteId:market.quoteId!,validUntil:market.matchingCalendar[2]!.id}
}
const planned=act(initial,'PlanStockOrder',payload(initial)),orderId=features(planned).market.orders[0]!.id
const pending=act(planned,'SubmitStockOrder',{orderId,quoteId:features(planned).market.quoteId})
const partial=until(pending,'2020-01-10',run=>features(run).market.orders[0]!.status==='partially_filled')
const filled=until(partial,'2020-01-20',run=>features(run).market.orders[0]!.status==='filled')
const sellable=until(filled,'2020-01-21')
const selling=act(sellable,'PlaceStockOrder',payload(sellable,'sell'))
const saleId=features(selling).market.orders.at(-1)!.id
const sold=until(selling,'2020-01-31',run=>features(run).market.orders.at(-1)!.status==='filled')
const paid=until(sold,'2020-02-01',run=>features(run).market.settlements.some(row=>row.paidAt!==null))
const cancelled=act(partial,'CancelStockOrder',{orderId})
const expiringPayload={...payload(initial),limitPriceFen:features(initial).market.stocks.find(row=>row.symbol==='SIM-AI02')!.lowerFen!,validUntil:features(initial).market.matchingCalendar[0]!.id}
const expired=until(act(initial,'PlanStockOrder',expiringPayload),'2020-01-10',run=>features(run).market.orders[0]!.status==='expired')
function context(run=planned,id=orderId){
 const projected=registry.runtime!.project!(run),f=projected as unknown as PlayFeatures,view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const request=vi.fn(),requestWait=vi.fn(),controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']
 const p:GamePanelProps={view,features:f,controller,request,requestWait,accountId:'personal'},focus=openingFocusFor(p,'market',{accountId:'personal',recordId:id})!
 return {p,focus,thread:playerThread(p,focus)}
}
const render=(p:GamePanelProps,focus:OpeningFocus)=>renderToStaticMarkup(<OpeningMoment p={p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback="本次实际回响仍须完整可读。"/>)

it('turns the original plan into a short current decision without dropping its original submission',()=>{
 const {p,focus,thread}=context(),copy=marketOrderRoomCopy(p,thread)!,html=render(p,focus)
 expect(copy).toMatchObject({title:'这份计划，要交出去吗？',stage:'计划 · 尚未提交',paperPhase:'planned'})
 expect(copy.facts.join('')).toContain('资金预留¥16,516.50')
 expect(html).toContain('data-order-phase="planned"')
 expect(html).toContain('提交这份模拟委托');expect(html).toContain('撤回这份委托的剩余部分')
 expect(html).toContain('本次实际回响仍须完整可读。');expect(html).toContain('翻开手记')
 expect(html).not.toContain('已成交0股 / 余600股')
 let activate:(()=>void)|undefined
 renderToStaticMarkup(<DayThreadAction p={p} thread={thread} active result={false} date={null} waitLabel="" onToday={vi.fn()}>{primary=>{activate=primary?.binding.activate;return primary?.main}}</DayThreadAction>)
 activate!();expect(p.request).toHaveBeenCalledExactlyOnceWith('SubmitStockOrder',thread.command!.payload,thread.command!.label,true)
})

it('distinguishes pending, real partial fills and complete buys with original money and fees',()=>{
 const waiting=context(pending),part=context(partial),complete=context(filled)
 expect(marketOrderRoomCopy(waiting.p,waiting.thread)?.paperPhase).toBe('pending')
 const order=part.p.features.market.orders[0]!,copy=marketOrderRoomCopy(part.p,part.thread)!
 expect(order.remaining).toBe(100);expect(copy.paperPhase).toBe('partial')
 expect(copy.facts.join('')).toContain('本单已买入500股')
 expect(copy.facts.join('')).toContain('余100股')
 expect(copy.facts.join('')).toContain('撤回不改变原成交')
 expect(part.thread.wait?.date).toBe('2020-01-20')
 expect(marketOrderRoomCopy(complete.p,complete.thread)).toMatchObject({title:'股份买到了，日子继续。',paperPhase:'filled'})
 expect(render(complete.p,complete.focus)).toContain('回到今天')
})

it('keeps cancellation and expiry separate from original actual fills',()=>{
 const cancelledContext=context(cancelled),stopped=marketOrderRoomCopy(cancelledContext.p,cancelledContext.thread)!
 expect(stopped.paperPhase).toBe('stopped');expect(stopped.facts.join('')).toContain('已买入500股');expect(stopped.facts.join('')).toContain('未成交100股已撤回')
 const end=context(expired),copy=marketOrderRoomCopy(end.p,end.thread)!
 expect(copy.stage).toBe('已到期 · 记录保留');expect(copy.facts.join('')).toContain('未成交600股已到期')
 expect(copy.facts.join('')).not.toContain('卖款实收')
})

it('shows the original sale as receivable first and actual cash only after its own settlement',()=>{
 const waiting=context(sold,saleId),arrived=context(paid,saleId)
 const copy=marketOrderRoomCopy(waiting.p,waiting.thread)!
 expect(copy.paperPhase).toBe('settlement');expect(copy.facts.join('')).toContain('卖款实收¥0 · 待交收')
 expect(waiting.thread.wait?.date).toBe('2020-02-01')
 const result=marketOrderRoomCopy(arrived.p,arrived.thread)!
 expect(result.title).toBe('卖款到了，接下来怎么安排？');expect(result.facts.join('')).not.toContain('待交收')
 expect(result.facts.join('')).toContain('扣除本单费用后')
 expect(render(waiting.p,waiting.focus)).toContain('原款待交收')
})

it('retains the original full scene for unknown, duplicate, historical or different-order sources',()=>{
 const {p,thread}=context(partial),order=p.features.market.orders[0]!
 expect(marketOrderRoomCopy(p,{...thread,focusScope:'history'})).toBeNull()
 expect(marketOrderRoomCopy(p,{...thread,focus:{...thread.focus,runId:'other-life'}})).toBeNull()
 expect(marketOrderRoomCopy(p,{...thread,responsibilityOverrideNeeded:true})).toBeNull()
 for(const market of [{...p.features.market,orders:[order,order]},{...p.features.market,orders:[{...order,accountId:'other-account'}]},{...p.features.market,fills:[]},{...p.features.market,fills:[...p.features.market.fills,...p.features.market.fills]},{...p.features.market,orders:[{...order,feesPaidFen:NaN}]}])expect(marketOrderRoomCopy({...p,features:{...p.features,market}},thread)).toBeNull()
 const sale=context(sold,saleId),row=sale.p.features.market.settlements[0]!
 for(const settlements of [[],[row,row],[{...row,accountId:'other-account'}],[{...row,sourceId:'other-fill'}],[{...row,amountFen:row.amountFen+1}]])expect(marketOrderRoomCopy({...sale.p,features:{...sale.p.features,market:{...sale.p.features.market,settlements}}},sale.thread)).toBeNull()
})

it('keeps the actual pending reason visible and marks carry as old work continuing',()=>{
 const {p,thread}=context(pending),order=p.features.market.orders[0]!
 const display={...p,features:{...p.features,market:{...p.features.market,orders:[{...order,reason:'suspended'}]}}}
 expect(marketOrderRoomCopy(display,{...thread,focusScope:'carry',focusQuarter:'2020-Q1'})?.facts.join('')).toContain('始于2020-Q1')
 expect(marketOrderRoomCopy(display,thread)?.facts.join('')).toContain('上次未继续成交：停牌')
})

it.each(['planned','pending','partial','filled','stopped','settlement'] as const)('gives %s a distinct paper trace without behaviour',phase=>{
 const html=renderToStaticMarkup(<DayContinuityPaper art={{kind:'market',state:'ongoing',orderPhase:phase}}/>)
 expect(html).toContain('data-material="order-'+phase+'"');expect(html).not.toContain('reading-lens')
 expect(html).toContain('aria-hidden="true"')
})

it('names the unrelated hand-made offer at its actual deadline while keeping the market order pending',()=>{
 const before=context(pending).p.view,after=context(until(pending,'2020-01-06')),current=after.p.view,receipt=current.receipts.at(-1)!
 const result={status:'stopped' as const,reasonCodes:[],targetDate:'2020-01-10',before,lastBefore:before,lastSaved:current,current,steps:[{commandId:receipt.commandId,date:current.date,revisionBefore:before.revision,revisionAfter:current.revision}],feedback:inspectPublicWaitTransition(before,current),failed:null}
 const notice={date:current.date,...waitSceneResult(result,current)!}
 expect(notice.brief).toBe('委托答复期限已过。')
 expect(marketOrderWaitBrief(after.p,after.thread,notice)).toBe('手工小单的答复期限已过。这份模拟委托仍待撮合。')
 const html=renderToStaticMarkup(<OpeningMoment p={after.p} focus={after.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(after.p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={<SceneTimeNotice {...notice} compact accountName={()=>'个人账户'} onClose={vi.fn()}/>}/>)
 expect(html).toContain('手工小单的答复期限已过。这份模拟委托仍待撮合。')
 expect(html).toContain('等这份委托的下一次撮合');expect(html).toContain('细看回响')
 expect(after.p.request).not.toHaveBeenCalled()
 for(const different of [{...notice,date:'2020-01-05'},{...notice,brief:'实际付出¥100。'},{...notice,text:'另一项责任到期。'}])expect(marketOrderWaitBrief(after.p,after.thread,different)).toBeNull()
})
