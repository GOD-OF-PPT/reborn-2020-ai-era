import {expect,it} from 'vitest'
import {isRelayShapeFiniteRejection,RelayShapePolicyRefusal,relayShapeAuditableMeterIds,relayShapeFirstUnusedPerson} from './relay-shape-scenario.ts'

it('chooses the first unused public person without reusing an old closed customer',()=>{
 const members=['p1-primer','closed-customer','first-new','second-new']
 expect(relayShapeFirstUnusedPerson(members,[{personId:'p1-primer'},{personId:'closed-customer'}])).toBe('first-new')
 expect(relayShapeFirstUnusedPerson(members,members.map(personId=>({personId})))).toBeNull()
 expect(relayShapeFirstUnusedPerson([],[])).toBeNull()
 expect(members).toEqual(['p1-primer','closed-customer','first-new','second-new'])
})

it('limits an audit to this period, already observed supplied meters and retryable interrupted work',()=>{
 const meters=[
  {id:'p1-old',periodId:'old-period',date:'2024-11-01',supplierId:'cedar-direct'},
  {id:'blocked',periodId:'new-period',date:'2025-01-13',supplierId:null},
  {id:'future',periodId:'new-period',date:'2025-02-25',supplierId:'cedar-direct'},
  {id:'unreviewed',periodId:'new-period',date:'2025-01-12',supplierId:'cedar-direct'},
  ...['planned','running','completed','interrupted','cancelled'].map(status=>({id:status,periodId:'new-period',date:'2025-02-08',supplierId:'cedar-direct'})),
 ]
 const statuses=['planned','running','completed','interrupted','cancelled']
 const audits=statuses.map(status=>({meterId:status,jobId:'audit-'+status}))
 const jobs=statuses.map(status=>({jobId:'audit-'+status,job:{status}}))
 expect(relayShapeAuditableMeterIds('new-period','2025-02-24',meters,audits,jobs)).toEqual(['unreviewed','interrupted','cancelled'])
 expect(relayShapeAuditableMeterIds('missing-period','2025-02-24',meters,audits,jobs)).toEqual([])
})

it('keeps a missing original audit job fatal instead of authorising a duplicate audit',()=>{
 const meter={id:'meter',periodId:'period',date:'2025-02-08',supplierId:'cedar-direct'}
 expect(()=>relayShapeAuditableMeterIds('period','2025-02-24',[meter],[{meterId:'meter',jobId:'missing'}],[])).toThrow('PUBLIC_RELAY_AUDIT_JOB_REQUIRED')
})

it('does not turn an empty, mixed, unknown or scheduling rejection into a finite business result',()=>{
 for(const reason of ['INSUFFICIENT_ACTION_POINTS','INSUFFICIENT_AVAILABLE_FUNDS','INSUFFICIENT_CAPACITY','AGENT_INDEPENDENT_RISK_PENDING','RELAY_SUPPLY_NOT_READY'])
  expect(isRelayShapeFiniteRejection([reason]),reason).toBe(true)
 expect(isRelayShapeFiniteRejection(['OVERDUE_OBLIGATION','AGENT_SERVICE_FEE_OVERDUE'])).toBe(true)
 for(const reasons of [[],['INVALID_PAYLOAD'],['UNKNOWN_COMMAND'],['RELAY_START_FUTURE_DATE_REQUIRED'],['CANNOT_BACKDATE_JOB'],['INSUFFICIENT_CAPACITY','UNEXPECTED_ENGINE_ERROR']])
  expect(isRelayShapeFiniteRejection(reasons),JSON.stringify(reasons)).toBe(false)
})

it('retains the actual finite outcome detail without replacing it with a success result',()=>{
 const detail={date:'2025-01-11',incident:{verdict:'violation'},externalControlRestored:false}
 const error=new RelayShapePolicyRefusal('actual_independent_violation_finite_stop',detail)
 expect(error).toBeInstanceOf(Error)
 expect(error.name).toBe('RelayShapePolicyRefusal')
 expect(error.code).toBe('actual_independent_violation_finite_stop')
 expect(error.detail).toBe(detail)
})
