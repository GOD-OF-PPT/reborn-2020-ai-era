import {expect,it,vi} from 'vitest'
import {Children,isValidElement,type ComponentProps,type ReactElement,type ReactNode} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {MarketStockPicker,marketStockStatus} from './MarketStockPicker.tsx'
import {marketDraftPayload,marketSceneSubmissionLock,type MarketSceneDraft} from './MarketSceneChoice.tsx'
import {moneyText} from './game-text.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {playerThread} from './player-thread.ts'
import type {CommandEnvelope} from '../core/run-types.ts'

// Normal public projections and form controls only. No persistence/codec APIs.
const registry=createCampaignRegistry(),run=createCampaignRun({runId:'stock-picker-ui',actorId:'player',commandId:'create',seed:'stock-picker-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'investment'}})
const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
const view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
const controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false} as unknown as GamePanelProps['controller']
const p:GamePanelProps={view,features,controller,request:vi.fn(),accountId:'personal'}
function setup(overrides:Partial<ComponentProps<typeof MarketStockPicker>>={}){return {stocks:features.market.stocks,accounts:view.accounts,accountId:'',symbol:'',accountName:(id:string)=>id==='personal'?'个人账户':id,onAccount:vi.fn(),onStock:vi.fn(),...overrides}}
type Control={children?:ReactNode;onClick?:()=>void;onChange?:(event:{target:{value:string}})=>void;'aria-pressed'?:boolean;'aria-label'?:string;value?:string;disabled?:boolean}
function nodes(node:ReactNode):ReactElement<Control>[]{return Children.toArray(node).flatMap(c=>isValidElement<Control>(c)?[c,...nodes(c.props.children)]:[])}

it('shows all original public stocks and controlled accounts directly without choosing for the player',()=>{
 const props=setup(),tree=MarketStockPicker(props),html=renderToStaticMarkup(tree),buttons=nodes(tree).filter(n=>n.type==='button')
 expect(buttons).toHaveLength(features.market.stocks.length)
 expect(features.market.stocks).toHaveLength(6)
 for(const stock of features.market.stocks){expect(html).toContain(stock.name);if(stock.priceFen!==null)expect(html).toContain(moneyText(stock.priceFen))}
 for(const account of view.accounts)expect(html).toContain(moneyText(account.availableFen))
 expect(html).toContain('请选择账户')
 expect(html).not.toContain('screen-book')
 expect(html).not.toContain('aria-pressed="true"')
 expect(props.onStock).not.toHaveBeenCalled();expect(props.onAccount).not.toHaveBeenCalled()
})

it('changes only the explicitly selected stock or account ID',()=>{
 const props=setup(),before=JSON.stringify({stocks:props.stocks,accounts:props.accounts}),tree=MarketStockPicker(props),stock=props.stocks[1]!
 nodes(tree).find(n=>n.type==='button'&&n.props['aria-label']==='选择模拟标的 · '+stock.name)!.props.onClick!()
 expect(props.onStock).toHaveBeenCalledExactlyOnceWith(stock.symbol)
 expect(props.onAccount).not.toHaveBeenCalled()
 nodes(tree).find(n=>n.type==='select')!.props.onChange!({target:{value:'personal'}})
 expect(props.onAccount).toHaveBeenCalledExactlyOnceWith('personal')
 expect(JSON.stringify({stocks:props.stocks,accounts:props.accounts})).toBe(before)
})

it('marks only the selected symbol while leaving unavailable cards readable',()=>{
 const unavailable=features.market.stocks.find(s=>s.status==='not_listed')!,props=setup({symbol:unavailable.symbol}),tree=MarketStockPicker(props),buttons=nodes(tree).filter(n=>n.type==='button'),html=renderToStaticMarkup(tree)
 expect(buttons.filter(n=>n.props['aria-pressed'])).toHaveLength(1)
 expect(buttons.find(n=>n.props['aria-pressed'])!.props.disabled).not.toBe(true)
 expect(html).toContain('尚未上市')
 expect(html).toContain('暂无报价')
 expect(html).toContain('缺本局资格')
 expect(marketSceneSubmissionLock(p,unavailable.symbol)).not.toBeNull()
 const allowed=features.market.stocks.find(s=>s.status==='open'&&s.qualified&&s.rule&&s.priceFen!==null)!
 expect(marketSceneSubmissionLock(p,allowed.symbol)).toBeNull()
})

it('distinguishes provided non-trading display states without manufacturing a quote',()=>{
 // Display-only variants; these are not claimed as normal trading histories.
 const stock=features.market.stocks[0]!
 for(const [status,label] of [['suspended','停牌中'],['delisted','已退市'],['no_rule','交易规则待核'],['data_unavailable','暂无可用报价']] as const){
  expect(marketStockStatus({...stock,status})).toBe(label)
 }
 expect(marketStockStatus({...stock,status:'open',priceFen:null})).toBe('暂无可用报价')
})

it('keeps an empty draft incomplete and accepts only fully explicit original order terms',()=>{
 const m=features.market,stock=m.stocks.find(s=>s.status==='open'&&s.qualified&&s.rule&&s.priceFen!==null)!
 const empty:MarketSceneDraft={accountId:'',symbol:'',side:'',quantity:'',price:'',expiry:'',quoteId:m.quoteId}
 expect(marketDraftPayload(empty,p)).toBeNull()
 expect(marketDraftPayload({...empty,accountId:'personal',symbol:stock.symbol},p)).toBeNull()
 const chosen:MarketSceneDraft={...empty,accountId:'personal',symbol:stock.symbol,side:'buy',quantity:String(stock.rule!.lotSize),price:(stock.priceFen!/100).toFixed(2),expiry:m.matchingCalendar[0]!.id},payload=marketDraftPayload(chosen,p)!
 expect(payload).toMatchObject({accountId:'personal',symbol:stock.symbol,quantity:stock.rule!.lotSize,limitPriceFen:stock.priceFen,quoteId:m.quoteId,validUntil:chosen.expiry})
 expect(previewCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'ui-preview',expectedRevision:run.revision,kind:'PlanStockOrder',payload},registry,run.actorId).allowed).toBe(true)
 expect(marketDraftPayload({...chosen,quoteId:'another-quote'},p)).toBeNull()
 expect(marketDraftPayload({...chosen,accountId:'another-account'},p)).toBeNull()
})


it('keeps a normal buy plan concise while retaining its original reserved funds, identity and full facts',()=>{
 const market=features.market,stock=market.stocks.find(s=>s.symbol==='SIM-AI02')!,payload=marketDraftPayload({accountId:'personal',symbol:stock.symbol,side:'buy',quantity:'100',price:'25',expiry:market.matchingCalendar[0]!.id,quoteId:market.quoteId},p)!
 const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'plan',expectedRevision:run.revision,kind:'PlanStockOrder',payload},registry,run.actorId)
 if(result.status!=='proposed')throw Error('EXPECTED_NORMAL_PLAN')
 const next=result.nextRun,projection=registry.runtime!.project!(next),nextFeatures=projection as unknown as PlayFeatures,nextView:GamePanelProps['view']={...projectRun(next),features:projection,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const nextController={snapshot:{view:nextView,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(next,c,registry,next.actorId)} as unknown as GamePanelProps['controller']
 const props:GamePanelProps={...p,view:nextView,features:nextFeatures,controller:nextController,request:vi.fn()},order=nextFeatures.market.orders[0]!,focus={kind:'market' as const,runId:next.runId,accountId:'personal',entityId:order.id,entityKind:'order' as const},thread=playerThread(props,focus)
 expect(order.status).toBe('planned');expect(order.cashHeldFen).toBe(250500)
 expect(thread.inspect.target?.recordId).toBe(order.id)
 expect(thread.line).toContain('已成交0股 / 余100股')
 expect(thread.detail).toContain('提交不会再占用一遍')
 const html=renderToStaticMarkup(<OpeningMoment p={props} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(props)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 expect(html).toContain('计划 · 尚未提交')
 expect(html).toContain('买入100股 · 限价¥25。')
 expect(html).toContain('资金预留¥2,505，尚未成交；提交沿用原预留。')
 expect(html).toContain('提交这份模拟委托');expect(html).toContain('撤回这份委托的剩余部分')
 expect(props.request).not.toHaveBeenCalled()
})
