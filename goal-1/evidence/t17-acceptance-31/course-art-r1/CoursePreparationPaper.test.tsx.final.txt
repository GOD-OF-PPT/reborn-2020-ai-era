import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {CoursePreparationPaper,type CoursePreparationPaperPhase} from './CoursePreparationPaper.tsx'
import {OpeningObject,type OpeningObjectProps} from './OpeningObject.tsx'

const phases:readonly CoursePreparationPaperPhase[]=['entry','outline-planned','outline-running','outline-completed','definition','license-planned','license-running','license-ready','sample-planned','sample-running','sample-ready','stopped','history']
const render=(phase:CoursePreparationPaperPhase)=>renderToStaticMarkup(<CoursePreparationPaper art={{phase}}/>)
const shapes=(html:string)=>(html.match(/<path\b[^>]*>/g)??[]).map(path=>path.replace(/ class="[^"]*"/g,'')).join('')
const props:OpeningObjectProps={kind:'work',appearance:'course',title:'同一工作室的工具实操课程',displayTitle:'',detail:'样课尚未完成；已安排开工，原资源与日期保留。',stageLabel:'样课已安排',actionLabel:'等这份样课开工 · 2023-01-02',disabled:false,onActivate:()=>{},coursePaper:{phase:'sample-planned'}}

it('keeps preparation phases decorative and changes the actual leaves without inventing business facts',()=>{
 const paths=phases.map(phase=>{
  const html=render(phase)
  expect(html).toContain('aria-hidden="true"')
  expect(html).toContain('focusable="false"')
  expect(html).toContain('width="1536" height="1024"')
  expect(html).not.toMatch(/<(?:text|foreignObject|button|a|script)\b/)
  expect(html).not.toMatch(/¥|￥|收入|到账|批准|20\d{2}-\d{2}-\d{2}/)
  return shapes(html)
 })
 expect(new Set(paths).size).toBe(phases.length)
 expect(render('sample-planned')).toContain('data-material="reserved-practice-leaf"')
 expect(render('sample-running')).toContain('data-material="open-practice-spread"')
 expect(render('sample-ready')).toContain('data-material="kept-practice-pages"')
 expect(render('license-ready')).toContain('data-material="kept-material-scope-pair"')
 expect(render('license-ready')).not.toContain('kept-practice-pages')
 expect(phases.map(render).join('')).not.toMatch(/receipt|cash|coin|payment/)
})

it('mounts the native course paper in the same button while keeping the full name and parent action',()=>{
 const html=renderToStaticMarkup(<OpeningObject {...props}/>),{coursePaper,...legacyProps}=props
 expect(html).toContain('type="button"')
 expect(html).toContain('data-course-phase="sample-planned"')
 expect(html).toContain('aria-label="'+props.title+' '+props.actionLabel+'"')
 expect(html).toContain(props.detail)
 expect(html).toContain('course-preparation-kit')
 expect(html).not.toContain('opening-object-mark')
 expect(coursePaper?.phase).toBe('sample-planned')
 const legacy=renderToStaticMarkup(<OpeningObject {...legacyProps} teaching={{stages:['planned','pending'],protectedFen:0,needsHelp:0,refundDueFen:0,supportUnmet:false,closedAt:null}}/>)
 expect(legacy).not.toContain('data-course-phase')
 expect(legacy).toContain('course-stage-tab')
 expect(legacy).toContain('第1段 · 已安排')
 expect(legacy).toContain('opening-object-mark')
})

it('keeps the committed paper under readonly or unsaved protection, with complete text in textOnly mode',()=>{
 for(const protection of ['readonly','unsaved','unavailable'] as const){
  const html=renderToStaticMarkup(<OpeningObject {...props} protection={protection} disabled/>),text=renderToStaticMarkup(<OpeningObject {...props} protection={protection} disabled textOnly/>)
  for(const content of [html,text]){
   expect(content).toContain('data-course-phase="sample-planned"')
   expect(content).toContain('data-protection="'+protection+'"')
   expect(content).toContain('disabled=""')
   expect(content).toContain(props.detail)
   expect(content).toContain(props.actionLabel)
   expect(content).toContain('aria-label="'+props.title+' '+props.actionLabel+'"')
   expect(content).toContain(protection==='readonly'?'只读 · 原记录保留':protection==='unsaved'?'尚未保存 · 仍是上次的物件':'暂不可用 · 先核对原因')
  }
  expect(html).toContain('reserved-practice-leaf')
  expect(text).not.toMatch(/<img\b|<svg\b|course-preparation-art|opening-object-art/)
  expect(text).not.toContain('kept-practice-pages')
 }
})
