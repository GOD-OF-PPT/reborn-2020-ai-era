import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {OpeningObject,type OpeningObjectProps} from './OpeningObject.tsx'

vi.mock('react',async original=>({...await original<typeof import('react')>(),useId:()=> 'opening-entry-paper'}))
function props(extra:Partial<OpeningObjectProps>={}):OpeningObjectProps{
 return {kind:'portfolio',title:'今天尚未安排的时间与生活',displayTitle:'',detail:'2020-01-01',stageLabel:'尚未新增安排',actionLabel:'选择今天怎样安排',disabled:false,onActivate:vi.fn(),...extra}
}

it.each(['calendar','market'] as const)('shows the explicit %s paper without borrowing a commission or inventing a result',entryPaper=>{
 const html=renderToStaticMarkup(<OpeningObject {...props({entryPaper})}/>)
 expect(html).toContain(`data-entry-paper="${entryPaper}"`)
 expect(html).toContain('aria-label="今天尚未安排的时间与生活 选择今天怎样安排"')
 expect(html).toContain('2020-01-01')
 expect(html).not.toContain('<img')
 expect(html).not.toContain('first-attempt-v1')
 expect(html).not.toContain('收到客户付款')
 expect(html).not.toContain('data-first-order-phase')
})

it('keeps the same native activation and all entry information in text mode',()=>{
 const p=props({entryPaper:'market',textOnly:true,protection:'readonly'}),button=OpeningObject(p)
 expect(button.type).toBe('button')
 button.props.onClick()
 expect(p.onActivate).toHaveBeenCalledTimes(1)
 const html=renderToStaticMarkup(button)
 expect(html).toContain('只读 · 原记录保留')
 expect(html).toContain('尚未新增安排')
 expect(html).toContain('选择今天怎样安排')
 expect(html).not.toContain('<svg')
})

it('keeps a committed commission authoritative if an entry hint is also supplied',()=>{
 const html=renderToStaticMarkup(<OpeningObject {...props({entryPaper:'calendar',firstOrder:{phase:'planned',dateLabel:'2020-01-05 开工'}})}/>)
 expect(html).toContain('data-first-order-phase="planned"')
 expect(html).toContain('first-attempt-v1.png')
 expect(html).not.toContain('data-entry-paper')
 expect(html).not.toContain('class="opening-entry-paper"')
})
