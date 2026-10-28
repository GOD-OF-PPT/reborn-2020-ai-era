import {beforeEach,expect,it,vi} from 'vitest'
import type {ReactElement} from 'react'
import {WaitStopControl} from './WaitStopControl.tsx'

const latch=vi.hoisted(()=>({initialized:false,value:false}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 return {...actual,useState:(initial:boolean)=>{
  if(!latch.initialized){latch.initialized=true;latch.value=initial}
  return [latch.value,(value:boolean)=>{latch.value=value}]
 },useEffect:(effect:()=>void)=>{effect()}}
})
type Button=ReactElement<{disabled:boolean;'aria-label':string;onClick:()=>void}>
const button=(value:ReturnType<typeof WaitStopControl>)=>value?.props.children as Button|undefined
beforeEach(()=>{latch.initialized=false;latch.value=false})

it('has no completed-wait control before this life has displayed a wait',()=>{
 const stop=vi.fn()
 expect(WaitStopControl({active:false,onStop:stop})).toBeNull()
 expect(stop).not.toHaveBeenCalled()
})

it('routes an active stop only to the original stop callback',()=>{
 const stop=vi.fn(),control=button(WaitStopControl({active:true,onStop:stop}))!
 expect(control.props.disabled).toBe(false)
 control.props.onClick()
 expect(stop).toHaveBeenCalledTimes(1)
})

it('retains the same stop control after completion and makes a late interaction inert',()=>{
 const stop=vi.fn(),active=button(WaitStopControl({active:true,onStop:stop}))!
 const ended=button(WaitStopControl({active:false,onStop:stop}))!
 expect(ended.key).toBe(active.key)
 expect(ended.props).toMatchObject({disabled:true,'aria-label':'本段等候已经停止'})
 ended.props.onClick()
 expect(stop).not.toHaveBeenCalled()
})

it('can stop another explicitly started wait without turning the retained position into an exit',()=>{
 const stop=vi.fn()
 WaitStopControl({active:true,onStop:stop});WaitStopControl({active:false,onStop:stop})
 const again=button(WaitStopControl({active:true,onStop:stop}))!
 expect(again.props.disabled).toBe(false)
 again.props.onClick()
 expect(stop).toHaveBeenCalledTimes(1)
})
