# 原R4两P2定向回应；R5仍未执行

选定fresh-public-readback-candidate-r5-final.mjs。r5.mjs为同次写入中的未执行草稿，最终只选-final；旧R4原文件及本根before真实原字节均保。没有修改产品/master或旧审。

## A 原已公开复核→更正→原计量完整链

completedAudit先按原audit全局ID唯一取回，再核同business/meter，strict合法completedAt<=当日，原job全局ID唯一、同business/relay-meter-audit、status completed、原start/complete有效、completeAt恰等audit完成日且<=当日。全部通过才读取audit.actualUnits，必须safe integer且>=0；未完成/未知/错job/非法日期直接throw，不触actual或补0。

correctionAuditChain核before/after唯一原meter同period/customer/business，before correctionId null；before/after同audit/job/完成日/公开actual相同。payload.correctUnits（single）与新增correction.correctUnits均必须等原已公开actual；correction.auditId/meterId/originalReportedUnits/date与原票匹配；afterMeter.correctionId反指本correction.id、after更正全局meter唯一，原报告/价格/terms/rate/交付/cost/due引用逐字段不变。bulk每新条都走同helper，新增meter唯一、全部原更正逐字段保留、计数恰old+new。0实计合法；不读meter.actualUnits/factId/queue。

## B 用途按真实来源与公开typed状态验证

R8每capture的Root-final recordFacts新增非空semanticRole；每unchanged组keys与members精确等集，成员key/role不重复、roles与recordFacts严格一致，0新命令/同run/revision/business/period/account/registry branch，且逐字等该purpose的固定原source、完整receipt metadata亦同。每purpose自己硬限定revision/required roles和canonical类型，old99不能被115冒用；所需5purpose各恰一组。

canonical-source-contract.json列已存在原件完整path/bytes/SHA/mode，R5内同表常量逐字段匹配，Root还需将其identity放wiring.canonicalSourceContract并纳referenceFiles。source.key/identity/run/revision/branch和scope由Root最终显式填，但原source只能选相应已知类型：old99=原R7 r7-03，1395376B/2d93804a…；old115=原R7 r7-22，2912610B/c1309f41…，不预测未来R8新command hash。原95=原stop s05/020e66c0…；settled92可Root显选原R6 r6-06/67a1e70b…或原R4 n17/8b6383a3…，只许明确key，不自动latest；working89额外原R4 n09/e2456a6d…若实际取证。

typedSourceFacts仍只读公开来源：95=已停止请求/原服务中断或取消/支持planned/audit planned/0可用AP，对应kept-stopped；92=原Q4财务closed、period原单净未收0、实际33已供应计量尚未有效完成复核，对应settled-unreviewed；115=Jan28原期财务closed/原单清/全部有效完成复核且已知差额已解/Apr9实际quote5分fee0，kept-closed。working真实源89对应支持完成但原AR未收，不能将95叫working。已完成复核actual只在与A相同门槛后读取用于已知差额；未完成actual不读。

R8 mandatory groups：old115_today_and_draft_cancel至少独立old115_after_today、old115_after_draft_cancel；old99_confirmation_cancel需old99_after_confirmation_cancel；三原处境分别composition_stopped95/settled92/closed115各after_read。每成员是未来实际keys，模板仍null，整个template final=false/authorizedBy=null。可选working89需真实capture再填，不把它补造成已验画面。JSON只证原存档与公开状态、零新增命令；不证明视觉轮廓、第一页、草稿UI字段或UI书签。

## 仍保旧范围

完整producer/fresh所有keys、metadata原字面role/source/branch、全部receipt prefix、原金融cash/asset/AR/AP金额与来源、current full依赖/历史901边界、exact旧35/31继承、once/wx/output/只补readback不重跑green Create均未改。diff只新增两P2必要gate/来源模板。原R4独审不回写；R5仅静态候选，0syntax/import/codec/engine/readback/Browser/工程，等待art定向复核和Root最终真实cut+spec独审/另GO。
