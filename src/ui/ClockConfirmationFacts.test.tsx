import {afterAll,beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {ClockConfirmationFacts} from './ClockConfirmationFacts.tsx'
import raw from '../../goal-1/evidence/t17-acceptance-40/usability-review-r9/saved194-before-preview-update.json?raw'

let controller:GameController,store:IndexedDbRunStore
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-clock-confirm-real194'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw)})
afterAll(async()=>{await controller?.close();await store?.close()})

it('shows the actual1514.56 known commitment separately from clock0 and does not double-add accrued or subtract the held1500',()=>{
 const command=controller.prepare('AdvanceTime',{date:'2025-04-02'}),preview=controller.preview(command),clock=controller.clockCommitments(command),before=controller.exportSaved()
 expect(preview).toMatchObject({allowed:true,upfrontCostFen:0,actionPoints:0})
 const html=renderToStaticMarkup(<ClockConfirmationFacts clock={clock} newCostFen={preview.upfrontCostFen} newActionPoints={preview.actionPoints} accountName={id=>id==='personal'?'个人账户':'原中转账户'}/>)
 expect(html).toContain('已有安排的本段已知待付');expect(html).toContain('原中转账户');expect(html).toContain('¥1,514.56')
 expect(html).not.toContain('¥1,524.56');expect(html).not.toContain('¥1,527.89')
 expect(html).toContain('推进新增¥0 / 0点');expect(html).toContain('原预留使用行动')
 expect(html).toContain('不另占一份');expect(html).toContain('2025-04-01');expect(html).toContain('2025-04-02')
 expect(controller.exportSaved()).toBe(before);expect(before).toBe(raw)
})

it('keeps original account commitments separate instead of presenting one pooled spendable number',()=>{
 const command=controller.prepare('AdvanceTime',{date:'2025-05-01'}),preview=controller.preview(command),clock=controller.clockCommitments(command),before=controller.exportSaved()
 const due=clock.accounts.filter(a=>a.outflows.length)
 expect(due.length).toBeGreaterThan(1)
 const html=renderToStaticMarkup(<ClockConfirmationFacts clock={clock} newCostFen={preview.upfrontCostFen} newActionPoints={preview.actionPoints} accountName={id=>id==='personal'?'个人账户':id}/>)
 expect(html).toContain('个人账户');for(const a of due)if(a.accountId!=='personal')expect(html).toContain(a.accountId)
 expect(controller.exportSaved()).toBe(before)
})

it('does not turn an unknown projected amount into a zero-cost commitment',()=>{
 const clock=controller.clockCommitments(controller.prepare('AdvanceTime',{date:'2025-04-02'}))
 // Controlled malformed PUBLIC input, not an executed financial state or normal outcome.
 const malformed={...clock,accounts:clock.accounts.map(a=>({...a,outflows:a.outflows.map(f=>({...f,amountFen:Number.NaN}))}))}
 const html=renderToStaticMarkup(<ClockConfirmationFacts clock={malformed} newCostFen={0} newActionPoints={0} accountName={()=>'原账户'}/>)
 expect(html).toContain('待核对');expect(html).not.toContain('当前原排程未列本段待付')
})
