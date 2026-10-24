import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {VideoContinuityPaper,type VideoPaperPhase} from './VideoContinuityPaper.tsx'

const phases:readonly VideoPaperPhase[]=['entry','planned','making','review','delivery','feedback','revision','settlement','result','non-success','history']
const render=(phase:VideoPaperPhase)=>renderToStaticMarkup(<VideoContinuityPaper art={{phase}}/>)
// Native vector contents only; no window dimensions or measured layout are involved.
const shapes=(html:string)=>(html.match(/<(?:path|circle|ellipse|rect|polygon)\b[^>]*>/g)??[]).map(s=>s.replace(/ class="[^"]*"/g,'')).join('')

it('retains the original kit and keeps every layer decorative without a fabricated caption or command',()=>{
 for(const phase of phases){
  const html=render(phase),root=VideoContinuityPaper({art:{phase}})
  expect(root.props['aria-hidden']).toBe('true')
  expect(html).toContain('video-making-kit-v1.png')
  expect(html).toContain('width="1254" height="1254"')
  expect(html).not.toMatch(/<(?:text|foreignObject|button|a|script)\b/)
  expect(html).not.toMatch(/¥|￥|利润|到账|客户说|20\d{2}-\d{2}-\d{2}/)
 }
})

it('uses eleven different paper compositions rather than changing only an attribute or badge',()=>{
 expect(new Set(phases.map(phase=>shapes(render(phase)))).size).toBe(phases.length)
})

it('separates inspection, the version ready to send and waiting for an actual reply',()=>{
 const review=render('review'),delivery=render('delivery'),feedback=render('feedback')
 expect(review).toContain('data-material="version-inspection"')
 expect(delivery).toContain('data-material="ready-to-send-version"')
 expect(feedback).toContain('data-material="sent-version-and-reply-slot"')
 for(const html of [review,delivery,feedback])expect(html).not.toContain('video-state-result-paper')
})

it('keeps pending settlement, a recorded result, non-success and historical reading visibly separate',()=>{
 const waiting=render('settlement'),result=render('result'),failed=render('non-success'),history=render('history')
 expect(waiting).toContain('video-state-pending-slip')
 expect(waiting).not.toContain('video-state-result-paper')
 expect(result).toContain('video-state-result-paper')
 expect(failed).toContain('data-material="stowed-work-and-retained-record"')
 expect(history).toContain('data-material="bound-history-page"')
 expect(failed+history).not.toContain('video-state-result-paper')
})
