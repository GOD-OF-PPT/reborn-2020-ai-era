import {expect,it,vi} from 'vitest'
import {Children,isValidElement,type ComponentProps,type ReactNode} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {BOOTSTRAP_CONTENT} from '../content/bootstrap.ts'
import {NewLifeChoices} from './NewLifeChoices.tsx'
import {moneyText} from './game-text.ts'

// UI draft controls only. No controller, game creation, persistence or codec API.
function setup(overrides:Partial<ComponentProps<typeof NewLifeChoices>>={}){
 return {step:'identity',backgroundId:'technical_employee',wishId:'autonomy',approach:'first_order',seed:'',onBackground:vi.fn(),onWish:vi.fn(),onApproach:vi.fn(),onSeedSettings:vi.fn(),onMemoryExplanation:vi.fn(),...overrides} satisfies ComponentProps<typeof NewLifeChoices>
}
type ElementProps={children?:ReactNode;type?:string;name?:string;value?:string;checked?:boolean;onChange?:()=>void;onClick?:()=>void}
function controls(node:ReactNode):{tag:unknown;props:ElementProps}[]{
 return Children.toArray(node).flatMap(child=>isValidElement<ElementProps>(child)?[{tag:child.type,props:child.props},...controls(child.props.children)]:[])
}

it.each([['identity','background',2],['wish','wish',4],['approach','approach',3]] as const)('exposes all %s choices directly without a reading pager', (step,name,count)=>{
 const props=setup({step}),tree=NewLifeChoices(props),inputs=controls(tree).filter(n=>n.tag==='input'&&n.props.type==='radio')
 expect(inputs).toHaveLength(count)
 expect(inputs.every(n=>n.props.name===name)).toBe(true)
 expect(inputs.filter(n=>n.props.checked)).toHaveLength(1)
 const html=renderToStaticMarkup(tree)
 expect(html).not.toContain('screen-book')
 expect(html).not.toContain('hidden=')
 expect(props.onBackground).not.toHaveBeenCalled()
 expect(props.onWish).not.toHaveBeenCalled()
 expect(props.onApproach).not.toHaveBeenCalled()
})

it.each(['technical_employee','content_employee'] as const)('shows the actual %s starting economy without promising immediate wages',backgroundId=>{
 const p=BOOTSTRAP_CONTENT.profiles.find(p=>p.id===backgroundId)!,html=renderToStaticMarkup(<NewLifeChoices {...setup({backgroundId})}/>)
 expect(html).toContain(moneyText(p.initialCashFen))
 expect(html).toContain(moneyText(p.monthlyLivingCostFen))
 expect(html).toContain(moneyText(p.monthlySalaryFen))
 expect(html).toContain('工资按实际上班日期结算')
})

it('keeps background, wish and approach draft callbacks separate and passes the original IDs',()=>{
 for(const [step,name,value,callback] of [['identity','background','content_employee','onBackground'],['wish','wish','own_brand','onWish'],['approach','approach','investment','onApproach']] as const){
  const p=setup({step}),input=controls(NewLifeChoices(p)).find(n=>n.tag==='input'&&n.props.name===name&&n.props.value===value)!
  input.props.onChange!()
  expect(p[callback]).toHaveBeenCalledExactlyOnceWith(value)
  for(const other of ['onBackground','onWish','onApproach'] as const)if(other!==callback)expect(p[other]).not.toHaveBeenCalled()
 }
})

it('reflects controlled choices in the final summary while retaining independent commitment and memory boundaries',()=>{
 const html=renderToStaticMarkup(<NewLifeChoices {...setup({step:'approach',backgroundId:'content_employee',wishId:'own_brand',approach:'investment'})}/>)
 expect(html).toContain('内容从业者')
 expect(html).toContain('经营自己的品牌')
 expect(html).toContain('工作＋准备投资')
 expect(html).toContain('不会自动工作、接单或买股')
 expect(html).toContain('记忆不是精确价格、购买资格或额外的钱')
 expect(html).toContain('那段模糊的记忆')
})

it('keeps the optional seed editor an explicit non-submit UI action',()=>{
 const p=setup({step:'approach',seed:'ui-draft'}),tree=NewLifeChoices(p),button=controls(tree).find(n=>n.tag==='button'&&n.props.children==='固定种子 · 已填写 ↗')!
 expect(button.props.type).toBe('button')
 button.props.onClick!()
 expect(p.onSeedSettings).toHaveBeenCalledOnce()
 expect(renderToStaticMarkup(tree)).toContain('固定种子 · 已填写')
 expect(p.seed).toBe('ui-draft')
})
