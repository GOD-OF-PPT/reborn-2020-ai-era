import {expect,it} from 'vitest'
import {seasonEchoOrder} from './season-thread.ts'

it('keeps same-day ordering independent of input order when a dated record has no published command sequence',()=>{
 const nodes=[{id:'a',date:'2025-09-01',sequence:1},{id:'b',date:'2025-09-01'},{id:'c',date:'2025-09-01',sequence:2}],orders:string[][]=[]
 for(const a of nodes)for(const b of nodes.filter(n=>n!==a))for(const c of nodes.filter(n=>n!==a&&n!==b))orders.push([a,b,c].sort(seasonEchoOrder).map(n=>n.id))
 expect(new Set(orders.map(order=>order.join(','))).size).toBe(1)
 expect(orders[0]).toEqual(['c','a','b'])
 const later={id:'later',date:'2025-09-02'}
 expect([...nodes,later].sort(seasonEchoOrder)[0]).toBe(later)
})
