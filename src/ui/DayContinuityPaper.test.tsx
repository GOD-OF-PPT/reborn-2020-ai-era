import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {DayContinuityPaper,type DayContinuityArt} from './DayContinuityPaper.tsx'

const kinds:readonly DayContinuityArt['kind'][]=['today','work','life','market']
const states:readonly DayContinuityArt['state'][]=['history','result','ongoing','carry']
const render=(art:DayContinuityArt)=>renderToStaticMarkup(<DayContinuityPaper art={art}/>)
// Compare vector contents, never window geometry, CSS dimensions or a measured layout.
const shapes=(html:string)=>(html.match(/<(?:path|circle|ellipse|rect|polygon)\b[^>]*>/g)??[]).map(s=>s.replace(/ class="[^"]*"/g,'')).join('')

it('keeps every paper decorative, without a command, invented date, quote or reward text',()=>{
 for(const kind of kinds)for(const state of states){
  const svg=DayContinuityPaper({art:{kind,state}}),html=renderToStaticMarkup(svg)
  expect(svg.type).toBe('svg')
  expect(svg.props['aria-hidden']).toBe('true')
  expect(svg.props.focusable).toBe('false')
  expect(html).not.toMatch(/<(?:text|image|foreignObject|button|a|script)\b/)
  expect(html).not.toMatch(/¥|￥|利润|收入|到账|20\d{2}-\d{2}-\d{2}/)
 }
})

it('changes native paper contents for history, results, ongoing work and carry rather than only a label',()=>{
 for(const kind of kinds)expect(new Set(states.map(state=>shapes(render({kind,state})))).size).toBe(states.length)
 expect(new Set(kinds.map(kind=>shapes(render({kind,state:'ongoing'})))).size).toBe(kinds.length)
})

it('retains the work calendar when a wage trace is added, without declaring the work closed',()=>{
 const html=render({kind:'work',state:'result'})
 expect(html).toContain('data-material="work-calendar"')
 expect(html).toContain('data-material="wage-trace"')
 expect(html).not.toContain('data-material="archive-fold"')
 expect(html).not.toContain('closed')
})

it('keeps life and market results distinct from cash receipts, and carry distinct from archival reading',()=>{
 const life=render({kind:'life',state:'result'}),market=render({kind:'market',state:'result'})
 expect(life).toContain('data-material="kept-life-page"')
 expect(market).toContain('data-material="execution-note"')
 expect(life+market).not.toMatch(/wage-trace|cash|receipt/)
 for(const kind of kinds){
  const carry=render({kind,state:'carry'}),history=render({kind,state:'history'})
  expect(carry).toContain('data-material="continuation-tab"')
  expect(carry).not.toContain('data-material="archive-fold"')
  expect(history).toContain('data-material="archive-fold"')
  expect(history).not.toContain('data-material="continuation-tab"')
 }
})
