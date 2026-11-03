import {test}from'node:test'
import assert from'node:assert/strict'
import fs from'node:fs'
import{currentPausedDefault}from'./paused-default-choice.ts'
const fixture=JSON.parse(fs.readFileSync(new URL('./selector-fixture372.json',import.meta.url),'utf8'))
const expected={instanceId:'event:c4573c6eb77d038cb88a52af058aed8a',choiceId:'defer'}
test('selects the exact original published pending course event and its original default at the real372 pause',()=>{assert.deepEqual(currentPausedDefault(fixture),expected)})
test('rejects an absent or unrelated pause',()=>{assert.throws(()=>currentPausedDefault({...fixture,pause:null}));assert.throws(()=>currentPausedDefault({...fixture,pause:{reason:'CASH_SHORTFALL',instanceId:fixture.pause.instanceId}}))})
test('does not guess when the published blocking identity is missing',()=>{assert.throws(()=>currentPausedDefault({...fixture,events:fixture.events.map((e:Record<string,unknown>)=>({...e,isBlocking:false}))}))})
test('does not pick latest when two published blocking candidates exist',()=>{assert.throws(()=>currentPausedDefault({...fixture,events:[...fixture.events,{...fixture.events[0],id:'different-public-object'}]}))})
test('requires exactly one matching original default, never another option',()=>{const e=fixture.events[0];assert.throws(()=>currentPausedDefault({...fixture,events:[{...e,choices:[]}]}));assert.throws(()=>currentPausedDefault({...fixture,events:[{...e,choices:[...e.choices,e.choices.find((c:{isDefault:boolean})=>c.isDefault)]}]}));assert.throws(()=>currentPausedDefault({...fixture,events:[{...e,defaultChoiceId:'unpublished-default'}]}))})
test('ignores a separate ordinary record and retains the same original payload',()=>{assert.deepEqual(currentPausedDefault({...fixture,events:[{...fixture.events[0],id:'ordinary-other',isBlocking:false},...fixture.events]}),expected)})
