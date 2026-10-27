# 深分支正常前史推荐 R1（只读准备，尚未冻结为本轮游戏输入）

结论：受限的root27原生导出与必要root33导出中，没有一份“独立复核已经完成、负差额已经公开、但还没有Correct”的saved_ui前缀。root27原116/118的168份audit和168条更正都已保存；其中2条正差额、5条负差额、161条零差额。root33原91的34份audit/34更正亦全已保存。不能把它们的旧更正叫R5新Correct，也不能从最终档剪掉corrections/ledger倒造输入。

可复用的成套输入已经足够安排两类有限新验证：①旧118阅读既有正负更正/原op引用和606分供应资产后，显选新部分资产退回；②原80新服务或原83已有正报告的服务，走新的停本期→等原支持真正开工→实际中断→保原费用/赔付/退款/欠款。新负向Correct本轮是否必须再做由Root保留缺口决定，不为追有利结果重扫seed或读取未审真值。

## 原字节与来源

|#|完整原生导出路径|bytes|SHA256|mode|runId|revision|date|
|---:|---|---:|---|---|---|---:|---|
|1|/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-27/chrome-main-r1/main-saved94-period-ended.json|2388576|fd84dd4f66de3e5e276557bbd247de92041c601fdcebc785f7566a153dbd10d9|644|normal-relay-technical_employee-ee9cb440|94|2025-02-25|
|2|/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-27/chrome-main-r1/main-saved116-original-period-settled.json|2891640|6b07af85cbb339febae1e86eabbe7490229580cf5b587bb4fc4ad9e434b72593|644|normal-relay-technical_employee-ee9cb440|116|2025-03-18|
|3|/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-27/chrome-normal-r5/normal-saved118-closed-period.json|2900985|73a542da47b270f9e02d533003ac6f8c803907037b586f0f29d5393ec49458fb|644|normal-relay-technical_employee-ee9cb440|118|2025-03-21|
|4|/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-27/chrome-stop-r5/stop-running93-before-original-stop.json|1197820|4aecbd255fdc098e06636110460113410ab245bcf09e3c77cec8f830de5e451e|644|normal-relay-technical_employee-ee9cb440|93|2025-01-28|
|5|/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-27/chrome-stop-r5/stop-saved94-support-and-old-debts-retained.json|1200676|5ad7831f40234bb13e5f32b0c1898bb90ad4f98e22f9a710277207680a9f1441|644|normal-relay-technical_employee-ee9cb440|94|2025-01-28|
|6|/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-33/chrome-main-r1/r4-saved80-front-completed-before-service.json|1074754|acd2f31053a6dcb59f5ec541d02978323b4bd1d6fd5d2cae29a9ad0c69f81f0c|644|normal-relay-technical_employee-ee9cb440|80|2024-10-08|
|7|/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-33/chrome-main-r1/r4-saved83-mid-service-first-original-due.json|1303721|3cb80dd318a12e740fdede5189d3a4d27ec073c7940dcc45f84c836f9eb2f8d5|644|normal-relay-technical_employee-ee9cb440|83|2024-10-23|
|8|/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-33/chrome-main-r1/r5-saved91-full-service-closed.json|1515442|75718c06bd918243a62c4b976ead09c1a9bdaaa80e2c36c328232ee5465ea662|644|normal-relay-technical_employee-ee9cb440|91|2024-11-30|

八份原文件均origin=normal、schema13、rules-t16-journey-v1；都匹配其父exports.jsonl的saved_ui bytes/SHA与root27/root33原sealed-evidence.files精确path/bytes/SHA/mode。sources.json保存每份原seal/manifest身份、原索引行与有限公开事实。只核这八份，不叫全seal850/570文件重验。root27的11份exports manifests另只读metadata盘点：其其它文件是原91/92的导入/候选/物理读回、116的只读副本或118/停止94的重进副本，没有遗漏一个meta已列的audit-ready中间新版本。候选92/导入buffer不推荐作已保存正常结果。

所有八份的runId都恰为normal-relay-technical_employee-ee9cb440，**不是同一条当前分支**：

- root27 Jan—Mar2025族：企业ops:60e1e4f1a8f744bbf167073569038995，账户ops:d85d2aa1cc29968ea1f91bb3f0d29ad2，六客户（四预付/两后付），期2025-01-28—02-25。main期id rly:503e6b6995b626f7c3bec7a0dd02e180；stop93/94另有期id rly:c89c1062f0ddd18e27ea8de398634f9e，属于另一显式分支，不能拼作main94的停期结果。
- root33 Oct—Nov2024族：企业ops:bb7f1c37abbfc1d51a6ca6ca76da18b5，账户ops:ef38539ec47df2b4efab6763c0c5bdf8，两客户（预付200元与后付信用200元），已存在期id rly:f0b021b3e0b75ccdae0eae2e2d6f4700。原80尚无期，原83有该期。它们可作有限独立输入，不与Root正在走的86→92、Nov17、0AP分支合并或按revision大小替换成“更完整进度”。每次实际恢复/导入前由Root保存当前分支并明确输入身份。

## 推荐表（覆盖、缺口与下一步）

|优先|原输入|公开已发生依据|可覆盖/新的动作候选|不能覆盖|
|---|---|---|---|---|
|A|#3 原118，2025-03-21|原期closed；168audit已完成/168已更正；2正/5负；供应池rly:aef4cf222ee352d232a2606bb93bb14f当前remaining606分、paidFen1010分；无未结义务；六原客户保护仍在|读已保存正/负更正与原op引用、供方贷项不是现金；原供应cedar-direct在同站Book显填部分退回，例如2.00元，原确认/保存后再核新cash200分、资产406分和收入不变。金额只是待显选候选，未执行/未获preview准入|没有新负Correct或新贷项生成；paidFen1010不是累计现金充值；原审计/更正不能重新计本轮新成果|
|A|#6 原80，2024-10-08|无period/meter/audit/correction；唯一Q4原action为Oct1—8营销已完成1AP/2000元；无workers、无active job、无未付义务；原企业cash26345.17元、客户保护200元；cedar许可已亲读批准至2025-07-17|让本轮新UI显选两客户、cedar-direct、本人资源、Oct9以后新服务与guided原支持，再在真实report>0后新StopPeriod，等原support实际开工后新InterruptJob；共3AP静态余量足以承接原服务1AP+原guided支持1AP（仍Root原preview核）|不能提前承诺一定有多少请求/用量、利润/赔付；无新审计结果，不预知未审真值|
|B|#7 原83，2024-10-23|期running、30条原报告合计4531单位；service Oct9—Nov6实际执行，support Nov6—13已预留；本季营销已耗1AP+服务已耗1AP+支持预留1AP；现金23248.21元、客户保护18.16元、支持预留1500元；14笔原未到期供方义务保留|更短的真实中断输入：直接新StopPeriod，原30计量及应收/到期责任保；沿原Clock/费用等到Nov6，公开support running后才Interrupt同supportJob；旧供应债务/客户预款/应收/原赔付分别留册|不能把旧服务安排叫本轮新做；尚无audit结果，不能直接Correct；不能跳过Oct24起旧义务的原停点/费用|
|B|#4 stop93，2025-01-28|六条已有报告，service running；同原support Feb25—Mar4 planned，另一明确期id|备用输入，可本轮新停这一份期，再沿其原support实际开工中断；比原80多客户/旧账，仅在Root需要旧六客复杂责任时用|不是main期；没有已审负差额，没有新供应资产|
|C|#5 stop94，2025-01-28|StopPeriod已经旧保存，原support planned且旧责任保|只读旧停期/原支持不随请求清除；后续可以新增support实际开工后的中断|旧Stop不能再计本轮；不证明已真实中断running support|
|C|#2 main116，2025-03-18|168全更正和同一606分供应池；原期尚有未来应收，随后118已收原客户5的1212分并closed|可保未到期/已关闭前后对照和原贷项历史；如需当次旧future due解释有原日期|仍没有ready新负Correct；不应为同资产优先选它制造额外等待|
|C|#1 main94，2025-02-25|168原报告、0完成audit，service完成/support刚开工|原支持中断备用，或只作为未审仍未知的原期输入|未公开实计，不能因后来116有负差额就指认94某张未审票的真值；不推荐为追负结果重复批次|
|C|#8 root33原91，2024-11-30|34audit/34更正全保存，仅一条正120分客户/60分供应、其余零；期closed|原正向更正、自己的新单due与结清历史对照|没有负差额或尚未Correct ready票，不可替当前新92分支|

## 已公开正负更正引用（历史读取，不是本轮新动作）

原116/118的五条负更正均已在2025-03-07实际保存，原报告1112→已核1011，客户delta=-606分、供方delta=-202分；完整五组auditId/meterId/correctionId/operationIds在sources.json的savedNonzeroCorrections。可用第一组示例：

- 原meter rly:74f69ecae52761965ccc78dd565ad1c1；已完成audit rly:6ac832f0937ff82c07fcaf5760abdce0；correction rly:d2349cb44f6454e92c0deaa3bb55292d。
- 客户/供应原操作rly:fae53a8e22270dd14831544720a5d1af、rly:5372236e2c1e4bafdd6088882df9348a。这里只从已保存correction读取引用，不解析raw signature，不把负成本当本次到账。
- 两条正更正都是910→1011、客户+606分/供方+202分，和161条零差额同批记录保。池剩606分只是当前资产，不能凭它倒拆每条更正当时“冲未付”与“付后恢复”的金额；Root须用新的公开casebook原序读回。

## 支持中断的有限路径（提出候选，不执行、不模拟未来）

1. 优先#6原80：Root导入并复核当前正常source/账户/全部公开资格与AP后，从空服务草稿显选原两客户、cedar-direct原已批准适配、player-production、未来开工日。可以显填原83已实际采用过的Oct9—Nov6候选、maxUnits10000与供应授权上限1000元、guided；这些不是默认值或收益承诺。原服务成本3000元/1AP与原guided1500元/1AP仅作为原83已保存ActionRecord投入参考，最终仍以本次preview/confirm为准。供应为原用量后账期模式，不要求无根据先充值新供应资产。
2. 保存后沿原Clock到实际开工/至少一条原报告reportedUnits>0（原83已有公开正报告可缩短前史）；仍未知的实计不看。新StopRelayPeriod只停眼前本期后续请求，不抢先Interrupt尚planned的support。实际原报告、原费用/保护/应收/供方到期责任都保，不能把未来客户应收当这时可花。
3. 原support自己的start/complete继续留册。根按原Clock/已公开due/交付/季度与强制屏障前进；即使待收款可显选先续原安排，旧款仍在。到该原support明确running并有executedAt后，再对同一jobId显选InterruptJob；不能用取消未开工代替真实中断，也不退已耗AP/成本。
4. 新支持停止/费用处理与原feePostedAt/compensatedAt、实际服务费/赔付、原义务、客户未消费款和供应账各自读回。金额/日期一律等实际新projection与原确认，不在本稿预报。若有限停站，先面对仍在的预款/退款/供方资产/应收应付，StopStation不清债；CloseBusiness必须满足原条件，必要时停在未清责任状态即可，不免费填钱或关闭。

## 访问与停止边界

仅JSON.parse envelope后读取上述公开来源：completedAt非null才访问audit.actualUnits；未审meter只用reported/date/supplier/原价等公开字段；只读已保存correction、原supplierPrepayment、original ActionRecord/资源日期、public accounts/reservations/obligations。没有访问meter.actualUnits（无论已审与否）、seed/lostDays/missedUnits/queue/facts/private note/ledger.signature；没有调用codec/projectors/replay/测试、浏览器、Git或产品写入。数量/原ActionRecord统计是有限源读取，不是经济规则重放或未来推演。

Root还需正式输入冻结前再实核来源、当前生产codec/版本、原preview、完整Create来源及Native保存与回读；本准备不声称这些前置已通过。新负向Correct的ready输入在本受限集合缺失，诚实保留；已有正负历史不重造。停止writer，不启动别的任务，不计新玩法/美术/整体目标完成。
