import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {CourseTeachingPaper,type CourseTeachingPaperState,type CourseTeachingPaperPhase} from './CourseTeachingPaper.tsx'

const base:CourseTeachingPaperState={phase:'cohort',status:'choice',stages:null,protectedFen:null,needsHelp:null,refundDueFen:null,feeDueFen:null,closedAt:null}
const phases:readonly CourseTeachingPaperPhase[]=['audience','cohort','teaching','support','refund','closed','stopped','history']
const render=(art:CourseTeachingPaperState)=>renderToStaticMarkup(<CourseTeachingPaper art={art}/>)
const shapes=(html:string)=>(html.match(/<path\b[^>]*>/g)??[]).map(path=>path.replace(/ class="[^"]*"/g,'')).join('')

it('keeps every class paper decorative, preserves the original kit, and distinguishes the actual material shapes',()=>{
 const paths=phases.map(phase=>{
  const html=render({...base,phase})
  expect(html).toContain('aria-hidden="true"')
  expect(html).toContain('focusable="false"')
  expect(html).toContain('course-preparation-kit-v1.png')
  expect(html).toContain('width="1536" height="1024"')
  expect(html).not.toMatch(/<(?:text|foreignObject|button|a|script)\b/)
  expect(html).not.toMatch(/¥|￥|%|学员说|收入|到账|20\d{2}-\d{2}-\d{2}/)
  return shapes(html)
 })
 expect(new Set(paths).size).toBe(phases.length)
 expect(new Set(['choice','planned','running','actual'].map(status=>shapes(render({...base,phase:'teaching',status:status as CourseTeachingPaperState['status']})))).size).toBe(4)
 const audience=render({...base,phase:'audience',status:'actual'})
 expect(audience).toContain('audience-letter-and-unfilled-plan')
 expect(audience).not.toMatch(/class-promise-folio|actual-teaching-tabs|actual-closure-binding/)
})

it('keeps stage arrangements distinct from delivered lessons without declaring a learning outcome or closing the class',()=>{
 const planned=render({...base,phase:'teaching',status:'planned',stages:['planned','pending']}),delivered=render({...base,phase:'support',status:'running',stages:['completed','completed']})
 expect(planned).toContain('data-material="reserved-fold"')
 expect(planned).toContain('data-stage-state="planned"')
 expect(planned).not.toContain('data-stage-state="completed"')
 expect(delivered.match(/data-stage-state="completed"/g)).toHaveLength(2)
 expect(delivered).toContain('data-material="working-loose-leaf"')
 expect(delivered).not.toMatch(/actual-closure-binding|actual-help-fold|helped|outcome/)
 const noClosure=render({...base,phase:'closed',status:'actual'}),closed=render({...base,phase:'closed',status:'actual',closedAt:'2023-05-01'})
 expect(noClosure).not.toContain('actual-closure-binding')
 expect(closed).toContain('actual-closure-binding')
 expect(closed).not.toContain('2023-05-01')
})

it('adds only positive actual protection and responsibility folds, never a made-up cash receipt or zero claim',()=>{
 const unknown=render({...base,phase:'refund'}),zero=render({...base,phase:'refund',protectedFen:0,needsHelp:0,refundDueFen:0,feeDueFen:0}),due=render({...base,phase:'stopped',status:'actual',protectedFen:500000,needsHelp:1,refundDueFen:500000,feeDueFen:100})
 for(const html of [unknown,zero])expect(html).not.toMatch(/actual-(?:protection|help|refund-due|fee-due)-fold/)
 for(const material of ['actual-protection-fold','actual-help-fold','actual-refund-due-fold','actual-fee-due-fold'])expect(due).toContain(material)
 expect(due).not.toMatch(/500000|receipt|coin|paid|cash|actual-closure-binding/)
})

it('keeps a historical attempt free of the later class delivery and money markings even if stale art fields are supplied',()=>{
 const html=render({...base,phase:'history',status:'actual',stages:['completed','completed'],protectedFen:500000,needsHelp:2,refundDueFen:500000,feeDueFen:100,closedAt:'2023-05-01'})
 expect(html).toContain('original-attempt-history-leaf')
 expect(html).not.toMatch(/actual-teaching-tabs|actual-protection-fold|actual-help-fold|actual-refund-due-fold|actual-fee-due-fold|actual-closure-binding|recorded-page-edge|2023-05-01/)
})
