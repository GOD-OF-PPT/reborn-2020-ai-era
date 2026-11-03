import {expect,it,vi} from 'vitest'
import {Children,isValidElement,type ComponentProps,type ReactElement,type ReactNode} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import type {PlayFeatures} from './game-types.ts'
import {MarketOrderTerms,MarketOrderRules} from './MarketOrderTerms.tsx'
import {MarketExpiryCalendar,marketExpiryMonths,marketExpiryLabel} from './MarketExpiryPicker.tsx'

// Public normal projection and local draft controls only; no persistence or codec.
const run=createCampaignRun({runId:'order-terms-ui',actorId:'player',commandId:'create',seed:'order-terms-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'investment'}}),registry=createCampaignRegistry(),features=registry.runtime!.project!(run) as unknown as PlayFeatures,market=features.market,calendar=market.matchingCalendar,stock=market.stocks.find(row=>row.symbol==='SIM-AI02')!
function setup(overrides:Partial<ComponentProps<typeof MarketOrderTerms>>={}){return {stock,accountName:'个人账户',availableFen:2600000,asOf:market.asOf,draft:{accountId:'personal',symbol:stock.symbol,side:'' as const,quantity:'',price:'',expiry:'',quoteId:market.quoteId},calendar,sellable:0,complete:false,lockReason:null,onSide:vi.fn(),onQuantity:vi.fn(),onPrice:vi.fn(),onUseQuote:vi.fn(),onExpiry:vi.fn(),onRules:vi.fn(),...overrides}}
type Control={children?:ReactNode;onClick?:()=>void;onChange?:(event:{target:{value:string}})=>void;'aria-label'?:string;'aria-pressed'?:boolean;value?:string;disabled?:boolean}
function nodes(node:ReactNode):ReactElement<Control>[]{return Children.toArray(node).flatMap(c=>isValidElement<Control>(c)?[c,...nodes(c.props.children)]:[])}
function text(node:ReactNode):string{return Children.toArray(node).map(c=>typeof c==='string'||typeof c==='number'?String(c):isValidElement<Control>(c)?text(c.props.children):'').join('')}

it('shows all original draft fields and fee facts directly with no automatic choice',()=>{
 const props=setup(),tree=MarketOrderTerms(props),html=renderToStaticMarkup(tree),elements=nodes(tree)
 expect(elements.filter(n=>n.type==='input')).toHaveLength(2)
 expect(elements.filter(n=>n.props['aria-pressed'])).toHaveLength(0)
 for(const value of ['买入这只股票','卖出已有股份','买卖股数','每股限价','委托有效至','请选择到期日期','50股','0.1%','最低¥5','买后1日可售','卖款1日交收'])expect(html).toContain(value)
 expect(html).not.toContain('screen-book')
 expect(props.onSide).not.toHaveBeenCalled();expect(props.onQuantity).not.toHaveBeenCalled();expect(props.onPrice).not.toHaveBeenCalled();expect(props.onExpiry).not.toHaveBeenCalled()
})

it('keeps editing and opening the expiry/rules readers separate from each other',()=>{
 const props=setup(),elements=nodes(MarketOrderTerms(props))
 elements.find(n=>n.type==='button'&&text(n.props.children).startsWith('买入这只股票'))!.props.onClick!()
 expect(props.onSide).toHaveBeenCalledExactlyOnceWith('buy')
 const inputs=elements.filter(n=>n.type==='input');inputs[0]!.props.onChange!({target:{value:'100'}});inputs[1]!.props.onChange!({target:{value:'25.00'}})
 expect(props.onQuantity).toHaveBeenCalledExactlyOnceWith('100');expect(props.onPrice).toHaveBeenCalledExactlyOnceWith('25.00')
 elements.find(n=>n.props['aria-label']?.startsWith('选择委托到期日'))!.props.onClick!()
 expect(props.onExpiry).toHaveBeenCalledOnce()
 expect(props.onUseQuote).not.toHaveBeenCalled()
 elements.find(n=>n.type==='button'&&text(n.props.children)==='完整交易规则 ↗')!.props.onClick!()
 expect(props.onRules).toHaveBeenCalledOnce()
})

it('retains every original calendar ID, date and order across all month groups',()=>{
 const before=JSON.stringify(calendar),groups=marketExpiryMonths(calendar)
 expect(groups.flatMap(group=>group.entries)).toEqual(calendar)
 expect(new Set(groups.flatMap(group=>group.entries.map(entry=>entry.id))).size).toBe(calendar.length)
 expect(groups.at(-1)!.entries.at(-1)).toEqual(calendar.at(-1))
 expect(JSON.stringify(calendar)).toBe(before)
})

it('browses years and months without changing the selected expiry',()=>{
 const first=calendar[0]!,groups=marketExpiryMonths(calendar),last=groups.at(-1)!,onMonth=vi.fn(),onSelect=vi.fn()
 const tree=MarketExpiryCalendar({calendar,selectedId:first.id,month:last.month,onMonth,onSelect}),elements=nodes(tree),html=renderToStaticMarkup(tree)
 expect(html).toContain('原选择：'+first.date)
 expect(onSelect).not.toHaveBeenCalled()
 const monthButton=elements.find(n=>n.type==='button'&&!n.props.disabled&&n.props['aria-label']?.startsWith('查看')&&!n.props['aria-pressed'])!
 monthButton.props.onClick!();expect(onMonth).toHaveBeenCalledOnce();expect(onSelect).not.toHaveBeenCalled()
 const firstYear=groups[0]!.month.slice(0,4)
 elements.find(n=>n.type==='select')!.props.onChange!({target:{value:firstYear}})
 expect(onMonth).toHaveBeenLastCalledWith(groups[0]!.month)
 expect(onSelect).not.toHaveBeenCalled()
})

it('selects the original checkpoint ID rather than constructing one from a date',()=>{
 const entry=calendar.at(-1)!,onSelect=vi.fn(),tree=MarketExpiryCalendar({calendar,selectedId:'',month:entry.date.slice(0,7),onMonth:vi.fn(),onSelect})
 nodes(tree).find(n=>n.props['aria-label']==='选择到期日 · '+entry.date)!.props.onClick!()
 expect(onSelect).toHaveBeenCalledExactlyOnceWith(entry.id)
 expect(marketExpiryLabel(calendar,entry.id)).toBe(entry.date)
})

it('explains missing or empty expiry choices without silently substituting a date',()=>{
 const onSelect=vi.fn(),empty=renderToStaticMarkup(<MarketExpiryCalendar calendar={[]} selectedId="previous" month="2020-01" onMonth={vi.fn()} onSelect={onSelect}/>)
 expect(empty).toContain('没有可选的后续撮合日')
 expect(empty).toContain('原到期日已不可选，请重选')
 expect(marketExpiryLabel(calendar,'previous')).toBe('原到期日已不可选，请重选')
 const props=setup();props.draft.expiry='previous'
 expect(renderToStaticMarkup(<MarketOrderTerms {...props}/>)).toContain('data-invalid="true"')
 expect(onSelect).not.toHaveBeenCalled()
})

it('keeps the complete original fee and settlement explanation available separately',()=>{
 const html=renderToStaticMarkup(<MarketOrderRules stock={stock} asOf={market.asOf}/>)
 for(const value of ['非历史实盘','限价不保证成交','交易单位50股','佣金0.1%','最低¥5','买后1个日历日可售','卖款1日交收','实际费用、资金与行动点','填写和返回都不会下单'])expect(html).toContain(value)
 const unavailable=market.stocks.find(s=>s.status==='not_listed')!
 expect(renderToStaticMarkup(<MarketOrderRules stock={unavailable} asOf={market.asOf}/>)).toContain('当前尚未上市')
})


it.each(['buy','sell'] as const)('names %s inputs explicitly when the same controls change mode',side=>{
 const base=setup(),props=setup({draft:{...base.draft,side}}),inputs=nodes(MarketOrderTerms(props)).filter(n=>n.type==='input')
 expect(inputs.map(input=>input.props['aria-label'])).toEqual(side==='buy'?['买入股数','最高买价（元/股）']:['卖出股数','最低卖价（元/股）'])
 const year=nodes(MarketExpiryCalendar({calendar,selectedId:'',month:'2025-12',onMonth:vi.fn(),onSelect:vi.fn()})).find(n=>n.type==='select')!
 expect(year.props['aria-label']).toBe('查看年份')
})
