import {expect,it,vi} from 'vitest'
import {createRelaySceneDraftMemory,emptyRelaySceneDraft,relaySceneDraftKey,useRelaySceneDraft,type RelaySceneDraftScope} from './relay-scene-draft.ts'

// Drive the real hook setters only; this does not emulate browser DOM or effects.
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
// UI-only identity keys, not a forged accepted game state.
const service:RelaySceneDraftScope={accountId:'company-a',businessId:'business-a',stationId:'station-a',periodId:null,meterId:null,slot:'service'}
const audit:RelaySceneDraftScope={...service,periodId:'period-a',slot:'audit'}

it('keeps a deliberately unfinished service choice and its dates when the same slot is reopened',()=>{
 const memory=createRelaySceneDraftMemory('life-a'),draft={...emptyRelaySceneDraft(),customerIds:['customer-a'],supplierIds:['supplier-primary','supplier-backup'],resources:['worker-a'],startAt:'2025-02-03',maxUnits:'10000',maxSupplierCost:'2400',supportMode:'self' as const}
 expect(memory.read('life-a',service)).toBeUndefined()
 memory.write('life-a',service,draft)
 expect(memory.read('life-a',{...service})).toEqual(draft)
 expect(memory.read('life-a',audit)).toBeUndefined()
 const other=emptyRelaySceneDraft();draft.customerIds.push('later-local-edit')
 expect(other).toMatchObject({customerIds:[],supplierIds:[],resources:[],startAt:'',maxUnits:'',maxSupplierCost:'',supportMode:'',deploymentId:null})
 expect(memory.read('life-a',service)?.customerIds).toEqual(['customer-a'])
})

it('isolates lives, accounts, businesses, stations, periods, meters and the two steps',()=>{
 const memory=createRelaySceneDraftMemory('life-a'),draft={...emptyRelaySceneDraft(),startAt:'2025-03-04',resources:['worker-a']}
 expect(memory.write('life-a',audit,draft)).toBe(true)
 expect(memory.write('life-b',audit,draft)).toBe(false);expect(memory.read('life-b',audit)).toBeUndefined()
 const others:RelaySceneDraftScope[]=[service,{...audit,accountId:'company-b'},{...audit,businessId:'business-b'},{...audit,stationId:'station-b'},{...audit,periodId:'period-b'},{...audit,meterId:'meter-a'},{...audit,meterId:'meter:a:b'}]
 for(const scope of others){expect(relaySceneDraftKey('life-a',scope)).not.toBe(relaySceneDraftKey('life-a',audit));expect(memory.read('life-a',scope)).toBeUndefined()}
 expect(memory.read('life-a',audit)).toEqual(draft)
})

it('copies selections in both directions and retains the explicitly chosen supplier order',()=>{
 const memory=createRelaySceneDraftMemory('life-a'),draft={...emptyRelaySceneDraft(),customerIds:['customer-a'],supplierIds:['backup-first','primary-second'],resources:['worker-a']}
 memory.write('life-a',service,draft)
 draft.customerIds.length=0;draft.supplierIds.reverse();draft.resources[0]='worker-b'
 const read=memory.read('life-a',service)!
 expect(read).toMatchObject({customerIds:['customer-a'],supplierIds:['backup-first','primary-second'],resources:['worker-a']})
 read.customerIds.push('customer-b');read.supplierIds.reverse();read.resources.length=0
 expect(memory.read('life-a',service)).toMatchObject({customerIds:['customer-a'],supplierIds:['backup-first','primary-second'],resources:['worker-a']})
})

it('keeps consecutive functional edits and changes from another mounted book in the same slot',()=>{
 for(const shared of [false,true]){
  hooks.values=[]
  const memory=shared?createRelaySceneDraftMemory('life-a'):undefined,scene=()=>{hooks.index=0;return useRelaySceneDraft('life-a',service,memory)},[,edit]=scene()
  edit(old=>({...old,customerIds:['customer-a']}));edit(old=>({...old,supplierIds:['supplier-a'],startAt:'2025-01-03'}))
  expect(scene()[0]).toMatchObject({customerIds:['customer-a'],supplierIds:['supplier-a'],startAt:'2025-01-03'})
  if(memory){
   const book=()=>{hooks.index=2;return useRelaySceneDraft('life-a',service,memory)},[,editBook]=book()
   editBook(old=>({...old,resources:['worker-a'],maxSupplierCost:'900'}));edit(old=>({...old,maxUnits:'12345'}))
   expect(scene()[0]).toMatchObject({customerIds:['customer-a'],supplierIds:['supplier-a'],resources:['worker-a'],maxSupplierCost:'900',maxUnits:'12345',startAt:'2025-01-03'})
  }
 }
 hooks.values=[]
})

it('keeps a past audit date in its original period and does not expose or update it behind an invalid scope',()=>{
 hooks.values=[]
 const memory=createRelaySceneDraftMemory('life-a'),render=(scope:RelaySceneDraftScope|null)=>{hooks.index=0;return useRelaySceneDraft('life-a',scope,memory)}
 const [,edit]=render(audit);edit(old=>({...old,startAt:'2025-01-02',resources:['former-worker']}))
 const before=memory.read('life-a',audit)
 const [blocked,editBlocked]=render(null);expect(blocked).toEqual(emptyRelaySceneDraft())
 const attempted=vi.fn(()=>({...emptyRelaySceneDraft(),startAt:'2025-02-01'}));editBlocked(attempted);expect(attempted).not.toHaveBeenCalled()
 expect(memory.read('life-a',audit)).toEqual(before)
 expect(render({...audit,periodId:'period-b'})[0]).toEqual(emptyRelaySceneDraft())
 expect(render(audit)[0]).toMatchObject({startAt:'2025-01-02',resources:['former-worker']})
 hooks.values=[]
})
