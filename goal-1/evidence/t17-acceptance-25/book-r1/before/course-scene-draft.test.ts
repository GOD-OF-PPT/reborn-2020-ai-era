import {expect,it,vi} from 'vitest'
import {courseSceneDraftKey,createCourseSceneDraftMemory,emptyCourseSceneDraft,useCourseSceneDraft,type CourseSceneDraft,type CourseSceneDraftScope} from './course-scene-draft.ts'

// Two mounted consumers rerender around the same in-memory book, without DOM claims.
const hooks=vi.hoisted(()=>({instances:[[] as unknown[],[] as unknown[]],instance:0,index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++,values=hooks.instances[hooks.instance]!
  if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [values[index] as T,(next:T|((previous:T)=>T))=>{values[index]=typeof next==='function'?(next as (previous:T)=>T)(values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0]}
})

const run='life-a',scope:CourseSceneDraftScope={accountId:'company-a',businessId:'studio-a',courseId:null,slot:'definition'}
const ready=():CourseSceneDraft=>({...emptyCourseSceneDraft(),name:'从已做案例到一堂课',productId:'practical_cohort',topicId:'image_workflows',segment:'local_merchants',cases:[{kind:'video',id:'paid-case-a'}],resources:['worker-a'],startAt:'2023-03-21',consent:true})

it('recovers an entire unsaved definition and its future date through repeated reads of the same slot',()=>{
 const memory=createCourseSceneDraftMemory(run),draft=ready()
 expect(memory.read(run,scope)).toBeUndefined()
 expect(memory.write(run,scope,draft)).toBe(true)
 expect(courseSceneDraftKey(run,{slot:'definition',courseId:null,businessId:'studio-a',accountId:'company-a'})).toBe(courseSceneDraftKey(run,scope))
 expect(memory.read(run,scope)).toEqual(draft)
 expect(memory.read(run,scope)?.startAt).toBe('2023-03-21')
})

it('refuses another life and isolates accounts, businesses, courses, entry and task slots',()=>{
 const memory=createCourseSceneDraftMemory(run),draft=ready()
 memory.write(run,scope,draft)
 expect(memory.read('life-b',scope)).toBeUndefined()
 expect(memory.write('life-b',scope,draft)).toBe(false)
 const others:CourseSceneDraftScope[]=[{...scope,accountId:'company-b'},{...scope,businessId:'studio-b'},{...scope,courseId:'course-a'},{...scope,courseId:'course-b'},{...scope,slot:'outline'},{...scope,slot:'sample'},{...scope,slot:'entry',businessId:null}]
 for(const [i,other] of others.entries()){
  expect(memory.read(run,other)).toBeUndefined()
  memory.write(run,other,{...draft,name:'explicit choice '+i})
 }
 expect(memory.read(run,scope)).toEqual(draft)
 for(const [i,other] of others.entries())expect(memory.read(run,other)?.name).toBe('explicit choice '+i)
 expect(createCourseSceneDraftMemory(run).read(run,scope)).toBeUndefined()
})

it('keeps separate case licences away from the unfinished definition and each other',()=>{
 const memory=createCourseSceneDraftMemory(run),draft=ready(),licenseA:CourseSceneDraftScope={...scope,slot:'license:video:case-a'},licenseB:CourseSceneDraftScope={...scope,slot:'license:video:case-b'},manual:CourseSceneDraftScope={...scope,slot:'license:first_order:case-a'}
 memory.write(run,scope,draft)
 memory.write(run,licenseA,{...draft,resources:['player-production'],startAt:'2023-03-01'})
 memory.write(run,licenseB,{...draft,resources:['worker-b'],startAt:'2023-03-09'})
 expect(memory.read(run,manual)).toBeUndefined()
 expect(memory.read(run,licenseA)?.startAt).toBe('2023-03-01')
 expect(memory.read(run,licenseB)?.resources).toEqual(['worker-b'])
 expect(memory.read(run,scope)).toEqual(draft)
})

it('copies nested cases and resources on both write and read instead of sharing mutable draft fields',()=>{
 const memory=createCourseSceneDraftMemory(run),input=ready()
 memory.write(run,scope,input)
 input.cases[0]!.id='local-unconfirmed-case';input.resources.push('local-worker')
 const first=memory.read(run,scope)!
 expect(first.cases).toEqual([{kind:'video',id:'paid-case-a'}]);expect(first.resources).toEqual(['worker-a'])
 first.cases[0]!.id='another-local-edit';first.resources[0]='another-worker'
 const second=memory.read(run,scope)!
 expect(second.cases).toEqual([{kind:'video',id:'paid-case-a'}]);expect(second.resources).toEqual(['worker-a'])
 expect(first).not.toBe(second);expect(first.cases[0]).not.toBe(second.cases[0]);expect(first.resources).not.toBe(second.resources)
})

it('reads original-book edits when the still-mounted scene returns, without resetting the chosen date',()=>{
 hooks.instances=[[],[]]
 const memory=createCourseSceneDraftMemory(run),render=(instance:number)=>{hooks.instance=instance;hooks.index=0;return useCourseSceneDraft(run,scope,memory)}
 const [,editScene]=render(0);editScene(ready())
 const [book,editBook]=render(1)
 expect(book.name).toBe('从已做案例到一堂课')
 editBook(previous=>({...previous,name:'原册中继续填的课程名',resources:['worker-b']}))
 const [returned]=render(0)
 expect(returned.name).toBe('原册中继续填的课程名');expect(returned.resources).toEqual(['worker-b'])
 expect(returned.startAt).toBe('2023-03-21');expect(returned.cases).toEqual(ready().cases)
})

it('applies consecutive functional edits to the latest draft, including another mounted consumer edit',()=>{
 for(const memory of [undefined,createCourseSceneDraftMemory(run)]){
  hooks.instances=[[],[]]
  const render=(instance:number)=>{hooks.instance=instance;hooks.index=0;return useCourseSceneDraft(run,scope,memory,ready())}
  const [,edit]=render(0)
  edit(previous=>({...previous,name:'同一事件的第一项修改'}))
  edit(previous=>({...previous,segment:'lifestyle'}))
  const [combined,sceneEdit]=render(0)
  expect(combined.name).toBe('同一事件的第一项修改');expect(combined.segment).toBe('lifestyle')
  if(memory){
   const [,bookEdit]=render(1)
   bookEdit(previous=>({...previous,resources:['another-book-worker']}))
   sceneEdit(previous=>({...previous,consent:false}))
   const [latest]=render(0)
   expect(latest.resources).toEqual(['another-book-worker']);expect(latest.name).toBe('同一事件的第一项修改');expect(latest.consent).toBe(false)
  }
 }
})
