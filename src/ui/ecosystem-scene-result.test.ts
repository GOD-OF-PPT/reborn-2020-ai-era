import {beforeAll,expect,it} from 'vitest'
import {projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {campaignMarket} from '../application/campaign.ts'
import {prepareEco,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {createDeepseekFixture} from '../testing/deepseek-fixture.ts'
import {ecosystemSceneResult} from './ecosystem-scene-result.ts'
type Harness=ReturnType<typeof createDeepseekFixture>
function snapshot(h:Harness){return {...projectRun(h.run),saveStatus:'saved' as const,hasCandidate:false,readOnly:false,features:{deepseek:projectDeepseek(h.run,h.deepseek),workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog)}}}
type View=ReturnType<typeof snapshot>
let before:View,after:View,preSubmit:View,submitted:View,reviewed:View,preSupport:View,supported:View,preCollection:View,collected:View,preCancel:View,cancelled:View
beforeAll(()=>{
 // Isolated fixed rule fixture only; no browser or normal-campaign acceptance.
 const {h,lead}=prepareEco();before=snapshot(h);h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')});after=snapshot(h)
 const c=h.run.deepseek!.contracts[0]!;h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.productionJobId)!.completeAt});preSubmit=snapshot(h);h.send('SubmitEcoDelivery',{contractId:c.id});submitted=snapshot(h);h.send('AdvanceTime',{date:c.reviewAt!});reviewed=snapshot(h);preSupport=reviewed;h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.supportJobId)!.completeAt});supported=snapshot(h)
 const d=h.run.deepseek!.deliveries[0]!;h.send('AdvanceTime',{date:d.dueAt>h.run.timeline.cursor.date?d.dueAt:h.run.timeline.cursor.date});preCollection=snapshot(h);h.send('CollectEcoReceivable',{deliveryId:d.id,amountFen:60000});collected=snapshot(h)
 const second=prepareEco();second.h.send('AcceptEcoContract',{leadId:second.lead.id,scope:'standard',...dsAssignment('2024-07-02')});preCancel=snapshot(second.h);second.h.send('CancelEcoContract',{contractId:second.h.run.deepseek!.contracts[0]!.id});cancelled=snapshot(second.h)
})
it('describes acceptance as protected prepayment and separate production/support reservations',()=>{
 const result=ecosystemSceneResult('AcceptEcoContract',before,after)!
 expect(result).toContain('收到客户预款¥3,000并全额保护，尚未确认收入');expect(result).toContain('自有制作与支持共预留¥1,500');expect(result).toContain('支持另在')
})
it('describes actual 80 percent acceptance and 20 percent support as revenue and original receivables, never new cash',()=>{
 const production=ecosystemSceneResult('AdvanceTime',submitted,reviewed)!,support=ecosystemSceneResult('AdvanceTime',preSupport,supported)!
 expect(production).toContain('确认收入¥4,800');expect(production).toContain('消费原预款¥3,000');expect(production).toContain('新增原应收¥1,800');expect(production).toContain('没有收取新的现金')
 const first=production.split('。')[0]!
 expect(first).toContain('原生产已经由客户实际验收');expect(first).toContain('确认收入¥4,800');expect(first).toContain('原支持同日开工');expect(first).toContain('支付原自有预算¥700')
 expect(production).not.toContain('没有新增免费行动或服务收入');expect(production.match(/支付原自有预算¥700/g)).toHaveLength(1)
 expect(support).toContain('支持已经实际完成');expect(support).toContain('确认收入¥1,200');expect(support).toContain('消费原预款¥0');expect(support).toContain('新增原应收¥1,200')
})
it('dates personal submission and real partial collection separately and refuses candidate or nonadjacent transitions',()=>{
 expect(ecosystemSceneResult('SubmitEcoDelivery',preSubmit,submitted)).toContain('已亲手交给客户')
 expect(ecosystemSceneResult('CollectEcoReceivable',preCollection,collected)).toContain('实际收回¥600')
 expect(ecosystemSceneResult('CollectEcoReceivable',preCollection,collected)).toContain('没有再确认一次收入')
 expect(ecosystemSceneResult('CollectEcoReceivable',preCollection,{...collected,hasCandidate:true,saveStatus:'unsaved'})).toBeNull()
 expect(ecosystemSceneResult('CollectEcoReceivable',preCollection,{...collected,revision:collected.revision+1})).toBeNull()
 expect(ecosystemSceneResult('AdvanceTime',preCollection,collected)).toBeNull()
})
it('reports actual cancellation cash and remaining liability from this original contract',()=>{
 const text=ecosystemSceneResult('CancelEcoContract',preCancel,cancelled)!
 expect(text).toContain('实际付出¥3,000');expect(text).toContain('原义务待付¥0');expect(text).toContain('未履约预款¥3,000');expect(text).toContain('原支持退出补偿¥0')
})
it('reports a real capital transfer and preparation execution without treating own capital as profit',()=>{
 const h=createDeepseekFixture();h.send('AdvanceTime',{date:'2024-05-06'});const old=snapshot(h);h.send('OpenEcosystemService',{capitalFen:2000000});const open=snapshot(h),b=h.run.operations!.businesses.at(-1)!
 expect(ecosystemSceneResult('OpenEcosystemService',old,open)).toContain('个人自有资本¥20,000已转入');expect(ecosystemSceneResult('OpenEcosystemService',old,open)).toContain('不记服务收入或费用')
 h.send('StartEcosystemPreparation',{businessId:b.id,preparation:'materials',...dsAssignment('2024-05-06')})
 expect(ecosystemSceneResult('StartEcosystemPreparation',open,snapshot(h))).toContain('支付自有资金¥300')
})

it('distinguishes planned reservation, actual start cash and actual preparation completion over original time commands',()=>{
 const h=createDeepseekFixture();h.send('AdvanceTime',{date:'2024-05-06'});h.send('OpenEcosystemService',{capitalFen:2000000});const b=h.run.operations!.businesses.at(-1)!,opened=snapshot(h)
 h.send('StartEcosystemPreparation',{businessId:b.id,preparation:'materials',...dsAssignment('2024-05-07')});const planned=snapshot(h)
 expect(ecosystemSceneResult('StartEcosystemPreparation',opened,planned)).toContain('尚未实际支付')
 h.send('AdvanceTime',{date:'2024-05-07'});const running=snapshot(h),started=ecosystemSceneResult('AdvanceTime',planned,running)!
 expect(started).toContain('实际开工');expect(started).toContain('支付原自有预算¥300');expect(started).toContain('原预留转为实际使用')
 h.send('AdvanceTime',{date:'2024-05-14'});const completed=ecosystemSceneResult('AdvanceTime',running,snapshot(h))!
 expect(completed).toContain('原服务材料已经实际完成');expect(completed).not.toContain('客户的实际回信')
})

it('publishes the complete new remediation/support pair while keeping old spent budgets and original prepayment separate',()=>{
 const failed=()=>{const r=prepareEco({parameters:{deliveryAcceptBps:0}}),h=r.h;h.send('AcceptEcoContract',{leadId:r.lead.id,scope:'pilot',...dsAssignment('2024-07-02')});const c=h.run.deepseek!.contracts[0]!;h.send('AdvanceTime',{date:'2024-07-05'});h.send('SubmitEcoDelivery',{contractId:c.id});h.send('AdvanceTime',{date:'2024-07-08'});return {h,c}}
 const r=failed(),old=snapshot(r.h);expect(r.h.preview('StartEcoRemediation',{contractId:r.c.id,...dsAssignment('2024-07-08')})).toMatchObject({allowed:false,reasonCodes:expect.arrayContaining(['ECO_FUTURE_START_REQUIRED'])});r.h.send('StartEcoRemediation',{contractId:r.c.id,...dsAssignment('2024-07-09')});const planned=snapshot(r.h),copy=ecosystemSceneResult('StartEcoRemediation',old,planned)!
 expect(copy.split('。')[0]).toContain('共预留自有预算¥800、2点');expect(copy).toContain('本次新增安排尚未付款');expect(copy).toContain('支持另在2024-07-19—2024-07-22');expect(copy).toContain('此前已付¥400仍保留');expect(copy).toContain('不重复收取或提前确认收入')
 expect(ecosystemSceneResult('StartEcoRemediation',old,{...planned,saveStatus:'unsaved',hasCandidate:true})).toBeNull()
 r.h.send('AdvanceTime',{date:'2024-07-09'});const started=ecosystemSceneResult('AdvanceTime',planned,snapshot(r.h))!
 expect(started).toContain('这次补救实际开工');expect(started).toContain('支付原自有预算¥500');expect(started).toContain('后续支持仍预留¥300与1点')
})
