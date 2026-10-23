import {expect,it,vi} from 'vitest'
import {createCourseTeachingDraftMemory,courseTeachingDraftKey,emptyCourseTeachingDraft,useCourseTeachingDraft,type CourseTeachingDraftScope} from './course-teaching-draft.ts'

// Only drive the hook's actual setters; this does not emulate DOM/effects.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++
  if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [hooks.values[index] as T,(next:T|((previous:T)=>T))=>{hooks.values[index]=typeof next==='function'?(next as (previous:T)=>T)(hooks.values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0]}
})
const scope:CourseTeachingDraftScope={accountId:'company-a',businessId:'studio-a',courseId:'course-a',audienceId:'audience-a',cohortId:'cohort-a',slot:'refund'}

it('keeps an unsubmitted class plan and its future dates through repeated book/scene reads without choosing defaults',()=>{
 const memory=createCourseTeachingDraftMemory('life-a'),plan={...scope,cohortId:null,slot:'plan' as const},draft={...emptyCourseTeachingDraft(),price:'999',resources:['worker-a'],startAt:'2023-03-01',endAt:'2023-04-05',supportStartAt:'2023-04-06',seatLimit:'8',supportMode:'self_small',promise:'clear_scope'}
 expect(memory.read('life-a',plan)).toBeUndefined()
 memory.write('life-a',plan,draft)
 expect(memory.read('life-a',plan)).toEqual(draft);expect(memory.read('life-a',plan)).toEqual(draft)
 const first=emptyCourseTeachingDraft(),second=emptyCourseTeachingDraft();first.personIds.push('not-yet-chosen-in-other-form')
 expect(second.personIds).toEqual([]);expect(second.resources).toEqual([]);expect(second.startAt).toBe('');expect(second.supportMode).toBe('')
})

it('separates lives, accounts, studios, courses, audiences, classes and teaching stages by their chosen slot',()=>{
 const memory=createCourseTeachingDraftMemory('life-a'),draft={...emptyCourseTeachingDraft(),personIds:['learner-a'],reason:'退回本班原学费'}
 expect(memory.write('life-a',scope,draft)).toBe(true)
 expect(memory.write('life-b',scope,{...draft,reason:'另一段人生'})).toBe(false)
 expect(memory.read('life-b',scope)).toBeUndefined()
 const alternatives:CourseTeachingDraftScope[]=[{...scope,accountId:'company-b'},{...scope,businessId:'studio-b'},{...scope,courseId:'course-b'},{...scope,audienceId:'audience-b'},{...scope,cohortId:'cohort-b'},{...scope,slot:'enroll'},{...scope,slot:'stage:0'},{...scope,slot:'stage:1'}]
 for(const other of alternatives){expect(courseTeachingDraftKey('life-a',other)).not.toBe(courseTeachingDraftKey('life-a',scope));expect(memory.read('life-a',other)).toBeUndefined()}
 expect(memory.read('life-a',scope)).toEqual(draft)
})

it('copies all three selection arrays on both write and read so previewing another form cannot mutate the stored choice',()=>{
 const memory=createCourseTeachingDraftMemory('life-a'),draft={...emptyCourseTeachingDraft(),sourceIds:['video-source-a'],resources:['worker-a'],personIds:['learner-a']}
 memory.write('life-a',scope,draft)
 draft.sourceIds.push('video-source-b');draft.resources[0]='worker-b';draft.personIds.length=0
 const read=memory.read('life-a',scope)!
 expect(read).toMatchObject({sourceIds:['video-source-a'],resources:['worker-a'],personIds:['learner-a']})
 read.sourceIds.length=0;read.resources.push('worker-c');read.personIds[0]='learner-b'
 expect(memory.read('life-a',scope)).toMatchObject({sourceIds:['video-source-a'],resources:['worker-a'],personIds:['learner-a']})
})

it('returns the original book edits to a scene that stayed mounted, keeping refund people separate from enrolment choices',()=>{
 hooks.values=[]
 const memory=createCourseTeachingDraftMemory('life-a'),scene=()=>{hooks.index=0;return useCourseTeachingDraft('life-a',scope,memory)},book=()=>{hooks.index=2;return useCourseTeachingDraft('life-a',scope,memory)},enroll={...scope,slot:'enroll' as const}
 const [,editScene]=scene();editScene(previous=>({...previous,personIds:['learner-a'],reason:'原场景原因'}))
 const [,editBook]=book();editBook(previous=>({...previous,reason:'从原册核对后保留的原因'}))
 expect(scene()[0]).toMatchObject({personIds:['learner-a'],reason:'从原册核对后保留的原因'})
 memory.write('life-a',enroll,{...emptyCourseTeachingDraft(),personIds:['new-person-b']})
 expect(scene()[0].personIds).toEqual(['learner-a']);expect(memory.read('life-a',enroll)?.personIds).toEqual(['new-person-b'])
 hooks.values=[]
})

it('applies consecutive functional edits to the newest same-slot draft, including a second mounted consumer',()=>{
 for(const withMemory of [false,true]){
  hooks.values=[]
  const memory=withMemory?createCourseTeachingDraftMemory('life-a'):undefined,render=()=>{hooks.index=0;return useCourseTeachingDraft('life-a',scope,memory)},[,edit]=render()
  edit(previous=>({...previous,personIds:['learner-a']}));edit(previous=>({...previous,reason:'保留刚选择的同一学员'}))
  expect(render()[0]).toMatchObject({personIds:['learner-a'],reason:'保留刚选择的同一学员'})
  if(memory){
   memory.write('life-a',scope,{...render()[0],resources:['worker-a'],startAt:'2023-04-10'})
   edit(previous=>({...previous,reason:'原册刚修改资源，随后只改原因'}))
   expect(render()[0]).toMatchObject({personIds:['learner-a'],resources:['worker-a'],startAt:'2023-04-10',reason:'原册刚修改资源，随后只改原因'})
  }
 }
 hooks.values=[]
})
