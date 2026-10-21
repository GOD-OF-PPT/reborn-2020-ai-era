# 5c-U1中转已提交回响的独立边界记录 r1

本增量仅修改src/ui/scene-result.ts及新增src/ui/relay-scene-result.test.ts。已读新RelaySceneChoice和relay-scene-progress mapper，沿原公开committed view前后比较；不改规则、其他UI或原计划，不跑正常长前史/矩阵/兼容。本文件先记录实现和定向测试边界，实际测试结果由另新输出如实保存，不以本文件当通过。

新增的回响只接受同runId、更新revision、当前saveStatus=saved且无candidate的两份公开投影；第一次没有previous、跨人生、未保存/仍在保存或没有对应ID变化都不会给中转新增成果回响。原firstOrder实际回款/待提交、workbench.pause、独立story回信优先级保持原顺序。

StartRelayServicePeriod只依据新增的真实period ID和原planned service job，列服务日期/原客户数/原support日期，明确只是预留、不是收入或回款。StartRelayAudit识别新增原audit job ID，planned显示开工季度AP/真实自有资金reservation且未付，running用该business账户原公开cost metric(referenceId=actionId)核已付金额、原job定义AP与实际start/complete日期；缺主体或费用映射不补0。没有读取GameRun动作/隐藏事实或把未来预留当已支出。

CorrectRelayPeriod仅核新增correction ID、原meterId/原completed audit、当前correctionId和原报告/价格/terms/rate不变，再说明追加原引用的条数；不声称现金到账或自动清债。AdvanceTime只对原ID已存在且从planned/running实际变completed的审计/支持/服务给回响，日期须已到；同一步多个完成事实一起保留。报告用量明确不代独立实计，支持完成不等于客户已经付款；中断/取消不当完成。不新增CollectRelayDue专用金额推断，保留原通用回响。

12项定向测试使用一次小单客户、28单位的真实隔离fixture命令生成公开projectRelay/projectWorkbench显示快照；不是正常2020完整前史，不把显示输入的saved标志当原生IDB提交证据。覆盖新period、未来audit预留与实际开工费用、缺费用/主体、真实audit完成、服务/支持分开和同次完成、实际原引用更正、无变化不重发、跨run/未保存/同revision、中断支持、原firstOrder/pause/story优先级、公开输入/fixture原文不变。synthetic状态覆盖只为显示边界，未计入全5c正常形态。root授权后仅运行这一文件，所有红输出另新轮次保留；严格types/build由根代理另执行。

当前5c-U1整体、完整5c/T17/goal和全部后续仍未完成。当前兼容开发/测试0，未改旧sealed目录或源规则；原Chrome/UI基线及实际保存/重载由根代理单独取证。
