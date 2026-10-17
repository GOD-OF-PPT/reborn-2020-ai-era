import {expect,it} from 'vitest'
import {selectContinuation} from './continuation.ts'
import type {RunListing} from '../persistence/indexeddb.ts'
const technical:RunListing={runId:'a-technical',revision:14,date:'2020-03-31',backgroundId:'technical_employee',compatible:true,errorCode:null},content:RunListing={...technical,runId:'z-content',revision:12,backgroundId:'content_employee'}
it('continues the last viewed life rather than IndexedDB key order or largest revision',()=>{expect(selectContinuation([technical,content],content.runId)).toBe(content)})
it('falls back to a compatible life when the remembered ID no longer exists',()=>{expect(selectContinuation([technical,content],'absent')).toBe(technical)})
it('never selects an incompatible remembered save',()=>{expect(selectContinuation([{...content,compatible:false},technical],content.runId)).toBe(technical);expect(selectContinuation([{...content,compatible:false}],content.runId)).toBeUndefined()})
