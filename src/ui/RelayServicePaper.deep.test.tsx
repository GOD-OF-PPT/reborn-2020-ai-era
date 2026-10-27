import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {OpeningObject} from './OpeningObject.tsx'
import {RelayServicePaper,type RelayServicePaperState} from './RelayServicePaper.tsx'

it('keeps a credit contract separate from actual old protected funds without printing money into the artwork',()=>{
 const credit:RelayServicePaperState={phase:'commitment',state:'agreed',heading:'',ticket:'customer-credit',paymentNature:'credit',hasPrepaidProtection:false}
 const plain=renderToStaticMarkup(<RelayServicePaper art={credit}/>),protectedOld=renderToStaticMarkup(<RelayServicePaper art={{...credit,hasPrepaidProtection:true}}/>)
 expect(plain).toContain('selected-ticket-customer-credit');expect(plain).not.toContain('actual-customer-protection-band')
 expect(protectedOld).toContain('actual-customer-protection-band')
 for(const html of [plain,protectedOld])expect(html).not.toMatch(/<(?:text|foreignObject|button|script)\b|¥|收入|20\d{2}-\d{2}-\d{2}/)
})

it('keeps a partial original invoice open and distinguishes outgoing customer refunds from returned supplier assets',()=>{
 const invoice:RelayServicePaperState={phase:'result',state:'received',heading:'',ticket:'partial-receipt',paymentNature:'collection'}
 const partial=renderToStaticMarkup(<RelayServicePaper art={invoice}/>),refund=renderToStaticMarkup(<RelayServicePaper art={{...invoice,ticket:'customer-refund',paymentNature:'customer-refund'}}/>),asset=renderToStaticMarkup(<RelayServicePaper art={{...invoice,ticket:'supplier-return',paymentNature:'supplier-return'}}/>)
 expect(partial).toContain('relay-torn-edge');expect(partial).not.toContain('kept-period-record')
 expect(refund).toContain('actual-customer-refund-leaves');expect(refund).toContain('relay-refund-direction');expect(refund).not.toContain('actual-received-ticket-pair')
 expect(asset).toContain('actual-supplier-return-leaves');expect(asset).toContain('relay-asset-direction');expect(asset).not.toContain('actual-received-ticket-pair')
})

it('reveals a batch comparison only after its caller supplies completed review and keeps cancelled and interrupted support distinct',()=>{
 const planned:RelayServicePaperState={phase:'audit',state:'planned',heading:'',ticket:'audit-batch',support:'stopped',supportStatus:'cancelled'}
 const old=renderToStaticMarkup(<RelayServicePaper art={planned}/>),done=renderToStaticMarkup(<RelayServicePaper art={{...planned,state:'reviewed',supportStatus:'interrupted'}}/>)
 expect(old).toContain('uncompleted-batch-closed-stack');expect(old).not.toContain('completed-batch-open-comparison');expect(old).toContain('cancelled-support-fold')
 expect(done).toContain('completed-batch-open-comparison');expect(done).toContain('interrupted-support-split');expect(done).not.toContain('cancelled-support-fold')
})

it('keeps simultaneous responsibilities and all money facts readable in text mode over an unchanged protected object',()=>{
 const onActivate=vi.fn(),art:RelayServicePaperState={phase:'service',state:'ended',heading:'原服务结束，支持仍在',support:'stopped',supportStatus:'interrupted',ticket:'customer-credit',paymentNature:'credit',paymentLabel:'后付信用100元，原未回款40元',protectedBalanceLabel:'旧预款20元仍受保护',responsibility:'本期有已知差额',responsibilities:['本期有已知差额','本期到期款30元','本站另有应付10元']}
 const html=renderToStaticMarkup(<OpeningObject kind="work" appearance="relay" title="同一原服务" displayTitle="" detail="查看不写账" stageLabel="原服务记录" actionLabel="核对这份原票" onActivate={onActivate} disabled protection="unsaved" textOnly copyMode="tableau" relayPaper={art}/>)
 for(const fact of [art.heading,art.paymentLabel,art.protectedBalanceLabel,'本期到期款30元','本站另有应付10元','尚未保存 · 仍是上次的物件','核对这份原票'])expect(html).toContain(fact)
 expect(html.split('本期有已知差额')).toHaveLength(2);expect(html).toContain('data-relay-state="ended"');expect(html).toContain('data-protection="unsaved"')
 expect(html).not.toMatch(/<img\b|<svg\b/);expect(onActivate).not.toHaveBeenCalled()
})
